/**
 * binding.js offers a convenient subscribe() function that creates a binding to an observable, a
 * a plain value, or a function (from which it builds a computed).
 */
"use strict";

const computed = require('./computed.js');

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
    if (typeof valueObs.peek === 'function') {
      let savedValue = valueObs.peek();
      let sub = valueObs.subscribe(val => {
        let old = savedValue;
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
    let comp = computed(valueObs);
    comp.addListener(callback);
    callback(comp.get(), undefined);
    return comp;      // Disposing this will dispose its one listener.
  }

  // An observable.
  if (typeof valueObs.addListener === 'function') {
    let sub = valueObs.addListener(callback);
    callback(valueObs.get(), undefined);
    return sub;
  }

  callback(valueObs, undefined);
  return null;
}

exports.subscribe = subscribe;
