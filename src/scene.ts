import { AmbientLight, AxesHelper, Camera, Color, DirectionalLightHelper, Object3D, PCFShadowMap, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Dim } from './geometry';
import { Clock } from './Clock';
import { CompositeUpdater, SceneUpdater } from './SceneUpdater';
import { throttle } from './throttle';


export type BodySystemEvent<T> = {
    topic: string;
    message: T;
};

const CAMERA_NEAR = 500;
const CAMERA_FAR = 13000000000;


const defaultSceneProperties: Required<SceneOptionsState> = {
    fov: 1.5,
    ambientLightLevel: 0.025,
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
    controls: OrbitControls;
    ambiantLight: AmbientLight;
    parentElement: HTMLElement;
    size!: Dim;
    clock: Clock;
    sceneUpdaters: CompositeUpdater = new CompositeUpdater();
    objects3D: Object3D[];

    constructor(parentElement: HTMLElement, sceneUpdater: SceneUpdater, stateOptions:SceneOptionsState){

        const options  = { ...defaultSceneProperties, ...stateOptions };        
        const canvasSize = new Dim(parentElement.clientWidth, parentElement.clientHeight);
        this.parentElement = parentElement;
        this.camera = createCamera();
        this.scene = createScene();
        this.renderer = createRenderer();
        this.sceneUpdaters.addUpdater(sceneUpdater);
        
        this.clock = new Clock(options.date);
        document.body.appendChild(this.renderer.domElement);
        parentElement.append(this.renderer.domElement);
        this.controls = createControls(this.camera, this.renderer.domElement);
        this.controls.enabled = false;
        this.ambiantLight = createAmbiantLight(options.ambientLightLevel);
        this.scene.add(this.ambiantLight);
        this.objects3D = this.createObjects3D();
        this.scene.add(...this.objects3D);
        this.controls.update();
        this.setFOV(options.fov);
        this.setSize(canvasSize);
        setupResizeHandlers(parentElement, (size: Dim) => this.setSize(size));
    }

    setCameraUp(v = new Vector3(0, 1, 0)) {
        this.camera.up.set(v.x, v.y, v.z);
    }
    getAmbiantLightLevel(): number {
        return this.ambiantLight.intensity;
    }

    setAmbiantLightLevel(level: number) {
        this.ambiantLight.intensity = level;
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
            this.sceneUpdaters.update(this.objects3D, deltaTime, this.clock);
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
    createObjects3D(): Object3D[] {
        return [];

    }
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


function createControls(camera: Camera, domElement: HTMLElement): OrbitControls {
    const controls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    return controls;
}