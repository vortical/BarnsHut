import { Clock } from "./Clock.ts";

/**
 * A timer associated to a clock. If clock is sped/slowed/paused via its scale: so is the timer .
 */



export class Timer {

    clock: Clock;
    name: string;
    timestamp!: number;

    constructor(clock: Clock, name: string) {
        this.clock = clock;
        this.name = name;
    }


    /**
     *
     * @returns time in ms
     */
    getDelta(): number {
        const now = performance.now();
        const delta = this.clock.scale * (now - this.timestamp);
        this.timestamp = now;
        return delta;
    }

    start(): Timer {
        this.timestamp = performance.now();
        return this;
    }
}
