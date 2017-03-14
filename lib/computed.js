/**
 * computed.js implements a computed observable, whose value depends on other observables and gets
 * recalculated automatically when they change.
 *
 * E.g. if we have some existing observables (which may themselves be instances of `computed`),
 * we can create a computed that subscribes to them explicitly:
 *  let obs1 = observable(5), obs2 = observable(12);
 *  let computed1 = computed(obs1, obs2, (v1, v2, c) => v1 + v2);
 *
 * or implicitly by using `use(obs)` function:
 *  let computed2 = computed(use => use(obs1) + use(obs2));
 *
 * In either case, computed1.get() and computed2.get() will have the value 17. If obs1 or obs2 is
 * changed, computed1 and computed2 will get recomputed automatically.
 *
 * Creating a computed allows any number of dependencies to be specified explicitly, and their
 * values will be passed to the read() callback. These may be combined with automatic dependencies
 * detected using use(). Note that explicit dependencies are preferred due to smaller overhead.
 *
 *  let val = computed(...deps, ((...depValues, context) => READ_CALLBACK), options);
 *
 * Options are optional, and may specify a `write` callback. If a `write` callback is not
 * specified, calling `set` on a computed observable will throw an exception. It is also possible
 * for options to specify a `read` callback instead of passing it as a separate argument.
 */
"use strict";

const observable = require('./observable.js');

function _noWrite() {
  throw new Error("Can't write to non-writable computed");
}

class Computed extends observable.Observable {
  /**
   * Internal constructor for a Computed observable. You should use computed() function instead.
   */
  constructor(read, write, dependencies) {
    super();
    this._read = read;
    this._write = write || _noWrite;
    this._dependencies = dependencies || [];
    this._depListeners = this._dependencies.map(obs => this._subscribeTo(obs));
    this._dynDeps = new Map();   // Maps observable to its Listener object.
    this._contextFunc = obs => this._useDependency(obs);
    this._evaluateAndSet();
  }

  /**
   * @private
   * Gets called when the read() callback calls `use(obs)` for another observable. It creates a
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
    return obs.get();
  }

  /**
   * @private
   * Calls the read() callback, and updates subscriptions when it is done.
   * @returns {Object} The new value for this computed.
   */
  _evaluate() {
    try {
      let values = this._dependencies.map(d => d.get());
      return this._read(...values, this._contextFunc);
    } finally {
      this._updateSubs();
    }
  }

  /**
   * @private
   * Calls evaluate() and saves the result as the current value of the computed.
   */
  _evaluateAndSet() {
    super.set(this._evaluate());
  }

  /**
   * @private
   * Updates dynamic subscriptions (those created via `use(obs)` calls by the read() callback),
   * disposing subscriptions that are no longer in use.
   */
  _updateSubs() {
    this._dynDeps.forEach((listener, obs) => {
      if (listener.inUse) {
        listener.inUse = false;
      } else {
        this._dynDeps.delete(obs);
        listener.dispose();
      }
    });
  }

  /**
   * @private
   * Subscribes this computed to another observable that it depends on.
   * @param {Observable} obs: The observable to subscribe to.
   * @returns {Listener} Listener object.
   */
  _subscribeTo(obs) {
    return obs.onChange.addListener(this._evaluateAndSet, this);
  }

  /**
   * "Sets" the value of the computed by calling the write() callback if one was provided in the
   * constructor. Throws an error if there was no such callback (not a "writable" computed).
   * @param {Object} value: The value to pass to the write() callback.
   */
  set(value) { this._write(value); }

  /**
   * Disposes the computed, unsubscribing it from all observables it depends on.
   */
  dispose() {
    for (let lis of this._depListeners) { lis.dispose(); }
    for (let lis of this._dynDeps.values()) { lis.dispose(); }
    super.dispose();
  }
}

/**
 * Creates a new Computed.
 * @param {Observable} ...observables: The initial params, of which there may be zero or more, are
 *    observables on which this computed depends. When any of them change, the read() callback
 *    will be called with the values of these observables as the initial arguments.
 * @param {Function} read: Callback that will be called with arguments (...values, c), i.e. the
 *    values for all of the ...observables that precede this argument, and the context function.
 *    This argument must be omitted if there is an `options` argument with a "read" key.
 * @param {Object} [options]: Optional options.
 * @param {Function} options.read: Alternative way to specify the read() callback.
 * @param {Function} options.write: Function to be called with (value) when `computed.set(value)`
 *    is called, making it a "writable" computed. If omitted, calling `set()` throws an error.
 * @returns {Computed} The newly created computed observable.
 */
function computed(...args) {
  let last = args.pop();
  let read, write = null;
  if (typeof last === 'function') {
    read = last;
  } else {
    read = last.read || args.pop();
    write = last.write;
  }
  return new Computed(read, write, args);
}

// TODO
// I'd like pureComputed, which is like computed when there is a subscriber, but with no
// subscribers, is itself unsubscribed from everywhere.
// It may be best to wrap it so that a pureComputed has a member .computed, which is null or a
// real computed. I.e. no chance to use it when it's inactive.
// Or maybe it's just dandy fine to use it when inactive. It's just functions...

// Another open question is in how to pass e.g. kd.hide(computed(x, x => !x)) in such a way that
// the temporary computed can be disposed when temporary, but not otherwise. A function-only
// syntax is kd.hide(use => !use(x)), but prevents use of static subscriptions.


module.exports = computed;
module.exports.Computed = Computed;
