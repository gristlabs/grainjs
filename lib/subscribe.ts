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

export interface ISubscribable {
  _getDepItem(): DepItem|null;
  addListener(callback: (val: any, prev: any) => void, optContext?: object): Listener;
  get(): any;
}

// The generic type for the use() function that callbacks get.
export type UseCB = <T>(obs: Observable<T>) => T;

interface IListenerWithInUse extends Listener {
  _inUse: boolean;
}

// Constant empty array, which we use to avoid allocating new read-only empty arrays.
const emptyArray: ReadonlyArray<any> = [];

export class Subscription {
  private readonly _depItem: DepItem;
  private readonly _dependencies: ReadonlyArray<ISubscribable>;
  private readonly _depListeners: ReadonlyArray<Listener>;
  private _dynDeps: Map<ISubscribable, IListenerWithInUse>;
  private _callback: (use: UseCB, ...args: any[]) => void;
  private _useFunc: (obs: ISubscribable) => any;

  /**
   * Internal constructor for a Subscription. You should use subscribe() function instead.
   */
  constructor(callback: (use: UseCB, ...args: any[]) => void, dependencies: ISubscribable[]) {
    this._depItem = new DepItem(this._evaluate, this);
    this._dependencies = dependencies.length > 0 ? dependencies : emptyArray;
    this._depListeners = dependencies.length > 0 ? dependencies.map((obs) => this._subscribeTo(obs)) : emptyArray;
    this._dynDeps = new Map();   // Maps dependent observable to its Listener object.
    this._callback = callback;
    this._useFunc = this._useDependency.bind(this);

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
   * For use by computed(): returns this subscription's hook into the _computed_queue.
   */
  public _getDepItem(): DepItem { return this._depItem; }

  /**
   * @private
   * Gets called when the callback calls `use(obs)` for an observable. It creates a
   * subscription to `obs` if one doesn't yet exist.
   * @param {Observable} obs: The observable being used as a dependency.
   */
  private _useDependency(obs: ISubscribable) {
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
      // Note that this is faster than using .map().
      const readArgs = [this._useFunc];
      for (let i = 0, len = this._dependencies.length; i < len; i++) {
        readArgs[i + 1] = this._dependencies[i].get();
        this._depItem.useDep(this._dependencies[i]._getDepItem());
      }
      return this._callback.apply(undefined, readArgs);

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
  private _subscribeTo(obs: ISubscribable) {
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

type Obs<T> = Observable<T>;

/**
 * This is the type-checking interface for subscribe(), which allows TypeScript to do helpful
 * type-checking when using it. We can only support a fixed number of argumnets (explicit
 * dependencies), but 5 should almost always be enough.
 */
interface ISubscribe {
  (cb: (use: UseCB) => void): Subscription;

  <A>(
    a: Obs<A>,
    cb: (use: UseCB, a: A) => void): Subscription;

  <A, B>(
    a: Obs<A>, b: Obs<B>,
    cb: (use: UseCB, a: A, b: B) => void): Subscription;

  <A, B, C>(
    a: Obs<A>, b: Obs<B>, c: Obs<C>,
    cb: (use: UseCB, a: A, b: B, c: C) => void): Subscription;

  <A, B, C, D>(
    a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>,
    cb: (use: UseCB, a: A, b: B, c: C, d: D) => void): Subscription;

  <A, B, C, D, E>(
    a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>, e: Obs<E>,
    cb: (use: UseCB, a: A, b: B, c: C, d: D, e: E) => void): Subscription;
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
export const subscribe: ISubscribe = function(...args: any[]): Subscription {
  const cb = args.pop();
  // The cast helps ensure that Observable is compatible with ISubscribable abstraction that we use.
  return new Subscription(cb, args as Array<Observable<any>>);
};
