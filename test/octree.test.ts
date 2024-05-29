import { assert, expect, test } from 'vitest';


import { Box, octreeOf, OctreeLeaf, CompositeOctree } from '../src/NBodySceneUpdater.ts';
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

