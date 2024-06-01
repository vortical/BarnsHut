import { assert, expect, test } from 'vitest';


import {  octreeOf, OctreeLeaf, CompositeOctree, OctantCoordinates, OctantIndexToOctantCoords, octantCoordsToOctantIndex } from '../src/octree.ts';
import { Box } from '../src/geometry.ts';
import { PositionedMass } from '../src/Body.ts'


function validateContainment(octree: CompositeOctree): boolean {
    return octree.children.filter(c => !c.box.contains(c.centerOfMass().position)).length == 0;
}


test('octree leaf ',  () => {

    
    const bodies: PositionedMass[] =  [

        {mass: 1, position: [1,1,1]},    

    ];
    
    const box = new Box([-2,-2,-2],[2,2,2])
    const octree = octreeOf(bodies, box) 
    expect(octree.depth()).toBe(1);
    expect(octree).toBeInstanceOf(OctreeLeaf);

    
})

test('maps', () => {
    const m = new Map();
    m.set(1, [0,1,2,3,4]);
    m.set(2, [5,6,7,8,9]);


    const x = Array.from(m, ([key, bodies]) => {
        return {'key': key, 'bodies': bodies};
    });
    console.log(x);


})

test('octantCoordsToOctantIndex', () => {

    expect(octantCoordsToOctantIndex(OctantIndexToOctantCoords[0])).toStrictEqual(0);
    expect(octantCoordsToOctantIndex(OctantIndexToOctantCoords[1])).toStrictEqual(1);
    expect(octantCoordsToOctantIndex(OctantIndexToOctantCoords[2])).toStrictEqual(2);
    expect(octantCoordsToOctantIndex(OctantIndexToOctantCoords[3])).toStrictEqual(3);
    expect(octantCoordsToOctantIndex(OctantIndexToOctantCoords[4])).toStrictEqual(4);
    expect(octantCoordsToOctantIndex(OctantIndexToOctantCoords[5])).toStrictEqual(5);
    expect(octantCoordsToOctantIndex(OctantIndexToOctantCoords[6])).toStrictEqual(6);
    expect(octantCoordsToOctantIndex(OctantIndexToOctantCoords[7])).toStrictEqual(7);
})

test('OctantIndexToOctantCoords', () => {

    
    expect(OctantIndexToOctantCoords[0]).toStrictEqual([0,0,0]);
    expect(OctantIndexToOctantCoords[1]).toStrictEqual([0,0,1]);
    expect(OctantIndexToOctantCoords[2]).toStrictEqual([0,1,0]);
    expect(OctantIndexToOctantCoords[3]).toStrictEqual([0,1,1]);
    expect(OctantIndexToOctantCoords[4]).toStrictEqual([1,0,0]);
    expect(OctantIndexToOctantCoords[5]).toStrictEqual([1,0,1]);
    expect(OctantIndexToOctantCoords[6]).toStrictEqual([1,1,0]);
    expect(OctantIndexToOctantCoords[7]).toStrictEqual([1,1,1]);



})

test('octree depth 2 b ',  () => {
    
    const bodies: PositionedMass[] =  [
        {mass: 1, position: [-1,1,1] },    
        {mass: 1, position: [1,1,-1]}    
    ];
    
    const box = new Box([-2,-2,-2],[2,2,2])
    const octree = octreeOf(bodies, box) 
    
    expect(octree).toBeInstanceOf(CompositeOctree);
    expect(octree.depth()).toBe(2);
    expect(validateContainment(octree as CompositeOctree)).toBeTruthy();
});


test('octree depth 2 with 3 bodies ',  () => {
    const bodies: PositionedMass[] =  [
        {mass: 1, position: [1, -1,-1]},    
        {mass: 1, position: [-1,-1,-1]},    
        {mass: 1, position: [-1,-1, 1]}    
    ];
    const box = new Box([-2,-2,-2],[2,2,2])
    
    const octree = octreeOf(bodies, box) 

    expect(octree).toBeInstanceOf(CompositeOctree);
    expect(octree.depth()).toBe(2);
    expect(validateContainment(octree as CompositeOctree)).toBeTruthy();
});


test('octree depth 3 with 3 bodies ',  () => {
    
    const bodies: PositionedMass[] =  [
        {mass: 1, position: [0.5,0.5,0.5] },    
        {mass: 1, position: [1.5,1.5,1.5]},    

        {mass: 1, position: [1,1,-1]}    

    ];
    const box = new Box([-2,-2,-2],[2,2,2])
    
    const octree = octreeOf(bodies, box) 

    expect(octree).toBeInstanceOf(CompositeOctree);
    expect(octree.depth()).toBe(3);
    expect(validateContainment(octree as CompositeOctree)).toBeTruthy();
});


