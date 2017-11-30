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

import {DepItem} from './_computed_queue';
import {Observable} from './observable';
import {ISubscribable, Subscription, UseCB} from './subscribe';
import {bindB} from './util';

function _noWrite(): never {
  throw new Error("Can't write to non-writable pureComputed");
}

function _useFunc<T>(obs: Observable<T>): T {
  return obs.get();
}

export class PureComputed<T> extends Observable<T> {
  private _read: (use: UseCB, ...args: ISubscribable[]) => void;
  private _write: (value: T) => void;
  private _sub: Subscription|null;
  private _dependencies: ISubscribable[];
  private _readArgs: any[];
  private _directRead: () => T;
  private _inCall: boolean;

  /**
   * Internal constructor for a PureComputed. You should use pureComputed() function instead.
   */
  constructor(callback: (use: UseCB, ...args: any[]) => T, dependencies: ISubscribable[]) {
    // At initialization we force an undefined value even though it's not of type T: it's not
    // actually used as get() is overridden.
    super(undefined as any);
    this._write = _noWrite;
    this._dependencies = dependencies || [];
    this._read = (use, ...args) => super.set(callback(use, ...args));
    this._sub = null;
    this.setListenerChangeCB((hasListeners) => hasListeners ? this._activate() : this._deactivate());

    this._readArgs = Array(this._dependencies.length + 1);
    this._readArgs[0] = _useFunc;
    this._directRead = bindB(callback, this._readArgs);
    this._inCall = false;
  }

  public _getDepItem(): DepItem {
    this._activate();
    return this._sub!._getDepItem();
  }

  public get(): T {
    if (!this._sub && !this._inCall) {
      // _inCall member prevents infinite recursion.
      this._inCall = true;
      try {
        // Note that this attempts to optimize for speed.
        for (let i = 0, len = this._dependencies.length; i < len; i++) {
          this._readArgs[i + 1] = this._dependencies[i].get();
        }
        super.set(this._directRead());
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
  public set(value: T): void { this._write(value); }

  /**
   * Set callback to call when this.set(value) is called, to make it a writable computed. If not
   * set, attempting to write to this computed will throw an exception.
   */
  public onWrite(writeFunc: (value: T) => void): PureComputed<T> {
    this._write = writeFunc;
    return this;
  }

  /**
   * Disposes the pureComputed, unsubscribing it from all observables it depends on.
   */
  public dispose() {
    if (this._sub) {
      this._sub.dispose();
    }
    // Truthy value for _sub prevents some errors after disposal, by avoiding activation or
    // _directRead calls.
    this._sub = true as any;
    super.dispose();
  }

  private _activate(): void {
    if (!this._sub) {
      this._sub = new Subscription(this._read, this._dependencies);
    }
  }

  private _deactivate(): void {
    if (this._sub) {
      this._sub.dispose();
      this._sub = null;
    }
  }
}

type Obs<T> = Observable<T>;

/**
 * This is the type-checking interface for pureComputed(), which allows TypeScript to do helpful
 * type-checking when using it. We can only support a fixed number of argumnets (explicit
 * dependencies), but 5 should almost always be enough.
 */
interface IPureComputed {
  <T>(cb: (use: UseCB) => T): PureComputed<T>;

  <A, T>(
    a: Obs<A>,
    cb: (use: UseCB, a: A) => T): PureComputed<T>;

  <A, B, T>(
    a: Obs<A>, b: Obs<B>,
    cb: (use: UseCB, a: A, b: B) => T): PureComputed<T>;

  <A, B, C, T>(
    a: Obs<A>, b: Obs<B>, c: Obs<C>,
    cb: (use: UseCB, a: A, b: B, c: C) => T): PureComputed<T>;

  <A, B, C, D, T>(
    a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>,
    cb: (use: UseCB, a: A, b: B, c: C, d: D) => T): PureComputed<T>;

  <A, B, C, D, E, T>(
    a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>, e: Obs<E>,
    cb: (use: UseCB, a: A, b: B, c: C, d: D, e: E) => T): PureComputed<T>;
}

/**
 * Creates and returns a new PureComputed. The interface is identical to that of a Computed.
 */
export const pureComputed: IPureComputed = function(...args: any[]): PureComputed<any> {
  const readCb = args.pop();
  // The cast helps ensure that Observable is compatible with ISubscribable abstraction that we use.
  return new PureComputed<any>(readCb, args);
};
