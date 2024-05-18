import { Timer } from "./Timer";

/**
 * Manages the animation time, can be sped up/slowed down using scales which
 * can have positive or negative values.
 *
 * Can have downstream timers associated to it.
 *
 * Also publishes its current time at each realtime second to a topic: SYSTEM_TIME_TOPIC. The
 * time is in ms based on UNIX epoch.
 *
 */


export class Clock {

    /**
     * clockTimeMs is the scaled time.
     */
    clockTimeMs!: number;

    /**
     * realTimestampMs keeps track of real time in ms.
     *
     * When scales are changed, the realtime reflects the initial
     * time when the scale was applied.
     *
     * Thus clockTimeMs is always:
     * clockTimeMs + (now-realTimestampMs)*scale
     *
     */
    realTimestampMs!: number;
    _isPaused: boolean = false;
    scale: number = 1;
    savedScale: number = 1;
    timers = new Map<string, Timer>();

    /**
     * references the pub/sub publisher once started, else indefined
     */
    timePublisherId: any = undefined;




    /**
     *
     * @param msToUnit units based on ms
     */
    constructor(clockTimeMs: number = Date.now()) {
        this.setTime(clockTimeMs);
    }

    setPaused(value: boolean): boolean {
        // When we pause,save the scale's 'unpaused' value and set scale to 0, 
        // To unpause, we assign the saved value to the scale.
        //
        // TODO: Clean this up by creating 2 'state classes': 
        // class PausedClockState and NonPausedClockState to handle the pause and setScale methods.
        if (value) {
            if (!this.isPaused()) {
                this.savedScale = this.scale;
                this.setScale(0, false);
                this._isPaused = true;
            }
        } else {
            if (this.isPaused()) {
                this._isPaused = false;
                this.setScale(this.savedScale, false);
            }
        }
        return this.isPaused();
    }

    isPaused(): boolean {
        return this._isPaused;
    }

    setTime(timeMs: number) {
        this.realTimestampMs = Date.now();
        this.clockTimeMs = timeMs;
    }

    getTime(): number {
        const realTimeDelta = Date.now() - this.realTimestampMs;
        const clockTime = this.clockTimeMs + (realTimeDelta) * this.scale;
        return clockTime;
    }

    getScale(): number {
        return this.isPaused() ? this.savedScale : this.scale;
    }



    setScale(scale: number, isNotify: boolean = true) {
        if (this.isPaused()) {
            // While paused, our scale is actually 0
            // savedScale holds the non paused scale value which will
            // be restored when no longer paused.
            this.savedScale = scale;
        } else {
            // set a new baseline time from which this scale
            // will be based from.
            this.setTime(this.getTime());
            this.scale = scale;
        }
    }


    createTimer(timerId: string): Timer {
        const timer = new Timer(this, timerId);
        this.timers.set(timerId, timer);
        return timer;
    }

    startTimer(timerId: string): Timer {
        const timer = this.timers.get(timerId) || this.createTimer(timerId);
        return timer.start();
    }

    /**
     *
     * @returns time ms
     */
    getDelta(timerId: string = ""): number | undefined {
        return this.timers.get(timerId)?.getDelta();
    }
}
