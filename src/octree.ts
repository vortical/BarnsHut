import { PositionedMass, Body } from "./Body";
import { Box, V3, abs, add, centerOfMass, divideScalar, substract } from "./geometry";

const DIM = 15.0e12; // meters
const MAX_DEPTH = 40;


/**
 * Given an array of bodies. Return an octree. This is the main way of building octrees.
 * 
 * If there is less that two bodies or if maximum depth is reached: return OctreeLeaf
 * If there are more than one body, then divide the box into 8 smaller octrees (2x2x2) recursively until an octree contains only leaf nodes.
 * 
 * @param bodies 
 * @param box 
 * @param sparse 
 * @param depth 
 * @returns 
 */
export function octreeOf(bodies: Body[] | PositionedMass[] = [], box: Box = boxOf(bodies), depth: number = 1): Octree {

    function divide(bodies: Body[] | PositionedMass[], box: Box, depth: number): Octree[] {
        const octantBodyMap = groupBodiesByOctantIndex(bodies, box.median);
        const octantBoxMap = divideOctantBox(box);
        return Array.from(octantBodyMap, ([index, bodies]) => octreeOf(bodies, octantBoxMap.get(index)!, depth + 1));
    }

    if (bodies.length <= 1 || depth > MAX_DEPTH) {
        return new OctreeLeaf(bodies, box);
    }
    return new CompositeOctree(divide(bodies, box, depth), box);
}

export interface Octree {
    parent?: Octree;    
    children?: Octree[];
    box: Box;    
    centerOfMass: PositionedMass;
    /**
     * Bodies within this octree
     */    
    bodies: PositionedMass[];
    /**
     * Depth of this octree
     */    
    depth: number;
    /**
     * Count of bodies under a node. 
     */
    count: number;
    /**
     * Count of nodes in this octree 
     */    
    nodeCount: number;
}

export class OctreeLeaf implements Octree {
    parent?: Octree;
    bodies: PositionedMass[];
    box: Box;
    centerOfMass: PositionedMass;
    count: number;
    nodeCount = 1;
    depth = 1;

    constructor(bodies: PositionedMass[] = [], box: Box = new Box([-DIM, -DIM, -DIM], [DIM, DIM, DIM])) {
        this.bodies = bodies
        this.box = box;
        this.count = bodies.length; // = 1;

        if (this.bodies.length == 0) {
            this.centerOfMass = { position: this.box.median, mass: 0 };
        } else {
            this.centerOfMass = centerOfMass(this.bodies);
        }
    }
}

export class CompositeOctree implements Octree {

    parent?: Octree;
    children: Octree[];
    box: Box;
    centerOfMass: PositionedMass;

    _count?: number;
    _nodeCount?: number;
    _depth?: number;
    _bodies?: PositionedMass[];


    constructor(children: Octree[], box: Box = new Box([-DIM, -DIM, -DIM], [DIM, DIM, DIM])) {
        this.children = children;
        this.box = box;
        children.forEach(c => c.parent = this);
        this.centerOfMass = centerOfMass(this.children.map(c => c.centerOfMass));
    }

    /**
     * Bodies within this octree
     */
    get bodies(): PositionedMass[] {
        if (this._bodies == undefined) {
            this._bodies = this.children.flatMap(c => c.bodies);
        }
        return this._bodies;
    }

    /**
     * Count of bodies under a node. 
     */
    get count(): number {
        if (this._count == undefined) {
            this._count = this.children.map(c => c.count).reduce((p, c) => p + c);
        }
        return this._count;
    }

    /**
     * Count of nodes in this octree 
     */
    get nodeCount(): number {
        if (this._nodeCount == undefined) {
            this._nodeCount = this.children.map(c => c.nodeCount).reduce((p, c) => p+c) + 1;
        }
        return this._nodeCount;    
    }

    /**
     * Depth of this octree
     */
    get depth(): number {
        if (this._depth == undefined) {
            this._depth = Math.max(...this.children.map(c => c.depth)) + 1;
        }
        return this._depth;
    }

    toString() {
        return `${this.box.toString()} -> [ ${this.children.map(c => c.toString())} ]`;
    }
}


/**
 * Return a cube which can encompass all bodies
 * 
 * @param bodies 
 * @returns Box
 */
export function boxOf(bodies: PositionedMass[]  = []): Box {
    const min = Math.min;
    const max = Math.max;

    return bodies.reduce((acc: Box, item: PositionedMass) => {
        const minV = acc.min;
        const maxV = acc.max;
        const position = item.position;
        if (!acc.contains(position)) {

            const newMin: V3 = [min(minV[0], position[0]), min(minV[1], position[1]), min(minV[2], position[2])];
            const newMax: V3 = [max(maxV[0], position[0]), max(maxV[1], position[1]), max(maxV[2], position[2])];

            // we use the biggest dim for the cube
            const dim = abs(substract(newMax, newMin));
            const maxComponent = max(...dim);
            const center = divideScalar(add(newMax, newMin), 2);
            return Box.centeredCube(center, maxComponent);
        }
        return acc;
    }, new Box([0, 0, 0], [0, 0, 0]));
}



export type OctantCoordinates = [0 | 1, 0 | 1, 0 | 1];

export type OctantIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

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