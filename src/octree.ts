import { PositionedMass, Body } from "./Body";
import { Box, V3, centerOfMass } from "./geometry";

const DIM = 15.0e12; // meters




export interface Octree {
    parent?: Octree;
    children?: Octree[];
    box: Box;
    centerOfMass(): PositionedMass;
    depth(): number;
    count(): number;
}

 

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


export function boxOf(bodies: Body[]=[]): Box {
    const min = Math.min;
    const max = Math.max;

    return bodies.reduce( (acc: Box, item: Body)  => {
        const minV = acc.min;
        const maxV = acc.max;
        const p = item.position;
        if(!acc.contains(p)){
            return new Box(
                [min(minV[0], p[0]), min(minV[1], p[1]), min(minV[2], p[2])],
                [max(maxV[0], p[0]), max(maxV[1], p[1]), max(maxV[2], p[2])]
            )
        }
        return acc;
    }, new Box([0,0,0], [0,0,0]));


}

export function octreeOf(bodies: Body[]=[], box: Box=new Box([-DIM,-DIM,-DIM] ,[DIM,DIM,DIM]), depth: number=1): Octree {
        
    if(bodies.length <= 1 || depth > 40){
    // if(bodies.length <= 1){
        return new OctreeLeaf(bodies, box);
    }

    return new CompositeOctree(divide(bodies, box, depth), box )

}   

   
function divide(bodies: Body[], box: Box, depth: number): Octree[] {


    const children = new Array<Octree>();
    const boxes = new Array<Box>(8);
    const boxGroupBodies = new Array<Body[]>(8);
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


    // bodies.forEach( b => {
    //     console.log("box:"+box.maxDimension);



    // })
    bodies.forEach( b => getGroup(b).push(b));        
    const octrees = boxes.map( (box, i) => octreeOf(boxGroupBodies[i], box, depth+1));
    return octrees;
}