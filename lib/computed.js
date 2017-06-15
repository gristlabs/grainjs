/**
 * computed.js implements a computed observable, whose value depends on other observables and gets
 * recalculated automatically when they change.
 *
 * E.g. if we have some existing observables (which may themselves be instances of `computed`),
 * we can create a computed that subscribes to them explicitly:
 *  let obs1 = observable(5), obs2 = observable(12);
 *  let computed1 = computed(obs1, obs2, (use, v1, v2) => v1 + v2);
 *
 * or implicitly by using `use(obs)` function:
 *  let computed2 = computed(use => use(obs1) + use(obs2));
 *
 * In either case, computed1.get() and computed2.get() will have the value 17. If obs1 or obs2 is
 * changed, computed1 and computed2 will get recomputed automatically.
 *
 * Creating a computed allows any number of dependencies to be specified explicitly, and their
 * values will be passed to the read() callback. These may be combined with automatic dependencies
 * detected using use(). Note that constructor dependencies have less overhead.
 *
 *  let val = computed(...deps, ((use, ...depValues) => READ_CALLBACK), options);
 *
 * Options are optional, and may specify a `write` callback. If a `write` callback is not
 * specified, calling `set` on a computed observable will throw an exception. It is also possible
 * for options to specify a `read` callback instead of passing it as a separate argument.
 */
"use strict";

const observable = require('./observable.js');
const subscribe = require('./subscribe.js');


// TODO It would be nice to add a computed.pure(), with same interface as computed(), but that
// stays unsubscribed from everywhere until it itself has subscribers. While inactive, get()
// always evaluates the expression (as a plain accessor function).
//
// TODO Implement .singleUse() method. Both this and pure computeds need a way to subscribe to
// changes in Emitter's subscriptions.


function _noWrite() {
  throw new Error("Can't write to non-writable computed");
}

class Computed extends observable.Observable {
  /**
   * Internal constructor for a Computed observable. You should use computed() function instead.
   */
  constructor(read, write, dependencies) {
    super();
    this._read = (use, ...args) => super.set(read(use, ...args));
    this._write = write || _noWrite;
    this._sub = new subscribe.Subscription(this._read, dependencies);
  }

  /**
   * Used by subscriptions to keep track of dependencies.
   */
  _getDepItem() {
    return this._sub._depItem;
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
    this._sub.dispose();
    super.dispose();
  }

  /**
   * Auto-dispose this computed once there are no subscriptions to it. If there are no
   * subscriptions at the time of this call, waits for the next tick, and possibly disposes then.
   */
  singleUse() {
    throw new Error("Not implemented");
  }
}

/**
 * Creates a new Computed.
 * @param {Observable} ...observables: The initial params, of which there may be zero or more, are
 *    observables on which this computed depends. When any of them change, the read() callback
 *    will be called with the values of these observables as arguments.
 * @param {Function} read: Callback that will be called with arguments (use, ...values), i.e. the
 *    `use` function and values for all of the ...observables that precede this argument.
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
//
// (a) function-only use of computeds is fine and useful.
// (b) kd.hide(compObs), kd.autoDispose(compObs)
//     can be replaced more concisely by kd.hide(compObs.singleUse())
//     .singleUse() automatically disposes an observable after the last unsubscribe. If there are
//     no subscriptions, it waits for the first one.
// (c) pureComputed we can do. Perhaps call computed.pure(...).
// (d) subscribe(...) should have same interface as computed, but not be an observable, i.e. no
//     value, and can't be subscribed to. I.e. for side-effects only.
//     It's best to build computed on top of this.
//     Perhaps call observable.sub(...).

module.exports = computed;
module.exports.Computed = Computed;
