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


export function substract(a: V3, b: V3, result:V3=[0,0,0]): V3 {
    result[0] = a[0] - b[0];
    result[1] =  a[1] - b[1];
    result[2] =  a[2] - b[2] ;
     return result;
}

export function divideScalar(a: V3, denom: number): V3 {
    return [a[0]/denom, a[1]/denom, a[2]/denom];
}

  
export function magnitude(v: V3): number {
    return Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
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
export function centerOfMass(bodies: Set<PositionedMass> | PositionedMass[]): PositionedMass{

    let sumX = 0, sumY = 0, sumZ = 0;
    let sumMass = 0.0;
    
    for(const body of bodies){
      const bodymass =  body.mass;
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
  