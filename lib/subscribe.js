/**
 * subscribe.js implements subscriptions to several observables at once.
 *
 * E.g. if we have some existing observables (which may be instances of `computed`),
 * we can subscribe to them explicitly:
 *    let obs1 = observable(5), obs2 = observable(12);
 *    subscribe(obs1, obs2, (use, v1, v2) => console.log(v1, v2));
 *
 * or implicitly by using `use(obs)` function, which allows dynamic subscriptions:
 *    subscribe(use => console.log(use(obs1), use(obs2)));
 *
 * In either case, if obs1 or obs2 is changed, the callbacks will get called automatically.
 *
 * Creating a subscription allows any number of dependencies to be specified explicitly, and their
 * values will be passed to the read() callback. These may be combined with automatic dependencies
 * detected using use(). Note that constructor dependencies have less overhead.
 *
 *    subscribe(...deps, ((use, ...depValues) => READ_CALLBACK));
 */
"use strict";

const fastMap = require('fast.js/map');
const _computed_queue = require('./_computed_queue.js');
const util = require('./util.js');

class Subscription {
  /**
   * Internal constructor for a Subscription. You should use subscribe() function instead.
   */
  constructor(read, dependencies) {
    this._depItem = new _computed_queue.DepItem(this._evaluate, this);
    this._dependencies = dependencies || [];
    this._depListeners = fastMap(this._dependencies, obs => this._subscribeTo(obs));
    this._dynDeps = new Map();   // Maps dependent observable to its Listener object.

    let useFunc = (obs => this._useDependency(obs));
    this._readArgs = Array(this._dependencies.length + 1);
    this._readArgs[0] = useFunc;
    this._read = util.bindB(read, this._readArgs);

    this._evaluate();
  }

  /**
   * @private
   * Gets called when the read() callback calls `use(obs)` for an observable. It creates a
   * subscription to `obs` if one doesn't yet exist.
   * @param {Observable} obs: The observable being used as a dependency.
   */
  _useDependency(obs) {
    let listener = this._dynDeps.get(obs);
    if (!listener) {
      listener = this._subscribeTo(obs);
      this._dynDeps.set(obs, listener);
    }
    listener.inUse = true;
    this._depItem.useDep(obs._getDepItem());
    return obs.get();
  }

  /**
   * @private
   * Calls the read() callback with appropriate args, and updates subscriptions when it is done.
   * I.e. adds dynamic subscriptions created via `use(obs)`, and disposes those no longer used.
   */
  _evaluate() {
    try {
      // Note that this is optimized for speed.
      for (let i = 0, len = this._dependencies.length; i < len; i++) {
        this._readArgs[i + 1] = this._dependencies[i].get();
        this._depItem.useDep(this._dependencies[i]._getDepItem());
      }
      return this._read();
    } finally {
      this._dynDeps.forEach((listener, obs) => {
        if (listener.inUse) {
          listener.inUse = false;
        } else {
          this._dynDeps.delete(obs);
          listener.dispose();
        }
      });
    }
  }

  /**
   * @private
   * Subscribes this computed to another observable that it depends on.
   * @param {Observable} obs: The observable to subscribe to.
   * @returns {Listener} Listener object.
   */
  _subscribeTo(obs) {
    return obs.addListener(this._enqueue, this);
  }

  /**
   * @private
   * Adds this item to the recompute queue.
   */
  _enqueue() {
    this._depItem.enqueue();
  }

  /**
   * Disposes the computed, unsubscribing it from all observables it depends on.
   */
  dispose() {
    for (let lis of this._depListeners) { lis.dispose(); }
    for (let lis of this._dynDeps.values()) { lis.dispose(); }
  }
}


/**
 * Creates a new Subscription.
 * @param {Observable} ...observables: The initial params, of which there may be zero or more, are
 *    observables on which this computed depends. When any of them change, the read() callback
 *    will be called with the values of these observables as arguments.
 * @param {Function} read: Callback that will be called with arguments (use, ...values), i.e. the
 *    `use` function and values for all of the ...observables that precede this argument.
 *    This callback is called immediately, and whenever any dependency changes.
 * @returns {Subscription} The new subscription which may be disposed to unsubscribe.
 */
function subscribe(...args) {
  let read = args.pop();
  return new Subscription(read, args);
}

module.exports = subscribe;
module.exports.Subscription = Subscription;
