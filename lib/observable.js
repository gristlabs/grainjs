/**
 * observable.js implements an observable value, which lets other code subscribe to changes.
 *
 * E.g.
 *  let o = observable(17);
 *  o.get();          // 17
 *  o.onChange.addListener(foo);
 *  o.set("asdf");    // foo("asdf", 17) gets called.
 *  o.get();          // "asdf"
 *
 * To subscribe to changes, use obs.onChange.addListener(callback, context). The callback
 * will get called with (newValue, oldValue) as arguments.
 *
 * When you use observables within the body of a computed(), you can automatically create
 * subscriptions to them with the obs.use(c) method. E.g.
 *    let obs3 = computed(c => obs1.use(c) + obs2.use(c));
 * creates a computed observable `obs3` which is subscribed to changes to `obs1` and `obs2`.
 *
 * Note that unlike with knockout, obs.use(c) method requires a context argument, which is always
 * passed to a computed's read() callback for this purpose. This makes it explicit when a
 * dependency is created, and which observables the dependency connects.
 */
"use strict";

const emit = require('./emit.js');


// The private property name to hold the observable's value.
const _value = Symbol('_value');


class Observable {
  /**
   * Internal constructor for an Observable. You should use observable() function instead.
   */
  constructor(optValue) {
    this.onChange = new emit.Emitter();
    this[_value] = optValue;
  }

  /**
   * Returns the value of the observable. It is fast and does not create a subscription.
   * (It is similar to knockout's peek()).
   * @returns {Object} The current value of the observable.
   */
  get() { return this[_value]; }

  /**
   * Returns the value of the observable, subscribing to it first when used in the context of a
   * computed's read() callback.
   * @param {Function} contextFunc: Function to call to indicate a subscription. It is intended to
   *    be the function that gets passed by a computed to its read() callback.
   * @returns {Object} The current value of the observable.
   */
  use(contextFunc) {
    contextFunc(this);
    return this[_value];
  }

  /**
   * Sets the value of the observable. If the value differs from the previously set one, then
   * subscribes to this.onChange will get called with (newValue, oldValue) as arguments.
   * @param {Object} value: The new value to set.
   */
  set(value) {
    let prev = this[_value];
    if (value !== prev) {
      this[_value] = value;
      this.onChange.emit(value, prev);
    }
  }

  /**
   * Disposes the observable.
   */
  dispose() {
    this.onChange.dispose();
    this[_value] = undefined;
  }
}


/**
 * Creates a new Observable with the initial value of optValue if given or undefined if omitted.
 * @param {Object} optValue: The initial value to set.
 * @returns {Observable} The newly created observable.
 */
function observable(optValue) {
  return new Observable(optValue);
}

module.exports = observable;
module.exports.Observable = Observable;
