import { BufferAttribute, BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments, SRGBColorSpace } from 'three';
import { Octree } from './octree';

/**
 * The Buffer size of the positions attribute representing the line endpoints.
 * 
 * We use LineSegments (i.e.: gl.LINES), vertices are not reused (i.e.: LINE STRIPS) because we just draw
 * the medians (i.e.: no edges... so there are no overlapping vertices).
 */
const MAX_VERTICES = 200000;

/**
 * Each shown octree is depicted by its median axes up to a a maxShownDepth. Empty Intermediate 
 * octants are not shown; only leaf or non empty octrees within maxShownDepth are shown.
 */
export class OctreeGraphics {
    line: LineSegments;
    material: LineBasicMaterial;
    _colorHue!: number;
    maxShownDepth: number = 6;

    constructor(enabled: boolean = false, maxShownDepth: number = 1, colorHue: number = 0.5, opacity: number = 1.0) {
        const geometry = new BufferGeometry();
        const positionAttribute = new Float32BufferAttribute(new Float32Array(MAX_VERTICES * 3), 3);
        geometry.setAttribute('position', positionAttribute);
        this.material = new LineBasicMaterial({ color: 0xffffff, opacity: opacity, transparent: true });
        this.line = new LineSegments(geometry, this.material);

        this.colorHue = colorHue;
        this.enabled = enabled;
        this.maxShownDepth = maxShownDepth;
        this.colorHue = colorHue;
        this.opacity = opacity;
    }

    set opacity(value: number) {
        this.material.opacity = value;
    }

    get opacity(): number {
        return this.material.opacity;
    }

    set colorHue(value: number) {
        this._colorHue = value;
        this.material.color.setHSL(value, 0.8, 0.5, SRGBColorSpace);
    }
    get colorHue(): number {
        return this._colorHue;
    }

    set enabled(value: boolean) {
        this.line.visible = value;
    }

    get enabled(): boolean {
        return this.line.visible;
    }

    update(octree: Octree) {
        if (!this.enabled) {
            return;
        }

        const maxDepth = this.maxShownDepth;

        /**
         * 
         * @param octree 
         * @param positionsAttribute 
         * @param index is a counter for index within positionsAttribute
         * @param depth current level of the octree root.
         * @returns updated index count. I.e. index is increased by 6 per each shown octant: 3 segments each with 2 vertices.
         */

        function updatePositionAttribute(octree: Octree, positionsAttribute: BufferAttribute, index: number, depth: number): number {
            // Only draw up to maxShownDepth
            if (depth > maxDepth || octree.children == undefined || (octree.children && octree.children.length > 0)) {
                const min = octree.box.min;
                const max = octree.box.max;
                const median = octree.box.median;

                // X axis
                positionsAttribute.setXYZ(index++, min[0], median[1], median[2]);
                positionsAttribute.setXYZ(index++, max[0], median[1], median[2]);

                // Y axis
                positionsAttribute.setXYZ(index++, median[0], min[1], median[2]);
                positionsAttribute.setXYZ(index++, median[0], max[1], median[2]);

                // Z axis
                positionsAttribute.setXYZ(index++, median[0], median[1], min[2]);
                positionsAttribute.setXYZ(index++, median[0], median[1], max[2]);
            }

            if (octree.children && depth <= maxDepth) {
                for (const child of octree.children!) {
                    index = updatePositionAttribute(child, positionsAttribute, index, depth + 1);
                }
            }
            return index;

        }

        const positionAttributeBuffer: BufferAttribute = this.line.geometry.getAttribute('position') as BufferAttribute;
        const verticesRange = updatePositionAttribute(octree, positionAttributeBuffer, 0, 2);
        this.line.geometry.setDrawRange(0, verticesRange);
        positionAttributeBuffer.needsUpdate = true;
        this.line.geometry.computeBoundingSphere();
    }





    // setColorHue(colorHue: number) {
    //     this.colorHue = colorHue;
    //     this.material.color.setHSL(colorHue, 0.8, 0.5, SRGBColorSpace);
    // }

    // getColorHue(): number {
    //     return this.colorHue;
    // }
}


