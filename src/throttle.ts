export function throttle(threshold: number, scope: any | undefined, fn: (...args: any) => any) {
    let last: number | undefined = undefined;
    let timeoutId: any = undefined;
    return function (...args: any) {
        const context = scope || this;
        const now = new Date().getTime();
        last = last || now - threshold;

        // replace previous throttled invocation, update
        // time with remaining time until threshold is met.
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            last = now;
            fn.apply(context, args);
        }, threshold - (now - last));
    };
}

