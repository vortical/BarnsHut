import { AdditiveBlending, AmbientLight, AxesHelper, BoxGeometry, BufferAttribute, BufferGeometry, Camera, Color, DirectionalLightHelper, Float32BufferAttribute, Fog, FogExp2, MathUtils, Mesh, MeshBasicMaterial, Object3D, PCFShadowMap, PerspectiveCamera, Points, PointsMaterial, SRGBColorSpace, Scene, TextureLoader, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Dim, V3 } from './geometry';
import { Body } from './Body';
import { Clock } from './Clock';

import { throttle } from './throttle';
import { NBodyOctreeSystemUpdater } from './NBodyOctreeSceneUpdater';
import { ArcballControls } from 'three/examples/jsm/Addons.js';




const CAMERA_NEAR = 500;
const CAMERA_FAR = 500000000000;


const defaultSceneProperties: Required<SceneOptionsState> = {
    fov: 35.5,
    ambientLightLevel: 0.5,
    date: Date.now(),
};


export type SceneOptionsState = {
    fov?: number;
    ambientLightLevel?: number;
    date?: number;
};


/**
 * Our main facade class
 */
export class BodyScene {
    camera: PerspectiveCamera;
    scene: Scene;
    renderer: WebGLRenderer;
    controls: ArcballControls;
    ambiantLight: AmbientLight;
    parentElement: HTMLElement;
    size!: Dim;
    clock: Clock;
    sceneUpdater: NBodyOctreeSystemUpdater;
    particles: Points;
    bodies: Body[]
    

    constructor(parentElement: HTMLElement, sceneUpdater: NBodyOctreeSystemUpdater, stateOptions:SceneOptionsState){

        const options  = { ...defaultSceneProperties, ...stateOptions };        
        const canvasSize = new Dim(parentElement.clientWidth, parentElement.clientHeight);
        this.parentElement = parentElement;
        this.camera = createCamera();
        this.scene = createScene();
        this.renderer = createRenderer();
        this.sceneUpdater = sceneUpdater
        
        this.clock = new Clock(options.date);
    
        parentElement.appendChild(this.renderer.domElement);
        this.controls = createControls(this.camera, this.renderer.domElement);
        this.controls.enabled = false;
    //    this.ambiantLight = createAmbiantLight(options.ambientLightLevel);
        // this.scene.add(this.ambiantLight);
        this.scene.background = new Color( 0x0a0a0a );
        [this.particles, this.bodies] = createParticles();

        this.scene.add(this.particles);
        this.controls.update();
        this.setFOV(options.fov);
        this.setSize(canvasSize);
        
        this.setViewPosition([0, 0 , 10000000], [0,0,0])
        setupResizeHandlers(parentElement, (size: Dim) => this.setSize(size));
    }

    setViewPosition(cameraPosition: V3, target: V3) {

        this.controls.target.set(target[0], target[1], target[2]);
        this.camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
    }

    setCameraUp(v = new Vector3(0, 1, 0)) {
        this.camera.up.set(v.x, v.y, v.z);
    }
    // getAmbiantLightLevel(): number {
    //     return this.ambiantLight.intensity;
    // }

    // setAmbiantLightLevel(level: number) {
    //     this.ambiantLight.intensity = level;
    // }

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
        options.ambientLightLevel = this.getAmbiantLightLevel();
        options.date = this.clock.getTime();
        return options;
    }

    start() {
    
        this.render();
        const timer = this.clock.startTimer("AnimationTimer");
        this.controls.enabled = true;

        this.renderer.setAnimationLoop(async () => {
            const delta = timer.getDelta()!;
            await this.tick(delta);            
            // this.tick(delta);            
            this.controls.update();
            this.render();
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
     * Trigger the mechanism that ultimately updates the positions of our objects.
     * 
     * @param deltaTime 
     * @returns 
     */
    tick(deltaTime: number) {
        return new Promise((resolve) => {
            const positionAttributeBuffer = this.particles.geometry.attributes.position;
            this.sceneUpdater.update(positionAttributeBuffer.array, this.bodies, deltaTime);
            positionAttributeBuffer.needsUpdate = true;
            resolve(null);
        });
    }



    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /** 
     * @param bodies 
     * @returns Map<string, BodyObject3D> 
     */

}

function createParticles(): [Points, Body[]] {
    const vertices = [];

    const bodies = [];
    const textureLoader = new TextureLoader();

   

    for ( let i = 0; i < 4000; i ++ ) {
    // for ( let i = 0; i < 2; i ++ ) {
        const x = MathUtils.randFloatSpread(2000000);
        const y =MathUtils.randFloatSpread(2000000);
        const z = MathUtils.randFloatSpread(2000000);
        vertices.push( x, y, z );

        // bodies.push(new Body(1e16, 10000, [x, y, z], 
        bodies.push(new Body(1e20, 10000, [x, y, z], 
            [MathUtils.randFloatSpread( 1000.5 ), 
                MathUtils.randFloatSpread( 1000.5 ),
                MathUtils.randFloatSpread( 1000.5 )]));      }
            // [MathUtils.randFloatSpread( 10.5 ), 
            //     MathUtils.randFloatSpread( 10.5 ),
            //     MathUtils.randFloatSpread( 10.5 )]));      }

   
    const circle = textureLoader.load( '/public/assets/disc.png', texture => texture.colorSpace = SRGBColorSpace );

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3))

    const material = new PointsMaterial( { size: 50000, sizeAttenuation: true, map: circle,  alphaTest: 0.5,transparent: true  } );
    material.color.setHSL( 0.55, 0.8, 0.5, SRGBColorSpace );
    const points = new Points( geometry, material );

    return [points, bodies];
}


function acreateParticles(): [Points, Body[]] {

    const v = { x: -573.8733329927818, y: -781.9533749710408, z: -409.1276938730193 };
    const d = { x: -307304783.7767792, y: 181536068.80307007, z: 105563387.89339447 };

    const moon = new Body(
        7.342e22,
        1737400, 
        [d.x, d.y, d.z],
        [v.x, v.y, v.z]
        
    )
    const earth = new Body(
        5.972168e24,
        6371000, 
        [0,0,0],
        [0,0,0]
        
    )




    const vertices = [];

    const bodies = [];



    vertices.push( earth.position[0], earth.position[1], earth.position[2] );
    vertices.push( moon.position[0], moon.position[1], moon.position[2] );

    bodies.push(earth);
    bodies.push(moon);

    const textureLoader = new TextureLoader();

    const circle = textureLoader.load( '/public/assets/disc.png' );
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3))
    const material = new PointsMaterial( { size: 5000000, color: 0xff0000, map: circle } );
    const points = new Points( geometry, material );

    return [points, bodies];

    
}


function createAmbiantLight(intensity: number) {
    return new AmbientLight("white", intensity);
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
    scene.fog = new FogExp2( 0x000000, 0.000000075 );
    scene.background = new Color('black');
    return scene;
}

function createCamera({ fov = 35, aspectRatio = 1.0, near = CAMERA_NEAR, far = CAMERA_FAR } = {}): PerspectiveCamera {
    return new PerspectiveCamera(fov, aspectRatio, near, far);
}

function createRenderer(): WebGLRenderer {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    return renderer
}


function createControls(camera: Camera, domElement: HTMLElement): ArcballControls {
    // const controls = new OrbitControls(camera, domElement);
    const controls = new ArcballControls(camera, domElement);

    // controls.enableDamping = true;
    return controls;
}