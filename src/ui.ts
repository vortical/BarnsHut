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
        

        // // Handle the history back button
        window.addEventListener('popstate', function (event) {
            if (event.state) {
                location.href = location.href;
            }
        });

    }
}

function buildLilGui(bodyScene: BodyScene, locationBar: LocationBar<SceneOptionsState>): GUI {
    const gui = new GUI().title("Settings");

    const options = {
        fov: bodyScene.getFov(),
        timescale:bodyScene.getTimeScale(),
        colorHue: bodyScene.getColorHue(),
        nbParticles: bodyScene.getParticleCount(),
        sdRatio: bodyScene.getSdMaxRatio(),
    //    backgroudLightLevel: bodyScene.getAmbiantLightLevel(),


        pushState() {
            const state = bodyScene.getState();
            locationBar.pushState(state);
        },
        reloadState() {
            LocationBar.reload();
        },        
    };

    gui.add(options, "fov", 1.0, 90, 1).name('Field Of Vue')
        .onChange((v: number) => bodyScene.setFOV(v));

    // gui.add(options, "timescale", 1.0, 3600*6, 1).name('Time Scale')
    // time scale limits depends on a ratio of the masses and their distances.
    gui.add(options, "timescale", 1.0, 10, 1).name('Time Scale')
        .onChange((v: number) => bodyScene.setTimeScale(v));

    gui.add(options, "colorHue", 0, 1, 1.0/360.0).name('Color Hue')
        .onChange((v: number) => bodyScene.setColorHue(v));

    gui.add(options, "nbParticles", 1, 20000, 100).name('Particle Count')
        .onChange(throttle(50, this, (v: number) => bodyScene.setParticleCount(v)));
    
    gui.add(options, "sdRatio", 0.1, 10, 0.1).name('S/D Ratio')
        .onChange((v: number) => bodyScene.setSdMaxRatio(v));

    gui.add(options, "pushState").name('Push State to Location Bar and History');

    gui.add(options, "reloadState").name('Reload Pushed State');
    
    return gui;
}
