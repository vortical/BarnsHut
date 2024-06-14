import { BufferGeometry, Float32BufferAttribute, Points, PointsMaterial, SRGBColorSpace } from 'three';
import { PositionedMass } from './Body';
import { textureLoader } from './textureLoader';





export class ParticleGraphics {


    points: Points;
    material: PointsMaterial;
    _colorHue!: number;
    _unitSize: number = 5000; // wip: we can use this to scale the display 

    constructor(nbSizes: number = 1, colorHue: number, bodies: PositionedMass[]) {
        // const textureLoader = new TextureLoader();
        const circle = textureLoader.load('/assets/disc.png', texture => texture.colorSpace = SRGBColorSpace);
        const geometry = new BufferGeometry();
        this.material = new PointsMaterial({ size: 50000, sizeAttenuation: true, map: circle, alphaTest: 0.5, transparent: true });
        const points = new Points(geometry, this.material);
        this.points = points;
        this.colorHue = colorHue;
        this.setBodies(bodies);
    }

    setBodies(bodies: PositionedMass[]) {
        const vertices = bodies.flatMap(b => b.position);
        this.points.geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    }

    set colorHue(colorHue: number) {
        this._colorHue = colorHue;
        this.material.color.setHSL(colorHue, 0.8, 0.5, SRGBColorSpace);
    }

    get colorHue(): number {
        return this._colorHue;
    }

    set avgParticleSizeScale(value: number) {
        this.material.size = this._unitSize * value;
    }

    get avgParticleSizeScale(): number {
        return this.material.size / this._unitSize;
    }
}
