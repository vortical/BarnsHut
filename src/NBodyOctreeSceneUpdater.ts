
import { Body, force, twoBodyForce } from "./Body.ts";

import { BufferAttribute, BufferGeometry, Object3D, Points, TypedArray } from 'three';
import { Box, V3, abs, centerOfMass, divideScalar, magnitude, substract } from "./geometry.ts";
import { PositionedMass } from "./Body.ts";
import { Octree, OctreeLeaf, boxOf, octreeOf } from "./octree.ts";

const DIM = 15.0e12; // meters
const SD_MAX_RATIO = 0.75;
const stats = {
    leaf:0,
    composite:0,
    miss:0,
    empty:0
};


function updateBodies( bodies: Body[], octree: Octree, time: number){

    const buf: V3 = [0,0,0];
    function accelerate(acceleratedObject: Body, ot: Octree, depth: number=1){

        if (ot.children == undefined){// : slow: instanceof OctreeLeaf){
            stats.leaf += 1;
            
            for (const b of (ot as OctreeLeaf).bodies){
                if (acceleratedObject !== b){
                    acceleratedObject.addForceFromBody(b);
                }
            }
            
        }else { 
            const s = ot.box.maxDimension;
            const com = ot.centerOfMass();
            const r =  substract(com.position, acceleratedObject.position, buf);
            const d = magnitude(r);

            if (s / d < SD_MAX_RATIO || octree.count() == 1) {
                stats.composite += 1;
                acceleratedObject.addForce(force(r, d, com.mass, acceleratedObject.mass));
        
            }else {   
                stats.miss += 1; 
                for(const child of ot.children!){
                    accelerate(acceleratedObject, child, depth+1);        
                }
            } 
    
        }
    }


    for(const b of bodies) {
        
        b.acceleration = [0,0,0]
        accelerate(b, octree);
        b.updatePosition(time);
    }
    // accelerate again then average out before updating the velocity
    for(const b of bodies) {
        accelerate(b, octree);
        b.acceleration = divideScalar(b.acceleration!, 2.0);
        b.updateVelocity(time);

    }
}


export class NBodyOctreeSystemUpdater {
    isOneTimeUpdate = false;
    isEnabled = true;

    update(particlePositions: TypedArray, bodies: Body[], timestepMs: number) {

        const t0 = performance.now();
        const octree = octreeOf(bodies, boxOf(bodies));

        
        console.log("d "+ octree.depth());
        console.log("o time"+ (performance.now() - t0).toFixed(0));
        const t1 = performance.now();
        
        updateBodies(bodies, octree, timestepMs/1000.0);
        const t2 = performance.now() - t1;
        
        console.log("b time"+ t2.toFixed(0));

        bodies.forEach((body, i) => {
            const position = body.position;

            particlePositions[i*3] = position[0]; 
            particlePositions[i*3 + 1] = position[1]; 
            particlePositions[i*3 + 2] = position[2]; 

        })
       
    }

}

