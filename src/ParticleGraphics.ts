import { BufferGeometry, Float32BufferAttribute, Points, PointsMaterial, SRGBColorSpace, TextureLoader } from 'three';
import { PositionedMass } from './Body';

export class ParticleGraphics {


    points: Points;
    material: PointsMaterial;
    colorHue!: number;

    constructor(nbSizes: number = 1, colorHue: number, bodies: PositionedMass[]) {
        const textureLoader = new TextureLoader();
        const circle = textureLoader.load('/public/assets/disc.png', texture => texture.colorSpace = SRGBColorSpace);
        const geometry = new BufferGeometry();
        this.material = new PointsMaterial({ size: 50000, sizeAttenuation: true, map: circle, alphaTest: 0.5, transparent: true });
        const points = new Points(geometry, this.material);
        this.points = points;
        this.setColorHue(colorHue);
        this.setBodies(bodies);
    }

    setBodies(bodies: PositionedMass[]) {
        const vertices = bodies.flatMap(b => b.position);
        this.points.geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    }

    setColorHue(colorHue: number) {
        this.colorHue = colorHue;
        this.material.color.setHSL(colorHue, 0.8, 0.5, SRGBColorSpace);
    }

    getColorHue(): number {
        return this.colorHue;
    }
}
