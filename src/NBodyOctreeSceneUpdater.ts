
import { Body, force, twoBodyForce } from "./Body.ts";

import { BufferAttribute, BufferGeometry, Object3D, Points, TypedArray } from 'three';
import { Box, V3, abs, centerOfMass, divideScalar, magnitude, substract } from "./geometry.ts";
import { PositionedMass } from "./Body.ts";
import { Octree, OctreeLeaf, boxOf, octreeOf } from "./octree.ts";

const DIM = 15.0e12; // meters
const DEFAULT_SD_MAX_RATIO = 1.00;
// const SD_MAX_RATIO = 0.1;
const stats = {
    leaf: 0,
    composite: 0,
    miss: 0,
    empty: 0
};


// function updateBodies(bodies: Body[], octree: Octree, time: number, sdMaxRatio: number=DEFAULT_SD_MAX_RATIO) {

//     const buf: V3 = [0, 0, 0];


//     function velocityAtAverageAcceleration() {
//         for (const b of bodies) {

//             b.acceleration = [0, 0, 0]
//             accelerate(b, octree);
//             b.updatePosition(time);
//         }
//         // accelerate again then average out before updating the velocity
//         for (const b of bodies) {
//             accelerate(b, octree);
//             b.acceleration = divideScalar(b.acceleration!, 2.0);
//             b.updateVelocity(time);

//         }

//     }

//     function xxx() {
//         for (const b of bodies) {
//             b.acceleration = [0, 0, 0]
//             accelerate(b, octree);
//             b.updatePosition(time);
//             b.updateVelocity(time);
//         }
//     }

//     // todo: enable switching between the 2 approaches.
//     // velocityAtAverageAcceleration();
//     xxx();
// }



export abstract class NBodyOctreeSystemUpdater {
    isOneTimeUpdate = false;
    isEnabled = true;
    sdMaxRatio: number;


    constructor(sdMaxRatio: number = 0.8){
        this.sdMaxRatio=sdMaxRatio;
    }

    accelerate(acceleratedObject: Body, tree: Octree, depth: number = 1) {

        if (tree.children == undefined) {// : slow: instanceof OctreeLeaf){
            stats.leaf += 1;

            for (const b of tree.bodies) {
                if (acceleratedObject !== b) {
                    acceleratedObject.addForceFromBody(b);
                }
            }

        } else {
            const s = tree.box.maxDimension;
            const com = tree.centerOfMass;
            const r = substract(com.position, acceleratedObject.position);
            const d = magnitude(r);

            if (s / d < this.sdMaxRatio) { 
                stats.composite += 1;
                acceleratedObject.addForce(force(r, d, com.mass, acceleratedObject.mass));

            } else {
                stats.miss += 1;
                for (const child of tree.children!) {
                    this.accelerate(acceleratedObject, child, depth + 1);
                }
            }

        }
    }

    abstract updateBodiesState(bodies: Body[], octree: Octree, timestep: number): void;

    


    update(particlePositions: TypedArray, bodies: Body[], timestepMs: number) {
        const octree = octreeOf(bodies, boxOf(bodies));
        this.updateBodiesState(bodies, octree, timestepMs / 1000.0);

        for (let i = 0, length = bodies.length; i < length; i++) {
            const position = bodies[i].position;
            const particleIndex = i * 3;
            particlePositions[particleIndex] = position[0];
            particlePositions[particleIndex + 1] = position[1];
            particlePositions[particleIndex + 2] = position[2];

        }
    }
}

export class LeapfrogNBodyOctreeSystemUpdater extends NBodyOctreeSystemUpdater {
    constructor(sdMaxRatio: number = 0.8) {
        super(sdMaxRatio);

    }

    updateBodiesState(bodies: Body[], octree: Octree, timestep: number): void {
        // not exactly leapfrog...
        for (const b of bodies) {

            b.acceleration = [0, 0, 0]
            this.accelerate(b, octree);
            b.updatePosition(timestep);
        }
        
        for (const b of bodies) {
            this.accelerate(b, octree);
            b.acceleration = divideScalar(b.acceleration!, 2.0);
            b.updateVelocity(timestep);

        }
    }
    
}

export class EulerNBodyOctreeSystemUpdater extends NBodyOctreeSystemUpdater {
    constructor(sdMaxRatio: number = 0.8) {
        super(sdMaxRatio);
    }

    updateBodiesState(bodies: Body[], octree: Octree, timestep: number): void {
        for (const b of bodies) {
            b.acceleration = [0, 0, 0]
            this.accelerate(b, octree);
            b.updatePosition(timestep);
            b.updateVelocity(timestep);
        }
    }
}
