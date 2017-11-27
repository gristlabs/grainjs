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
 * values will be passed to the callback(). These may be combined with automatic dependencies
 * detected using use(). Note that constructor dependencies have less overhead.
 *
 *    subscribe(...deps, ((use, ...depValues) => READ_CALLBACK));
 */

import {DepItem} from './_computed_queue';
import {Listener} from './emit';
import {Observable} from './observable';
import {bindB} from './util';

interface IObservable {
  _getDepItem(): DepItem|null;
  addListener(callback: (val: any, prev: any) => void, optContext?: object): Listener;
  get(): any;
}

interface IListenerWithInUse extends Listener {
  _inUse: boolean;
}

export class Subscription {
  private _depItem: DepItem;
  private _dependencies: IObservable[];
  private _depListeners: Listener[];
  private _dynDeps: Map<IObservable, IListenerWithInUse>;
  private _readArgs: any[];
  private _read: () => void;

  /**
   * Internal constructor for a Subscription. You should use subscribe() function instead.
   */
  constructor(callback: () => void, dependencies: IObservable[]) {
    this._depItem = new DepItem(this._evaluate, this);
    this._dependencies = dependencies || [];
    this._depListeners = this._dependencies.map((obs) => this._subscribeTo(obs));
    this._dynDeps = new Map();   // Maps dependent observable to its Listener object.

    const useFunc = ((obs: IObservable) => this._useDependency(obs));
    this._readArgs = Array(this._dependencies.length + 1);
    this._readArgs[0] = useFunc;
    this._read = bindB(callback, this._readArgs);

    this._evaluate();
  }

  /**
   * Disposes the computed, unsubscribing it from all observables it depends on.
   */
  public dispose() {
    for (const lis of this._depListeners) { lis.dispose(); }
    for (const lis of this._dynDeps.values()) { lis.dispose(); }
  }

  /**
   * @private
   * Gets called when the callback calls `use(obs)` for an observable. It creates a
   * subscription to `obs` if one doesn't yet exist.
   * @param {Observable} obs: The observable being used as a dependency.
   */
  private _useDependency(obs: IObservable) {
    let listener = this._dynDeps.get(obs);
    if (!listener) {
      listener = this._subscribeTo(obs) as IListenerWithInUse;
      this._dynDeps.set(obs, listener);
    }
    listener._inUse = true;
    this._depItem.useDep(obs._getDepItem());
    return obs.get();
  }

  /**
   * @private
   * Calls the callback() with appropriate args, and updates subscriptions when it is done.
   * I.e. adds dynamic subscriptions created via `use(obs)`, and disposes those no longer used.
   */
  private _evaluate() {
    try {
      // Note that this is optimized for speed.
      for (let i = 0, len = this._dependencies.length; i < len; i++) {
        this._readArgs[i + 1] = this._dependencies[i].get();
        this._depItem.useDep(this._dependencies[i]._getDepItem());
      }
      return this._read();
    } finally {
      this._dynDeps.forEach((listener, obs) => {
        if (listener._inUse) {
          listener._inUse = false;
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
  private _subscribeTo(obs: IObservable) {
    return obs.addListener(this._enqueue, this);
  }

  /**
   * @private
   * Adds this item to the recompute queue.
   */
  private _enqueue() {
    this._depItem.enqueue();
  }
}

type UseCB = <T>(obs: Observable<T>) => T;
type Obs<T> = Observable<T>;

/**
 * This is the type-checking interface for subscribe() and similar functions (e.g. computed()). It
 * allows TypeScript to do helpful type-checking when using these functions.
 *
 * We can't support a completely arbitrary number of arguments (explicit dependencies), but we
 * support up to 5, which should almost always be sufficient.
 */
export interface ISubscribe<Ret> {
  (cb: (use: UseCB) => Ret): Subscription;

  <A>(
    a: Obs<A>,
    cb: (use: UseCB, a: A) => Ret): Subscription;

  <A, B>(
    a: Obs<A>, b: Obs<B>,
    cb: (use: UseCB, a: A, b: B) => Ret): Subscription;

  <A, B, C>(
    a: Obs<A>, b: Obs<B>, c: Obs<C>,
    cb: (use: UseCB, a: A, b: B, c: C) => Ret): Subscription;

  <A, B, C, D>(
    a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>,
    cb: (use: UseCB, a: A, b: B, c: C, d: D) => Ret): Subscription;

  <A, B, C, D, E>(
    a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>, e: Obs<E>,
    cb: (use: UseCB, a: A, b: B, c: C, d: D, e: E) => Ret): Subscription;
}

/**
 * Creates a new Subscription.
 * @param {Observable} ...observables: The initial params, of which there may be zero or more, are
 *    observables on which this computed depends. When any of them change, the callback()
 *    will be called with the values of these observables as arguments.
 * @param {Function} callback: will be called with arguments (use, ...values), i.e. the
 *    `use` function and values for all of the ...observables that precede this argument.
 *    This callback is called immediately, and whenever any dependency changes.
 * @returns {Subscription} The new subscription which may be disposed to unsubscribe.
 */
export const subscribe: ISubscribe<void> = function(...args: any[]): Subscription {
  const cb = args.pop();
  // The case helps ensure that Observable is compatible with IObservable abstraction that we use.
  return new Subscription(cb, args as Array<Observable<any>>);
};
