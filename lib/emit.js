/**
 * emit.js implements an Emitter class which emits events to a list of listeners. Listeners are
 * simply functions to call, and "emitting an event" just calls those functions.
 *
 * This is similar to Backbone events, with more focus on efficiency. Both inserting and removing
 * listeners is constant time.
 *
 * To create an emitter:
 *    let emitter = new Emitter();
 *
 * To add a listener:
 *    let listener = fooEmitter.addListener(callback);
 * To remove a listener:
 *    listener.dispose();
 *
 * The only way to remove a listener is to dispose the Listener object returned by addListener().
 * You can often use autoDispose to do this automatically when subscribing in a constructor:
 *    this.autoDispose(fooEmitter.addListener(this.onFoo, this));
 *
 * To emit an event, call emit() with any number of arguments:
 *    emitter.emit("hello", "world");
 */
"use strict";


// Note about a possible alternative implementation.
//
// We could implement the same interface using an array of listeners. Certain issues apply, in
// particular with removing listeners from inside emit(), and in ensuring that removals are
// constant time on average. Such an implementation was attempted and timed. The result is that
// compared to the linked-list implementation here, add/remove combination could be made nearly
// twice faster (on average), while emit and add/remove/emit are consistently slightly slower.
//
// The implementation here was chosen based on those timings, and as the simpler one. For example,
// on one setup (macbook, node4, 5-listener queue), add+remove take 0.1us, while add+remove+emit
// take 3.82us. (In array-based implementation with same set up, add+remove is 0.06us, while
// add+remove+emit is 4.80us.)


// The private property name to hold next/prev pointers.
const _next = Symbol('_next');
const _prev = Symbol('_prev');
const _changeCB = Symbol('_changeCB');

function _noop() {}

class Emitter {
  /**
   * Constructs an Emitter object.
   */
  constructor() {
    // This immediate circular reference might be undesirable for GC, but might not matter, and
    // makes the linked list implementation simpler and faster.
    this[_next] = this;
    this[_prev] = this;
    this[_changeCB] = _noop;
  }

  /**
   * Adds a listening callback to the list of functions to call on emit().
   * @param {Function} callback: Function to call.
   * @param {Object} optContext: Context for the function.
   * @returns {Listener} Listener object. Its dispose() method removes the callback from the list.
   */
  addListener(callback, optContext) {
    return new Listener(this, callback, optContext);
  }

  /**
   * Calls all listener callbacks, passing all arguments to each of them.
   */
  emit(...args) {
    let lis = this[_next];
    while (lis !== this) {
      // There is a bug in Node 4.2.4 with ...args calls, which cause a ReferenceError, but they
      // work as long as there is a "let" variable defined inside the block. Weird.
      let dummy = lis;
      lis.callback.call(lis.context, ...args);
      lis = lis[_next];
    }
  }

  /**
   * Sets the single callback that would get called when a listener is added or removed.
   * @param {Function} changeCB(hasListeners): Function to call after a listener is added or
   *    removed. It's called with a boolean indicating whether this Emitter has any listeners.
   *    Pass in `null` to unset the callback.
   */
  setChangeCB(changeCB) {
    this[_changeCB] = changeCB || _noop;
  }

  /**
   * Returns whether this Emitter has any listeners.
   */
  hasListeners() {
    return this[_next] !== this;
  }

  /**
   * Disposes the Emitter. It breaks references between the emitter and all the items, allowing
   * for better garbage collection. It effectively disposes all current listeners.
   */
  dispose() {
    let node = this;
    let next = node[_next];
    while (next !== null) {
      node[_next] = node[_prev] = null;
      node = next;
      next = node[_next];
    }
    this[_changeCB] = _noop;
  }

  /**
   * Returns whether this Emitter is disposed.
   */
  isDisposed() {
    return !this[_next];
  }
}
exports.Emitter = Emitter;


/**
 * Listener object wraps a callback added to an Emitter, allowing for O(1) removal when the
 * listener is disposed.
 */
class Listener {
  constructor(emitter, callback, context) {
    this.emitter = emitter;
    this.callback = callback;
    this.context = context;

    let next = emitter;
    let last = next[_prev];
    last[_next] = this;
    next[_prev] = this;
    this[_prev] = last;
    this[_next] = next;
    emitter[_changeCB].call(undefined, true);
  }

  dispose() {
    if (this.isDisposed()) { return; }
    this[_prev][_next] = this[_next];
    this[_next][_prev] = this[_prev];
    this[_prev] = this[_next] = null;
    let emitter = this.emitter;
    emitter[_changeCB].call(undefined, emitter[_next] !== emitter);
  }

  isDisposed() {
    return !this[_next];
  }
}
exports.Listener = Listener;
