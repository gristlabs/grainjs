/**
 * pureComputed.js implements a variant of computed() suitable for use with a pure read function
 * (free of side-effects). A pureComputed is only subscribed to its dependencies when something is
 * subscribed to it. At other times, it is not subscribed to anything, and calls to `get()` will
 * recompute its value each time by calling its read() function.
 *
 * Its syntax and usage are otherwise exactly as for a computed.
 *
 * In addition to being cheaper when unused, a pureComputed() also avoids leaking memory when
 * unused (since it's not registered with dependencies), so it is not necessary to dispose it.
 */
"use strict";

const {Observable} = require('./observable');
const subscribe = require('./subscribe');
const util = require('./util');


function _noWrite() {
  throw new Error("Can't write to non-writable computed");
}

function _useFunc(obs) {
  return obs.get();
}

class PureComputed extends Observable {
  /**
   * Internal constructor for a Computed observable. You should use computed() function instead.
   */
  constructor(dependencies, {read, write=null}) {
    super();
    this._write = write || _noWrite;
    this._dependencies = dependencies;
    this._update = (use, ...args) => super.set(read(use, ...args));
    this._sub = null;
    this.setListenerChangeCB(hasListeners => hasListeners ? this._activate() : this._deactivate());

    this._readArgs = Array(this._dependencies.length + 1);
    this._readArgs[0] = _useFunc;
    this._read = util.bindB(read, this._readArgs);
    this._inCall = false;
  }

  _activate() {
    if (!this._sub) {
      this._sub = new subscribe.Subscription(this._update, this._dependencies);
    }
  }

  _deactivate() {
    if (this._sub) {
      this._sub.dispose();
      this._sub = null;
    }
  }

  _getDepItem() {
    this._activate();
    return this._sub._depItem;
  }

  get() {
    if (!this._sub && !this._inCall) {
      // _inCall member prevents infinite recursion.
      this._inCall = true;
      try {
        // Note that this attempts to optimize for speed.
        for (let i = 0, len = this._dependencies.length; i < len; i++) {
          this._readArgs[i + 1] = this._dependencies[i].get();
        }
        super.set(this._read());
      } finally {
        this._inCall = false;
      }
    }
    return super.get();
  }


  /**
   * "Sets" the value of the pure computed by calling the write() callback if one was provided in
   * the constructor. Throws an error if there was no such callback (not a "writable" computed).
   * @param {Object} value: The value to pass to the write() callback.
   */
  set(value) { this._write(value); }

  // TODO: document.
  onWrite(writeFunc) {
    this._write = writeFunc;
    return this;
  }

  /**
   * Disposes the computed, unsubscribing it from all observables it depends on.
   */
  dispose() {
    if (this._sub) {
      this._sub.dispose();
      this._sub = true;     // Truthy value prevents some errors after disposal.
    }
    super.dispose();
  }
}

/**
 * Creates and returns a new PureComputed. The interface is identical to that of a Computed.
 */
function pureComputed(...args) {
  let last = args.pop();
  let options = (typeof last === 'function') ? {read: last} : last;
  return new PureComputed(args, options);
}

module.exports = pureComputed;
module.exports.PureComputed = PureComputed;
