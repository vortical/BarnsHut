import GUI from "lil-gui";
import { BodyScene, SceneOptionsState } from "./scene";
import LocationBar from "./LocationBar";
import { throttle } from "./throttle";


/**
 * A terse UI...
 */
export class SimpleUI {

    constructor(bodyScene: BodyScene, locationBar: LocationBar<SceneOptionsState>) {

        buildLilGui(bodyScene, locationBar);
        setupStatsPanel(bodyScene);


        // // Handle the history back button
        window.addEventListener('popstate', function (event) {
            if (event.state) {
                location.href = location.href;
            }
        });

    }
}

/**
 * Display status from the scene every seconde
 * 
 * @param scene 
 */
function setupStatsPanel(scene: BodyScene){
    const leafHitElement: HTMLLIElement = document.querySelector<HTMLLIElement>('#octree-leaf-hits')!;
    const compositeHitElement: HTMLLIElement = document.querySelector<HTMLLIElement>('#octree-composite-hits')!;
    const nodesElement: HTMLLIElement = document.querySelector<HTMLLIElement>('#octree-nodes')!;
    const depthElement: HTMLLIElement = document.querySelector<HTMLLIElement>('#octree-depth')!;
 
    function flashStats(){
        const stats = scene.updaterStats;

        const compHits =  (stats.composite / stats.total*100).toFixed(1);
        const leafHits =  (stats.leaf / stats.total*100).toFixed(1);

        leafHitElement.textContent = `Composite Hits: ${compHits}%`;
        compositeHitElement.textContent = `Leaf Hits: ${leafHits}%`;
        nodesElement.textContent = `Octree Nodes: ${stats.nodes}`;
        depthElement.textContent = `Octree Depth: ${stats.depth}`;
    }
    setInterval(flashStats, 1000);
}

function buildLilGui(bodyScene: BodyScene, locationBar: LocationBar<SceneOptionsState>): GUI {
    const gui = new GUI().title("Settings");

    const options = {
        fov: bodyScene.getFov(),
        timescale: bodyScene.getTimeScale(),
        colorHue: bodyScene.colorHue,
        octreeColorHue: bodyScene.octreeColorHue,
        nbParticles: bodyScene.getParticleCount(),
        sdRatio: bodyScene.getSdMaxRatio(),
        maxShownOctreeDepth: bodyScene.maxShownOctreeDepth,
        isOctreeShown: bodyScene.isOctreeShown,
        octreeOpacity: bodyScene.octreeOpacity,


        clearStats() {
            bodyScene.clearUpdaterStats();
        },
        pushState() {
            const state = bodyScene.getState();
            locationBar.pushState(state);
        },
        reloadState() {
            LocationBar.reload();
        },
    };


    // gui.add(options, "timescale", 1.0, 3600*6, 1).name('Time Scale')
    // time scale limits depends on a ratio of the masses and their distances.

    gui.add(options, "isOctreeShown",).name('Is Octree Shown')
        .onChange((v: boolean) => bodyScene.isOctreeShown = v);

    gui.add(options, "maxShownOctreeDepth", 1, 16, 1).name('Max Shown Octree Depth')
        .onChange(throttle(50, this, (v: number) => bodyScene.maxShownOctreeDepth = v));

    gui.add(options, "octreeColorHue", 0, 1, 1.0 / 360.0).name('Octree Color Hue')
        .onChange((v: number) => bodyScene.octreeColorHue = v);

    gui.add(options, "octreeOpacity", 0.05, 1.0, 0.05).name('Octree Opacity')
        .onChange((v: number) => bodyScene.octreeOpacity = v);

    gui.add(options, "timescale", 0.1, 30, 0.1).name('Time Scale')
        .onChange((v: number) => bodyScene.setTimeScale(v));

    gui.add(options, "colorHue", 0, 1, 1.0 / 360.0).name('Particle Color Hue')
        .onChange((v: number) => bodyScene.colorHue = v);

    gui.add(options, "nbParticles", 2, 20000, 1).name('Particle Count')
        .onChange(throttle(50, this, (v: number) => bodyScene.setParticleCount(v)));


    gui.add(options, "sdRatio", 0.1, 10, 0.1).name('S/D Ratio')
        .onChange((v: number) => bodyScene.setSdMaxRatio(v));

    gui.add(options, "fov", 1.0, 90, 1).name('Field Of Vue')
        .onChange((v: number) => bodyScene.setFOV(v));

    gui.add(options, "clearStats").name('Clear Stats');
    gui.add(options, "pushState").name('Push State to Location Bar and History');

    gui.add(options, "reloadState").name('Reload Pushed State');

    return gui;
}


