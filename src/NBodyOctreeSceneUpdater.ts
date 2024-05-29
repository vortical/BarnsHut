import { Clock } from "./Clock.ts";
import { Body, force, twoBodyForce } from "./Body.ts";

import { BufferAttribute, BufferGeometry, Object3D, Points, TypedArray } from 'three';
import { V3, abs, centerOfMass, divideScalar, magnitude, substract } from "./geometry.ts";
import { PositionedMass } from "./Body.ts";



export class Box {

    min: V3;
    max: V3;

    median: V3;
    dimensions: V3;
    maxDimension: number;

    constructor(min:V3, max:V3){
        this.min = min;
        this.max = max;
        this.median = [
            (min[0] + max[0])/2.0,
            (min[1] + max[1])/2.0,
            (min[2] +  max[2])/2.0
        ];

        this.dimensions = abs(substract(max, min));
        this.maxDimension = Math.max(...this.dimensions);

    }
    
    contains(position: V3){
        const min = this.min;
        // max boundary is excluded
        const max = this.max;
        
        return min[0] <= position[0]  && position[0] < max[0] &&
                min[1] <= position[1]  && position[1] < max[1] &&
                min[2] <= position[2]  && position[2] < max[2];  

    }


}


const DIM = 15.0e12; // meters




export interface Octree {
    parent?: Octree;
    children?: Octree[];
    box: Box;
    centerOfMass(): PositionedMass;
    depth(): number;
    count(): number;
}

 

// abstract class Octree {
//     parent?: Octree;
//     box: Box;
//     abstract centerOfMass(): PositionedMass;

//     static of(bodies: Set<PositionedMass>=new Set(), box: Box=new Box({x: -DIM, y: -DIM, z: -DIM},{x: DIM, y: DIM, z: DIM})): Octree {
        
//         if(bodies.size <= 1){
//             return new OctreeLeaf(bodies, box);
//         }
    
//         return new CompositeOctree(divide(bodies, box), box )
    
//     }    

//     abstract depth(): number;

// }

export class OctreeLeaf implements Octree {
    parent?: Octree;
    bodies: PositionedMass[];
    box: Box;
    _com?: PositionedMass;

    constructor(bodies: PositionedMass[] = [], box: Box=new Box([-DIM,-DIM,-DIM] ,[DIM,DIM,DIM])){
        
        this.bodies = bodies
        this.box = box;        
    }

    centerOfMass(): PositionedMass{
        if(this._com == undefined){
            if (this.bodies.length == 0){
                this._com = {position: this.box.median, mass:0};
            }else {
                this._com = centerOfMass(this.bodies);
            }
        }
        return this._com;
    }


    count(): number {
        return this.bodies.length;
       // return 1;
    }
    depth(): number {
        return 1;
    }
}



export class CompositeOctree implements Octree {

    parent?: Octree;
    children: Octree[];
    box: Box;

    _com?: PositionedMass;
    _count?: number;

    centerOfMass(): PositionedMass {
        if(this._com == undefined){
            this._com = centerOfMass(this.children.map(c => c.centerOfMass()))
        }
        return this._com;
    }

    constructor( children: Octree[], box: Box=new Box([-DIM,-DIM,-DIM] ,[DIM,DIM,DIM] )){
        this.children = children;
        this.box = box;
        children.forEach(c => c.parent = this);
    }

    /**
     * For testing
     * 
     * @param x 
     * @param y 
     * @param z 
     */
    depth(): number {
        return  Math.max(...this.children.map(c => c.depth())) + 1;
    }

    count(): number {
        if (this._count == undefined){
            this._count = this.children.map(c => c.count()).reduce((p, c) => p+c);
        }
        return this._count;
        // return this.children.map(c => c.count()).reduce((p, c) => p+c) + 1;
        // return this.children.map(c => c.count()).reduce((p, c) => p+c);
    }

    getOctant(x:0|1, y:0|1, z:0|1): Octree {
        const index = (x*4) + (y*2) + (z);
        return this.children[index];
    }

    toString(){
        return `${this.box.toString()} -> [ ${this.children.map(c => c.toString())} ]`;       
    }
}

export function octreeOf(bodies: PositionedMass[]=[], box: Box=new Box([-DIM,-DIM,-DIM] ,[DIM,DIM,DIM]), depth: number=1): Octree {
        
    if(bodies.length <= 1 || depth > 25){
        return new OctreeLeaf(bodies, box);
    }

    return new CompositeOctree(divide(bodies, box, depth), box )

}   

   
function divide(bodies: PositionedMass[], box: Box, depth: number): Octree[] {


    const children = new Array<Octree>();
    const boxes = new Array<Box>();
    const boxGroupBodies = new Array<PositionedMass[]>(8);
    const median = box.median;
    
    function getGroup(body: PositionedMass){

        const index = (body.position[0] < median[0] ? 0 : 4) + (body.position[1] < median[1] ? 0: 2) + (body.position[2] < median[2] ? 0: 1);
        let group = boxGroupBodies[index];
        if (group == undefined) {
            group = [];
            boxGroupBodies[index] = group;
        }        
        return group;
    }

    for(let x=0; x<2; x++){
        for(let y=0; y<2; y++){
            for(let z=0; z<2; z++){

                const min: V3 = [
                    x == 0 ? box.min[0]: median[0], 
                    y == 0 ? box.min[1]: median[1], 
                    z == 0 ? box.min[2]: median[2] 
                ];
                
                const max: V3 = [
                    x == 0 ? median[0]: box.max[0], 
                    y == 0 ? median[1]: box.max[1], 
                    z == 0 ? median[2]: box.max[2]
                ];
                boxes.push(new Box(min, max));
    
            }
        }
    }

    bodies.forEach( v => getGroup(v).push(v));        
    const octrees = boxes.map( (box, i) => octreeOf(boxGroupBodies[i], box, depth+1));
    return octrees;
}


const SD_MAX_RATIO = 0.5;


const stats = {
    leaf:0,
    composite:0,
    miss:0,
    empty:0,
    depths: [0]
};

function updateStatsDepth(depth: number){

    const d: number = stats.depths[depth] || 0;
    stats.depths[depth] = d + 1 ;

    
}
function updateBodies( bodies: Body[], octree: Octree, time: number){

    const buf: V3 = [0,0,0];
    function accelerate(acceleratedObject: Body, ot: Octree, depth: number=1){

        if (ot.children == undefined){//} instanceof OctreeLeaf){
            stats.leaf += 1;
            // updateStatsDepth(depth);
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

            if (s / d < SD_MAX_RATIO || ot.count() == 1) {
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
        // accelerate again then average out before updating the velocity
        accelerate(b, octree);
        b.acceleration = divideScalar(b.acceleration!, 2.0);
        b.updateVelocity(time);



    }

    // console.log(stats.leaf/stats.composite);
    // console.log(stats.depths);
    console.log(stats.empty)


}





export class NBodyOctreeSystemUpdater {
    isOneTimeUpdate = false;
    isEnabled = true;

    update(particlePositions: TypedArray, bodies: Body[], timestepMs: number) {
     
        
     
 
    
        // const geometry = o.geometry;

        

        // const positions = geometry.attributes.position.array;
        const t0 = performance.now();
        const octree = octreeOf(bodies, new Box([-550000, -550000, -550000], [550000, 550000, 550000]));

        // console.log(octree.depth());
        console.log(octree.count());

        
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
        // for (let i = 0; i< bodies.length; i++) {
        //     particlePositions[i*3] = particlePositions[i*3] + 0.5; 
        // }

        

        // geometry.attributes.position.needsUpdate = true;
    

        

        
        

        // return object3Ds;
    }


}

