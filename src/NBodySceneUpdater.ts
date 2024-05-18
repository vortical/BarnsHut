import { Clock } from "./Clock.ts";
import { SceneUpdater } from './SceneUpdater.ts';
import { Object3D } from 'three';


/**
 */
export class NBodySystemUpdater implements SceneUpdater {
    isOneTimeUpdate = false;
    isEnabled = true;

    update(object3Ds: Object3D[], timestepMs: number, clock: Clock): Object3D[] {
        return object3Ds;
    }
}