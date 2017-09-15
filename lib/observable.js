/**
 * observable.js implements an observable value, which lets other code subscribe to changes.
 *
 * E.g.
 *  let o = observable(17);
 *  o.get();          // 17
 *  o.addListener(foo);
 *  o.set("asdf");    // foo("asdf", 17) gets called.
 *  o.get();          // "asdf"
 *
 * To subscribe to changes, use obs.addListener(callback, context). The callback will get called
 * with (newValue, oldValue) as arguments.
 *
 * When you use observables within the body of a computed(), you can automatically create
 * subscriptions to them with the use(obs) function. E.g.
 *    let obs3 = computed(use => use(obs1) + use(obs2));
 * creates a computed observable `obs3` which is subscribed to changes to `obs1` and `obs2`.
 *
 * Note that unlike with knockout, use(obs) method requires an explicit `use` function, which is
 * always passed to a computed's read() callback for this purpose. This makes it explicit when a
 * dependency is created, and which observables the dependency connects.
 */
"use strict";

const _computed_queue = require('./_computed_queue.js');
const emit = require('./emit.js');

// The private property names for private members of an observable.
const _value = Symbol('_value');
const _onChange = Symbol('_onChange');

class Observable {
  /**
   * Internal constructor for an Observable. You should use observable() function instead.
   */
  constructor(optValue) {
    this[_onChange] = new emit.Emitter();
    this[_value] = optValue;
  }

  /**
   * Returns the value of the observable. It is fast and does not create a subscription.
   * (It is similar to knockout's peek()).
   * @returns {Object} The current value of the observable.
   */
  get() { return this[_value]; }

  /**
   * Sets the value of the observable. If the value differs from the previously set one, then
   * listeners to this observable will get called with (newValue, oldValue) as arguments.
   * @param {Object} value: The new value to set.
   */
  set(value) {
    let prev = this[_value];
    if (value !== prev) {
      this[_value] = value;
      this[_onChange].emit(value, prev);
      _computed_queue.compute();
    }
  }

  /**
   * Adds a callback to listen to changes in the observable.
   * @param {Function} callback: Function, called on changes with (newValue, oldValue) arguments.
   * @param {Object} optContext: Context for the function.
   * @returns {Listener} Listener object. Its dispose() method removes the callback.
   */
  addListener(callback, optContext) {
    return this[_onChange].addListener(callback, optContext);
  }

  /**
   * Returns whether this observable has any listeners.
   */
  hasListeners() {
    return this[_onChange].hasListeners();
  }

  /**
   * Sets a single callback to be called when a listener is added or removed. It overwrites any
   * previously-set such callback.
   * @param {Function} changeCB(hasListeners): Function to call after a listener is added or
   *    removed. It's called with a boolean indicating whether this observable has any listeners.
   *    Pass in `null` to unset the callback.
   */
  setListenerChangeCB(changeCB) {
    this[_onChange].setChangeCB(changeCB);
  }

  /**
   * Used by subscriptions to keep track of dependencies. An observable that has dependnecies,
   * such as a computed observable, would override this method.
   */
  _getDepItem() {
    return null;
  }

  /**
   * Disposes the observable.
   */
  dispose() {
    this[_onChange].dispose();
    this[_value] = undefined;
  }

  /**
   * Returns whether this observable is disposed.
   */
  isDisposed() {
    return this[_onChange].isDisposed();
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
module.exports.bundleChanges = _computed_queue.bundleChanges;
