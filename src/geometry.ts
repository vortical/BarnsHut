import { PositionedMass } from "./Body";

export class Dim {
  w: number;
  h: number;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
  }

  ratio(): number {
    return this.w / this.h;
  }
}

export type V<T> = [T, T, T];

export type V3 = [number, number, number];

export function substract(a: V3, b: V3, result: V3 = [0, 0, 0]): V3 {
  result[0] = a[0] - b[0];
  result[1] = a[1] - b[1];
  result[2] = a[2] - b[2];
  return result;
}

export function add(a: V3, b: V3, result: V3 = [0, 0, 0]): V3 {
  result[0] = a[0] + b[0];
  result[1] = a[1] + b[1];
  result[2] = a[2] + b[2];
  return result;
}


export function divideScalar(a: V3, denom: number, result:V3 = [0,0,0]): V3 {
  result[0] = a[0] / denom;
  result[1] = a[1] / denom ;
  result[2] = a[2] /denom ;
  return result;

  // return [a[0] / denom, a[1] / denom, a[2] / denom];
}

export function multScalar(a: V3, mult: number, result:V3 = [0,0,0]): V3 {
  result[0] = a[0] * mult;
  result[1] = a[1] *  mult ;
  result[2] = a[2] * mult ;
  return result;

  // return [a[0] / denom, a[1] / denom, a[2] / denom];
}


export function magnitude(v: V3): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

export function abs(v: V3): V3 {
  return [Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2])];
}

export function distanceMagnitude(v1: V3, v2: V3): number {
  return magnitude(substract(v2, v1));
}

/**
 * 
 * @param bodies 
 * 
 * @returns unique point where the weighted relative position of a distributed mass sums to zero
 */
export function centerOfMass(bodies: PositionedMass[]): PositionedMass {

  // const com = bodies.reduce(
  //   (accumulator, current) => {
  //     const bodymass = current.mass;
  //     const position = current.position;
  //     const accumulatorPosition = accumulator.position

  //     accumulatorPosition[0] += position[0] * bodymass;
  //     accumulatorPosition[1] += position[1] * bodymass;
  //     accumulatorPosition[2] += position[2] * bodymass;
  //     accumulator.mass += bodymass;
  //     return accumulator;
  
  //   }, { position: [0, 0, 0],mass: 0}
  // );

  

  let sumX = 0, sumY = 0, sumZ = 0;
  let sumMass = 0.0;

  for (const body of bodies) {
    const bodymass = body.mass;
    const position = body.position;

    sumX += position[0] * bodymass;
    sumY += position[1] * bodymass;
    sumZ += position[2] * bodymass;

    sumMass += bodymass
  }

  return {
    position: [
      sumX / sumMass,
      sumY / sumMass,
      sumZ / sumMass,
    ],
    mass: sumMass
  };


}

export class Box {

  min: V3;
  max: V3;

  median: V3;
  dimensions: V3;
  maxDimension: number;

  constructor(min: V3 = [0, 0, 0], max: V3 = [0, 0, 0]) {
    this.min = min;
    this.max = max;
    this.median = [
      (min[0] + max[0]) / 2.0,
      (min[1] + max[1]) / 2.0,
      (min[2] + max[2]) / 2.0
    ];

    this.dimensions = abs(substract(max, min));
    this.maxDimension = Math.max(...this.dimensions);
  }

  static centeredCube(center: V3, size: number): Box {
    const halfSize = size/2;
    const min: V3 = [center[0] - halfSize, center[1] - halfSize, center[2] - halfSize ];
    const max: V3 = [center[0] + halfSize, center[1] + halfSize, center[2] + halfSize ];
    return new Box(min, max);
  }

  contains(position: V3) {
    const min = this.min;
    // max boundary is excluded
    const max = this.max;

    return min[0] <= position[0] && position[0] < max[0] &&
      min[1] <= position[1] && position[1] < max[1] &&
      min[2] <= position[2] && position[2] < max[2];
  }
}