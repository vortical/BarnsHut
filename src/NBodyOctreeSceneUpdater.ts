
import { Body, force, twoBodyForce } from "./Body.ts";

import { BufferAttribute, BufferGeometry, Object3D, Points, TypedArray } from 'three';
import { Box, V3, abs, add, centerOfMass, divideScalar, magnitude, substract } from "./geometry.ts";
import { PositionedMass } from "./Body.ts";
import { Octree, OctreeLeaf, boxOf, octreeOf } from "./octree.ts";


const stats = {
    leaf: 0,
    composite: 0,
    total: 0,
    nodes:0,
    depth:0,
};



export abstract class NBodyOctreeSystemUpdater {
    isOneTimeUpdate = false;
    isEnabled = true;
    sdMaxRatio: number;
    octree?: Octree;


    constructor(sdMaxRatio: number = 0.8) {
        this.sdMaxRatio = sdMaxRatio;
    }

    clearStats() {
        stats.leaf = 0;
        stats.composite = 0;
        stats.total = 0; 

    }

    getStats() {
        if (this.octree !== undefined){
            stats.nodes = this.octree.nodeCount;
            stats.depth = this.octree.depth; 

        }
        return stats;
    }

    accelerate(acceleratedObject: Body, tree: Octree, depth: number = 1) {

        if (tree.children == undefined) {// : slow: instanceof OctreeLeaf){


            for (const b of tree.bodies) {
                if (acceleratedObject !== b) {
                    stats.leaf += 1;
                    stats.total += 1;
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
                stats.total += 1;
                acceleratedObject.addForce(force(r, d, com.mass, acceleratedObject.mass));

            } else {

                for (const child of tree.children!) {
                    this.accelerate(acceleratedObject, child, depth + 1);
                }
            }

        }
    }

    abstract updateBodiesState(bodies: Body[], octree: Octree, timestep: number): void;




    update(octree: Octree, particlePositions: TypedArray, bodies: Body[], timestepMs: number) {
        // const octree = octreeOf(bodies, boxOf(bodies));
        this.octree = octree;

        this.updateBodiesState(bodies, octree, timestepMs / 1000.0);
        // console.log(octree.nodeCount + " " + octree.depth);

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

    accelerations?: V3[];

    constructor(sdMaxRatio: number = 0.8) {
        super(sdMaxRatio);

    }

    updateBodiesState(bodies: Body[], octree: Octree, timestep: number): void {


        // Pi+1 = F(Pi, Ai)
        for (const b of bodies) {
            if (b.acceleration == undefined) {
                this.accelerate(b, octree);
            }
            b.updatePosition(timestep);
        }

        // Vi+1 = F(Vi, Ai, Ai+1)
        for (const b of bodies) {
            const acceleration = b.acceleration!;

            // following updated positions i+1, get A(i+1)
            b.acceleration = [0, 0, 0];
            this.accelerate(b, octree);
            const nextAcceleration = b.acceleration!;

            // We use avg acceleration to calculate velocity at i+1
            const avgAcceleration = divideScalar(add(acceleration, nextAcceleration), 2.0);
            b.doVelocity(avgAcceleration, timestep, b.velocity);

            // set A(i+1)
            b.acceleration = nextAcceleration;


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
