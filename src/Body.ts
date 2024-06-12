import { V3, magnitude, substract } from "./geometry";


export interface PositionedMass {
    mass: number;
    position: V3;
    radius?: number;
};

export class Body implements PositionedMass {

    mass: number;

    /**
     * in meters
     */
    radius: number;


    /** 
     * in meters
     */
    position!: V3;

    /**
     * in meters/s
     */
    velocity!: V3;


    acceleration?: V3;


    constructor(mass: number, radius: number, position: V3, velocity: V3) {
        this.mass = mass;
        this.radius = radius;
        this.position = position;
        this.velocity = velocity;
    }



    /**
     * Calculate a speed after time delta and constant acceleration.
     * 
     * @param acc the acceleration on body 
     * @param time increment
     * @returns vo + acc * time
     */
    doVelocity(acc: V3, time: number, result: V3=[0,0,0]): V3 {
        result[0] = this.velocity[0] + acc[0] * time;
        result[1] = this.velocity[1] + acc[1] * time;
        result[2] = this.velocity[2] + acc[2] * time;
            // this.velocity[0] + acc[0] * time,
            // this.velocity[1] + acc[1] * time,
            // this.velocity[2] + acc[2] * time
        // ];
        return result;
    }

    /**
     * Calculate a position after time delta and constant acceleration.
     * 
     * @param body 
     * @param acc 
     * @param time 
     * @returns so + vo * t + a * (t * t)/2
    */
    doPosition(acc: V3, time: number, result: V3=[0,0,0]): V3 {
        const time2 = (time * time) / 2;

        result[0] = this.position[0] + (this.velocity[0] * time) + (acc[0] * time2);
        result[1] = this.position[1] + (this.velocity[1] * time) + (acc[1] * time2);
        result[2] = this.position[2] + (this.velocity[2] * time) + (acc[2] * time2);
        return result;

        // return
        //     this.position[0] + (this.velocity[0] * time) + (acc[0] * time2),
        //     this.position[1] + (this.velocity[1] * time) + (acc[1] * time2),
        //     this.position[2] + (this.velocity[2] * time) + (acc[2] * time2),
        // ];
    }

    addForce(force: V3): V3 {
        if (this.acceleration == undefined){
            this.acceleration = [0, 0, 0];
        }
        const acc = this.acceleration;

        acc[0] = acc[0] + (force[0] / this.mass);
        acc[1] =  acc[1] + (force[1] / this.mass), 
        acc[2] = acc[2] + (force[2] / this.mass);
        return acc;
    }

    /**
     * Give the current state of position, velocity and acceleration, update the position
     * 
     * @param time in seconds
     * @returns 
     */
    updatePosition(time: number): V3 {
        return this.doPosition(this.acceleration!, time, this.position);
        // return this.position;
    }


    /**
     * Give the current state of velocity and acceleration, update the velocity
     * 
     * @param time in seconds
     * @returns 
     */
    updateVelocity(time: number): V3 {
        this.doVelocity(this.acceleration!, time, this.velocity);
        return this.velocity;
    }

    /**
     * @param body 
     * @returns Distance from this body to body 
     */
    distanceTo(body: Body): V3 {
        return substract(body.position, this.position);
    }

    addForceFromBody(otherBody: PositionedMass): V3 {
        return this.addForce(twoBodyForce(otherBody, this));
    }




}

const G: number = 6.674e-11;

/**
 * Calculates force of body1 on body2
 * @param body1 
 * @param body2 
 * @returns 
 */
export function twoBodyForce(body1: PositionedMass, body2: PositionedMass): V3 {
    // const vec = body1.distanceTo(body2);
    const vec = substract(body1.position, body2.position);
    const mag = magnitude(vec);
    return force(vec, mag, body1.mass, body2.mass);
}

export function force(r: V3, magnitude: number, m1: number, m2: number): V3 {
    if (magnitude < 1) {
        console.log("mag" + magnitude);
    }
    const numerator = G * m1 * m2;
    const denominator = magnitude * magnitude * magnitude;//, 3);
    return [
        (numerator * r[0]) / denominator,
        (numerator * r[1]) / denominator,
        (numerator * r[2]) / denominator
    ];
}
