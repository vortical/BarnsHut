import { Clock } from "./Clock.ts";
import { Object3D } from "three";


/**
 * Updaters are invoked within the animation loop. The role of a BodySystemUpdater
 * is to set the properties of each body based on the time.  
 */
export interface SceneUpdater {
    update(bodies: Object3D[], timeStepmS: number, clock: Clock): Object3D[];
    isOneTimeUpdate: boolean;
    isEnabled: boolean;
}



/**
 * Just a container of updaters acting as a single updater.
 */
export class CompositeUpdater implements SceneUpdater {

    sceneUpdaters: SceneUpdater[];

    isOneTimeUpdate: boolean = false
    isEnabled: boolean = true;

    constructor(bodySystemUpdaters: SceneUpdater[] = []) {
        this.sceneUpdaters = Array.from(bodySystemUpdaters);
    }

    update(objects3D: Object3D[], timeStepmS: number, clock: Clock): Object3D[] {

        this.sceneUpdaters.forEach(updater => {
            if (updater.isEnabled) {
                updater.update(objects3D, timeStepmS, clock);
            }
        });

        // discard injected 'OneTimeUpdate' updaters.
        this.sceneUpdaters = this.sceneUpdaters.filter(updater => !updater.isOneTimeUpdate);
        return objects3D;

    }

    addUpdater(updater: SceneUpdater) {
        this.sceneUpdaters.push(updater);
    }

}

