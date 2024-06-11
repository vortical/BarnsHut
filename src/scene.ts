import { Camera, Color, Fog, FogExp2, MathUtils,PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { ArcballControls } from 'three/examples/jsm/Addons.js';

import { Dim, V3 } from './geometry';
import { Body } from './Body';
import { Clock } from './Clock';
import { throttle } from './throttle';
import { NBodyOctreeSystemUpdater, LeapfrogNBodyOctreeSystemUpdater, EulerNBodyOctreeSystemUpdater } from './NBodyOctreeSceneUpdater';
import { ParticleGraphics } from './ParticleGraphics';
import { OctreeGraphics } from './OctreeGraphics';
import { boxOf, octreeOf } from './octree';

const CAMERA_NEAR = 5;
const CAMERA_FAR = 50000000000000;

const defaultSceneProperties: Required<SceneOptionsState> = {
    fov: 35.5,
    colorHue: 0.5,
    date: Date.now(),
    nbParticles: 500,
    sdRatio: 0.8,
    isOctreeShown: false,
    maxShownOctreeDepth: 1
};

export type SceneOptionsState = {
    fov?: number;
    colorHue?: number;
    date?: number;
    nbParticles?: number;
    sdRatio?: number;
    isOctreeShown?: boolean;
    maxShownOctreeDepth?:number;
};



/**
 * Our main facade class
 */
export class BodyScene {
    camera: PerspectiveCamera;
    scene: Scene;
    renderer: WebGLRenderer;
    controls: ArcballControls;
    parentElement: HTMLElement;
    size!: Dim;
    clock: Clock;
    sceneUpdater: NBodyOctreeSystemUpdater;
    particleGraphics: ParticleGraphics;
    bodies: Body[];
    stats: Stats;
    octreeGraphics: OctreeGraphics;
    
    constructor(parentElement: HTMLElement, sceneUpdater: NBodyOctreeSystemUpdater, stateOptions:SceneOptionsState){
        const options  = { ...defaultSceneProperties, ...stateOptions };        
        const canvasSize = new Dim(parentElement.clientWidth, parentElement.clientHeight);
        this.parentElement = parentElement;
        this.camera = createCamera();
        this.scene = createScene();
        this.renderer = createRenderer();

        this.sceneUpdater = sceneUpdater
        this.sceneUpdater.sdMaxRatio = options.sdRatio;
        this.clock = new Clock(options.date);
        this.stats = new Stats();
        parentElement.appendChild(this.stats.dom);
        parentElement.appendChild(this.renderer.domElement);
        this.controls = createControls(this.camera, this.renderer.domElement);
        this.controls.enabled = false;
        this.scene.background = new Color( 0x0a0a0a );
        this.bodies = createBodies(options.nbParticles);
        this.particleGraphics = new ParticleGraphics(1, options.colorHue, this.bodies);
        this.octreeGraphics = new OctreeGraphics(options.isOctreeShown);
        this.scene.add(this.particleGraphics.points);
        this.scene.add(this.octreeGraphics.line);
        this.controls.update();

        this.setFOV(options.fov);
        this.setSize(canvasSize);
        this.setViewPosition([0, 0 , 10000000], [0,0,0])
        setupResizeHandlers(parentElement, (size: Dim) => this.setSize(size));
    }

    get colorHue(): number {
        return this.particleGraphics.colorHue;
    }

    set colorHue(level: number) {
        this.particleGraphics.colorHue = level;
    }
    
    get octreeColorHue(): number {
        return this.octreeGraphics.colorHue;
    }

    set octreeColorHue(level: number) {
        this.octreeGraphics.colorHue = level;
    }

    set maxShownOctreeDepth(value: number){
        this.octreeGraphics.maxShownDepth = value;
    }

    get maxShownOctreeDepth(): number {
        return this.octreeGraphics.maxShownDepth;
    }

    set isOctreeShown(value: boolean){
        this.octreeGraphics.enabled = value;
    }

    get isOctreeShown(): boolean {
        return this.octreeGraphics.enabled;
    }

    clearStats() {
        this.sceneUpdater.clearStats();
    }


    setViewPosition(cameraPosition: V3, target: V3) {
        this.controls.target.set(target[0], target[1], target[2]);
        this.camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
    }

    setCameraUp(v = new Vector3(0, 1, 0)) {
        this.camera.up.set(v.x, v.y, v.z);
    }

    setSdMaxRatio(ratio: number) {
        this.sceneUpdater.sdMaxRatio = ratio; 
    }

    getSdMaxRatio(): number {
        return this.sceneUpdater.sdMaxRatio;
    }

    getParticleCount() {
        return this.bodies.length;
    }

    setParticleCount(count: number) {
        const bodies = createBodies(count);
        this.particleGraphics.setBodies(bodies);
        this.bodies = bodies;
    }



    getFov(): number {
        return this.camera.getEffectiveFOV();
    }

    setFOV(fov: number) {
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
    }

    getTimeScale(): number {
        return this.clock.getScale();
    }

    setTimeScale(timesScale: number) {
        this.clock.setScale(timesScale)
    }    

    getState(): SceneOptionsState {
        const options: SceneOptionsState = {};
        options.fov = this.getFov();
        options.colorHue = this.getColorHue();
        options.date = this.clock.getTime();
        options.nbParticles = this.getParticleCount();
        options.sdRatio = this.sceneUpdater.sdMaxRatio;
        options.isOctreeShown = this.isOctreeShown;
        return options;
    }

    start() {    
        this.render();
        const timer = this.clock.startTimer("AnimationTimer");
        this.controls.enabled = true;

        this.renderer.setAnimationLoop(async () => {
            const delta = timer.getDelta()!;
            await this.tick(delta);                     
            this.controls.update();
            this.render();
            this.stats.update();
        });
    }


    /**
     * @returns screen size
     */
    getSize(): Dim {
        return this.size;
    }

    /**
     * 
     * @param size screen size
     */
    setSize(size: Dim) {
        this.size = size;
        this.camera.aspect = size.ratio();
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(size.w, size.h);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.render();
    }

    /**
     * Updates the kinematics of our objects.
     * 
     * @param deltaTime 
     * @returns 
     */
    tick(deltaTime: number) {
        return new Promise((resolve) => {
            const octree = octreeOf(this.bodies, boxOf(this.bodies));

            const positionAttributeBuffer = this.particleGraphics.points.geometry.attributes.position;
            this.sceneUpdater.update(octree, positionAttributeBuffer.array, this.bodies, deltaTime);
            positionAttributeBuffer.needsUpdate = true;

            this.octreeGraphics.update(octree);
            resolve(null);
        });
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

function createBodies(count: number): Body[] {
    const bodies = [];  

    const spread11 =  500000;
    const spread12 =  2000000;
    const spread21 = -2000000;
    const spread22 = -500000;
    const speed = 1000;
    const speed2 = 2000;

    const offset = 10
    for ( let i = 0; i < count/2; i ++ ) {
        const mass = 1e20;
        const radius = 10e3;
        const position: V3 = [MathUtils.randFloat(spread11, spread12), MathUtils.randFloat(spread11, spread12), MathUtils.randFloat(spread11, spread12)];
        const velocity: V3 =  [MathUtils.randFloat(-speed2/2, -speed2 ), MathUtils.randFloat(-speed2/2, -speed2 ),MathUtils.randFloat(-speed2/6, -speed2/5 )];
        bodies.push(new Body(mass, radius, position, velocity));
    }

    for ( let i = 0; i < count/2; i ++ ) {
        const mass = 1e20;
        const radius = 10e3;
        const position: V3 = [MathUtils.randFloat(spread21, spread22), MathUtils.randFloat(spread21, spread22), MathUtils.randFloat(spread21, spread22)];
        const velocity: V3 =  [MathUtils.randFloat(speed2/2, speed2 ), MathUtils.randFloat(speed2/2, speed2 ), MathUtils.randFloat(speed2/6, speed2/5 )];
        bodies.push(new Body(mass, radius, position, velocity));
    }

    return bodies;
}


function setupResizeHandlers(container: HTMLElement, sizeObserver: (size: Dim) => void) {
    window.addEventListener("resize",
        throttle(1000 / 30, undefined,
            (event: UIEvent) => {
                sizeObserver(new Dim(container.clientWidth, container.clientHeight));
            }
        ));
}

function createScene(): Scene {
    const scene = new Scene();
                                  // 5000000000
    // scene.fog = new Fog( 0x000000, 1, 25000000 );
    scene.fog = new FogExp2( 0x000000, 0.0000000075 );
    scene.background = new Color('black');
    return scene;
}

function createCamera({ fov = 35, aspectRatio = 1.0, near = CAMERA_NEAR, far = CAMERA_FAR } = {}): PerspectiveCamera {
    return new PerspectiveCamera(fov, aspectRatio, near, far);
}

function createRenderer(): WebGLRenderer {
    const renderer = new WebGLRenderer({ antialias: true });
    return renderer
}

function createControls(camera: Camera, domElement: HTMLElement): ArcballControls {
    // const controls = new OrbitControls(camera, domElement);
    const controls = new ArcballControls(camera, domElement);

    // controls.enableDamping = true;
    return controls;
}






// function acreateParticles(): [Points, Body[]] {

//     const v = { x: -573.8733329927818, y: -781.9533749710408, z: -409.1276938730193 };
//     const d = { x: -307304783.7767792, y: 181536068.80307007, z: 105563387.89339447 };

//     const moon = new Body(
//         7.342e22,
//         1737400, 
//         [d.x, d.y, d.z],
//         [v.x, v.y, v.z]
        
//     )
//     const earth = new Body(
//         5.972168e24,
//         6371000, 
//         [0,0,0],
//         [0,0,0]
        
//     )




//     const vertices = [];

//     const bodies = [];



//     vertices.push( earth.position[0], earth.position[1], earth.position[2] );
//     vertices.push( moon.position[0], moon.position[1], moon.position[2] );

//     bodies.push(earth);
//     bodies.push(moon);

//     const textureLoader = new TextureLoader();

//     const circle = textureLoader.load( '/public/assets/disc.png' );
//     const geometry = new BufferGeometry();
//     geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3))
//     const material = new PointsMaterial( { size: 5000000, color: 0xff0000, map: circle } );
//     const points = new Points( geometry, material );

//     return [points, bodies];

    
// }