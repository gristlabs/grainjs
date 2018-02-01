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
import { Observable } from './observable';
import { Subscription } from './subscribe';
function _noWrite() {
    throw new Error("Can't write to non-writable pureComputed");
}
function _useFunc(obs) {
    return obs.get();
}
// Constant empty array, which we use to avoid allocating new read-only empty arrays.
const emptyArray = [];
export class PureComputed extends Observable {
    /**
     * Internal constructor for a PureComputed. You should use pureComputed() function instead.
     */
    constructor(callback, dependencies) {
        // At initialization we force an undefined value even though it's not of type T: it's not
        // actually used as get() is overridden.
        super(undefined);
        this._callback = callback;
        this._write = _noWrite;
        this._dependencies = dependencies.length > 0 ? dependencies : emptyArray;
        this._sub = null;
        this._inCall = false;
        this.setListenerChangeCB(this._onListenerChange, this);
    }
    _getDepItem() {
        this._activate();
        return this._sub._getDepItem();
    }
    get() {
        if (!this._sub && !this._inCall) {
            // _inCall member prevents infinite recursion.
            this._inCall = true;
            try {
                const readArgs = [_useFunc];
                // Note that this attempts to optimize for speed.
                for (let i = 0, len = this._dependencies.length; i < len; i++) {
                    readArgs[i + 1] = this._dependencies[i].get();
                }
                super.set(this._callback.apply(undefined, readArgs));
            }
            finally {
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
    /**
     * Set callback to call when this.set(value) is called, to make it a writable computed. If not
     * set, attempting to write to this computed will throw an exception.
     */
    onWrite(writeFunc) {
        this._write = writeFunc;
        return this;
    }
    /**
     * Disposes the pureComputed, unsubscribing it from all observables it depends on.
     */
    dispose() {
        if (this._sub) {
            this._sub.dispose();
        }
        // Truthy value for _sub prevents some errors after disposal, by avoiding activation or
        // _directRead calls.
        this._sub = true;
        super.dispose();
    }
    _activate() {
        if (!this._sub) {
            this._sub = new Subscription(this._read.bind(this), this._dependencies);
        }
    }
    _onListenerChange(hasListeners) {
        if (hasListeners) {
            this._activate();
        }
        else if (this._sub) {
            this._sub.dispose();
            this._sub = null;
        }
    }
    _read(use, ...args) {
        super.set(this._callback(use, ...args));
    }
}
/**
 * Creates and returns a new PureComputed. The interface is identical to that of a Computed.
 */
export function pureComputed(...args) {
    const readCb = args.pop();
    // The cast helps ensure that Observable is compatible with ISubscribable abstraction that we use.
    return new PureComputed(readCb, args);
}
