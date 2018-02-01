"use strict";
/**
 * binding.ts offers a convenient subscribe() function that creates a binding to an observable, a
 * a plain value, or a function from which it builds a computed.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const computed_1 = require("./computed");
const observable_1 = require("./observable");
/**
 * Subscribes a callback to valueObs, which may be one a plain value, an observable, a knockout
 * observable, or a function. If a function, it's used to create a computed() and will be called
 * with a context function `use`, allowing it to depend on other observable values (see
 * documentation for `computed`).
 *
 * In all cases, `callback(newValue, oldValue)` is called immediately and whenever the value
 * changes. On the initial call, oldValue is undefined.
 *
 * Returns an object which should be disposed to remove the created subscriptions, or null.
 */
function subscribe(valueObs, callback) {
    // A plain function (to make a computed from), or a knockout observable.
    if (typeof valueObs === 'function') {
        // Knockout observable.
        const koValue = valueObs;
        if (typeof koValue.peek === 'function') {
            let savedValue = koValue.peek();
            const sub = koValue.subscribe((val) => {
                const old = savedValue;
                savedValue = val;
                callback(val, old);
            });
            callback(savedValue, undefined);
            return sub;
        }
        // Function from which to make a computed. Note that this is also reasonable:
        //    let sub = subscribe(use => callback(valueObs(use)));
        // The difference is that when valueObs() evaluates to unchanged value, callback would be
        // called in the version above, but not in the version below.
        const comp = computed_1.computed(valueObs);
        comp.addListener(callback);
        callback(comp.get(), undefined);
        return comp; // Disposing this will dispose its one listener.
    }
    // An observable.
    if (valueObs instanceof observable_1.Observable) {
        const sub = valueObs.addListener(callback);
        callback(valueObs.get(), undefined);
        return sub;
    }
    callback(valueObs, undefined);
    return null;
}
exports.subscribe = subscribe;
