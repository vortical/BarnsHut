import GUI from "lil-gui";
import { BodyScene, SceneOptionsState } from "./scene";
import LocationBar from "./LocationBar";


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
        backgroudLightLevel: bodyScene.getAmbiantLightLevel(),


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

    gui.add(options, "timescale", 1.0, 90, 1).name('Time Scale')
        .onChange((v: number) => bodyScene.setTimeScale(v));

    gui.add(options, "backgroudLightLevel", 0, 1, 0.01).name('Ambiant Light')
        .onChange((v: number) => bodyScene.setAmbiantLightLevel(v));

    gui.add(options, "pushState").name('Push State to Location Bar and History');

    gui.add(options, "reloadState").name('Reload Pushed State');
    
    return gui;
}