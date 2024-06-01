import { PositionedMass, Body } from "./Body";
import { Box, V3, centerOfMass } from "./geometry";

const DIM = 15.0e12; // meters


export interface Octree {
    parent?: Octree;
    children?: Octree[];
    box: Box;
    centerOfMass: PositionedMass;
    bodies: PositionedMass[];
    depth: number;
    count: number;

    // centerOfMass(): PositionedMass;
    // depth(): number;
    // count(): number;
}

export class OctreeLeaf implements Octree {
    parent?: Octree;
    bodies: PositionedMass[];
    box: Box;
    centerOfMass: PositionedMass;
    count: number;
    depth = 1;
    

    constructor(bodies: PositionedMass[] = [], box: Box = new Box([-DIM, -DIM, -DIM], [DIM, DIM, DIM])) {

        this.bodies = bodies
        this.box = box;

        if (this.bodies.length == 0) {
            this.centerOfMass = { position: this.box.median, mass: 0 };
        } else {
            this.centerOfMass = centerOfMass(this.bodies);
        }

        this.count = bodies.length; // = 1;

    }


    // centerOfMass(): PositionedMass {
    //     if (this._com == undefined) {
    //         if (this.bodies.length == 0) {
    //             this._com = { position: this.box.median, mass: 0 };
    //         } else {
    //             this._com = centerOfMass(this.bodies);
    //         }
    //     }
    //     return this._com;
    // }

    // count(): number {
    //     return this.bodies.length;
    //     // return 1;
    // }

    // depth(): number {
    //     return 1;
    // }
}

export class CompositeOctree implements Octree {

    parent?: Octree;
    children: Octree[];
    box: Box;
    centerOfMass: PositionedMass;

    _count?: number;
    _depth?: number;
    _bodies?: PositionedMass[];


    constructor(children: Octree[], box: Box = new Box([-DIM, -DIM, -DIM], [DIM, DIM, DIM])) {
        this.children = children;
        this.box = box;
        children.forEach(c => c.parent = this);
        this.centerOfMass= centerOfMass(this.children.map(c => c.centerOfMass));        
    }

    get bodies(): PositionedMass[] {
        if (this._bodies == undefined) {
            this._bodies = this.children.flatMap(c => c.bodies);
        }
        return this._bodies;

    }

    /**
     * 
     * Only count the bodies under a node. 
     * Don't count the nodes.
     * */
    get count(): number {
        if(this._count == undefined){
            this._count = this.children.map(c => c.count).reduce((p, c) => p + c);
            // this._count = this.children.map(c => c.count()).reduce((p, c) => p+c) + 1;
        }
        return this._count;

    }

    get depth(): number {
        if(this._depth == undefined){
            this._depth = Math.max(...this.children.map(c => c.depth)) + 1;
        }
        return this._depth;

    }

    toString() {
        return `${this.box.toString()} -> [ ${this.children.map(c => c.toString())} ]`;
    }
}


/**
 * Return a box which can encompass all bodies
 * 
 * @param bodies 
 * @returns Box
 */
export function boxOf(bodies: Body[] = []): Box {
    const min = Math.min;
    const max = Math.max;

    return bodies.reduce((acc: Box, item: Body) => {
        const minV = acc.min;
        const maxV = acc.max;
        const position = item.position;
        if (!acc.contains(position)) {
            return new Box(
                [min(minV[0], position[0]), min(minV[1], position[1]), min(minV[2], position[2])],
                [max(maxV[0], position[0]), max(maxV[1], position[1]), max(maxV[2], position[2])]
            )
        }
        return acc;
    }, new Box([0, 0, 0], [0, 0, 0]));
}

/**
 * Given an array of bodies. Return an octree. This is the principal way of building octrees.
 * 
 * If there is only a single body: return OctreeLeaf
 * If there are more than one body, then divide the box into 8 smaller octrees (2x2x2) recursively until an octree contains only leaf nodes.
 * 
 * @param bodies 
 * @param box 
 * @param sparse 
 * @param depth 
 * @returns 
 */
export function octreeOf(bodies: Body[] | PositionedMass[] = [], box: Box, depth: number = 1): Octree {
    
    function divide(bodies: Body[] | PositionedMass[], box: Box, depth: number): Octree[] {
        const octantBodyMap = groupBodiesByOctantIndex(bodies, box.median);
        const octantBoxMap = divideOctantBox(box);
    
        return Array.from(octantBodyMap, ([index, bodies]) => octreeOf(bodies, octantBoxMap.get(index)!, depth + 1));
    }

    if (bodies.length <= 1 || depth > 40) {
        return new OctreeLeaf(bodies, box);
    }
    return new CompositeOctree(divide(bodies, box, depth), box);
}


export type OctantCoordinates = [0 | 1, 0 | 1, 0 | 1];

export type OctantIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const OctantIndexToOctantCoords: OctantCoordinates[] = [
    [0, 0, 0],
    [0, 0, 1],
    [0, 1, 0],
    [0, 1, 1],
    [1, 0, 0],
    [1, 0, 1],
    [1, 1, 0],
    [1, 1, 1],
] as const;

export function octantCoordsToOctantIndex([x, y, z]: OctantCoordinates): OctantIndex {
    // const [x, y, z] = coords;
    return (x * 4) + (y * 2) + (z) as OctantIndex;
}

export function octantIndexForBody(body: PositionedMass, median: V3): OctantIndex {
    const index = (body.position[0] < median[0] ? 0 : 4) + (body.position[1] < median[1] ? 0 : 2) + (body.position[2] < median[2] ? 0 : 1);
    return index as OctantIndex;
}

export function octantCoordinatesForBody(body: PositionedMass, median: V3): OctantCoordinates {
    const index = octantIndexForBody(body, median);
    return OctantIndexToOctantCoords[index];
}

/**
 * Given a set of bodies and the median of a Box, group the bodies by OctantIndex within the box. This
 * is used when dividing an octant.
 * 
 * @param bodies: PositionedMass[]
 * @param median from a Box.median 
 * @returns Map<OctantIndex, PositionedMass[]>
 */
export function groupBodiesByOctantIndex(bodies: PositionedMass[], median: V3): Map<OctantIndex, PositionedMass[]> {
    return Map.groupBy(bodies, (body: PositionedMass) => octantIndexForBody(body, median));
}


/**
 * Given a parent Box, create a child octant box at octantCoordinates.
 * 
 * @param octantCoordinates 
 * @param parentBox 
 * @returns octant box at octantCoordinates
 */
export function createOctantBox(octantCoordinates: OctantCoordinates, parentBox: Box): Box {
    const median = parentBox.median;
    const [x, y, z] = octantCoordinates;
    const min: V3 = [
        x == 0 ? parentBox.min[0] : median[0],
        y == 0 ? parentBox.min[1] : median[1],
        z == 0 ? parentBox.min[2] : median[2]
    ];
    const max: V3 = [
        x == 0 ? median[0] : parentBox.max[0],
        y == 0 ? median[1] : parentBox.max[1],
        z == 0 ? median[2] : parentBox.max[2]
    ];

    return new Box(min, max);
}

export function divideOctantBox(parentBox: Box): Map<OctantIndex, Box> {
    return OctantIndexToOctantCoords.reduce((acc: any, coords: OctantCoordinates) => {
        const box = createOctantBox(coords, parentBox)
        const index = octantCoordsToOctantIndex(coords);
        acc.set(index, box);
        return acc;
    }, new Map());
}