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
 *  let val = computed(...deps, ((use, ...depValues) => READ_CALLBACK));
 *
 * You may specify a `write` callback by calling `onWrite(WRITE_CALLBACK)`, which will be called
 * whenever set() is called on the computed by its user. If a `write` bacllback is not specified,
 * calling `set` on a computed observable will throw an exception.
 *
 * Note that pureComputed.js offers a variation of computed() with the same interface, but which
 * stays unsubscribed from dependencies while it itself has no subscribers.
 */

import {DepItem} from './_computed_queue';
import {Observable} from './observable';
import {ISubscribable, Subscription, UseCB} from './subscribe';

function _noWrite(): never {
  throw new Error("Can't write to non-writable computed");
}

export class Computed<T> extends Observable<T> {
  private _read: (use: UseCB, ...args: ISubscribable[]) => void;
  private _write: (value: T) => void;
  private _sub: Subscription;

  /**
   * Internal constructor for a Computed observable. You should use computed() function instead.
   */
  constructor(callback: (use: UseCB, ...args: any[]) => T, dependencies: ISubscribable[]) {
    // At initialization we force an undefined value even though it's not of type T: it gets set
    // to a proper value during the creation of new Subscription, which calls this._read.
    super(undefined as any);
    this._read = (use, ...args) => super.set(callback(use, ...args));
    this._write = _noWrite;
    this._sub = new Subscription(this._read, dependencies);
  }

  /**
   * Used by subscriptions to keep track of dependencies.
   */
  public _getDepItem(): DepItem {
    return this._sub._getDepItem();
  }

  /**
   * "Sets" the value of the computed by calling the write() callback if one was provided in the
   * constructor. Throws an error if there was no such callback (not a "writable" computed).
   * @param {Object} value: The value to pass to the write() callback.
   */
  public set(value: T): void { this._write(value); }

  /**
   * Set callback to call when this.set(value) is called, to make it a writable computed. If not
   * set, attempting to write to this computed will throw an exception.
   */
  public onWrite(writeFunc: (value: T) => void): Computed<T> {
    this._write = writeFunc;
    return this;
  }

  /**
   * Disposes the computed, unsubscribing it from all observables it depends on.
   */
  public dispose() {
    this._sub.dispose();
    super.dispose();
  }
}

type Obs<T> = Observable<T>;

/**
 * This is the type-checking interface for computed(), which allows TypeScript to do helpful
 * type-checking when using it. We can only support a fixed number of argumnets (explicit
 * dependencies), but 5 should almost always be enough.
 */
interface IComputed {
  <T>(cb: (use: UseCB) => T): Computed<T>;

  <A, T>(
    a: Obs<A>,
    cb: (use: UseCB, a: A) => T): Computed<T>;

  <A, B, T>(
    a: Obs<A>, b: Obs<B>,
    cb: (use: UseCB, a: A, b: B) => T): Computed<T>;

  <A, B, C, T>(
    a: Obs<A>, b: Obs<B>, c: Obs<C>,
    cb: (use: UseCB, a: A, b: B, c: C) => T): Computed<T>;

  <A, B, C, D, T>(
    a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>,
    cb: (use: UseCB, a: A, b: B, c: C, d: D) => T): Computed<T>;

  <A, B, C, D, E, T>(
    a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>, e: Obs<E>,
    cb: (use: UseCB, a: A, b: B, c: C, d: D, e: E) => T): Computed<T>;
}

/**
 * Creates a new Computed.
 * @param {Observable} ...observables: The initial params, of which there may be zero or more, are
 *    observables on which this computed depends. When any of them change, the read() callback
 *    will be called with the values of these observables as arguments.
 * @param {Function} readCallback: Read callback that will be called with (use, ...values),
 *    i.e. the `use` function and values for all of the ...observables. The callback is called
 *    immediately and whenever any dependency changes.
 * @returns {Computed} The newly created computed observable.
 */
export const computed: IComputed = function(...args: any[]): Computed<any> {
  const readCb = args.pop();
  return new Computed<any>(readCb, args);
};

// TODO Consider mplementing .singleUse() method.
// An open question is in how to pass e.g. kd.hide(computed(x, x => !x)) in such a way that
// the temporary computed can be disposed when temporary, but not otherwise. A function-only
// syntax is kd.hide(use => !use(x)), but prevents use of static subscriptions.
//
// (a) function-only use of computeds is fine and useful.
// (b) pureComputed is another option, and doesn't technically require getting disposed.
// (c) kd.hide(compObs), kd.autoDispose(compObs) is more general and
//     can be replaced more concisely by kd.hide(compObs.singleUse())
// .singleUse() automatically disposes a computed (or an observable?) once there are no
// subscriptions to it. If there are no subscriptions at the time of this call, waits for the next
// tick, and possibly disposes then.