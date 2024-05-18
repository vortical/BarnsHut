/**
 * 
 * Reviver used in marshalling json data. Does the job!
 * 
 *    const payload = {
 *       a: "letter",
 *       b: new Vector(1,2,3),
 *       c: 1
 *    };
 *    const json = JSON.stringify(payload);
 * 
 *    const marshalledPayload =  JSON.parse(json, compositeReviver([
 *       namedPropertyReviver("a", (v) => v.toUpperCase()), 
 *       namedPropertyReviver("b", (v) => Vector.fromVectorComponents(v) )]));
 *
 */

export type PropertyReviver = (key: string, value: any) => any;

export type ValueReviver = (value: any) => any;

export const compositeReviver = (revivers: PropertyReviver[]) => (key: string, value: any) => revivers.reduce((v, f) => f(key, v), value);

export const namedPropertyReviver: PropertyReviver = (filteringName: string, f: ValueReviver) => (key: string, value: any) => {
    if (key == filteringName) {
        return f(value);
    }
    return value;
}
