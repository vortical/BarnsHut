import { PropertyReviver, compositeReviver, namedPropertyReviver } from './jsonreviver.ts';

import LZString from 'lz-string';




type ParamName = "zstate" | "state";

/**
 * Manage history based on state being pushed. Users can also copy the location/share it.
 * 
 * State can be represented as either compressed or uncompressed json via either zipstate or state param.
 * @see pushState(state: BodySystemOptionsState, toCompress = false)
 * 
 * 
 */
export default class LocationBar<A> {
    reviver: PropertyReviver

    constructor(reviver: PropertyReviver=compositeReviver([])){
        this.reviver = reviver;
    }

    getState(): A {
        return this.mapURLSearchParamsToState(new URLSearchParams(decodeURI(window.location.search)));
    }

    pushState(state: A, toCompress = false) {

        const jsonString = JSON.stringify(state);
        const stateString = toCompress ? LZString.compressToEncodedURIComponent(jsonString) : encodeURI(jsonString);

        const stateParam: ParamName = toCompress ? "zstate" : "state";
        if (new URLSearchParams(window.location.search).get(stateParam) !== stateString) {
            window.history.pushState(stateString, "", "?".concat(stateParam, "=", stateString));
        }
    }



    mapURLSearchParamsToState(params: URLSearchParams): A {
        const state = params.get('zstate') ?
            LZString.decompressFromEncodedURIComponent(params.get('zstate')!) :
            params.get("state") || "{}";

        return JSON.parse(state, this.reviver);
    }

    static reload() {
        location.reload();
    }
};


