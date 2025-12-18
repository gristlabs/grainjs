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

import {compute, DepItem} from './_computed_queue';
import {IDisposable, IDisposableOwnerT, setDisposeOwner} from './dispose';
import {Emitter, Listener} from './emit';

export {bundleChanges} from './_computed_queue';

/**
 * Base class for several variants of observable values.
 */
export class BaseObservable<T> {
  private _onChange: Emitter;
  private _value: T;

  // Internal constructor for an Observable. You should use observable() function instead.
  constructor(value: T) {
    this._onChange = new Emitter();
    this._value = value;
  }

  /**
   * Returns the value of the observable. It is fast and does not create a subscription.
   * (It is similar to knockout's peek()).
   * @returns The current value of the observable.
   */
  public get(): T { return this._value; }

  /**
   * Sets the value of the observable. If the value differs from the previously set one, then
   * listeners to this observable will get called with (newValue, oldValue) as arguments.
   * @param value - The new value to set.
   */
  public set(value: T): void {
    if (value !== this._value) {
      this.setAndTrigger(value);
    }
  }

  /**
   * Sets the value of the observable AND calls listeners even if the value is unchanged.
   */
  public setAndTrigger(value: T) {
    const prev = this._value;
    this._value = value;
    this._onChange.emit(value, prev);
    this._disposeOwned();
    compute();
  }

  /**
   * Adds a callback to listen to changes in the observable.
   * @param callback - Function, called on changes with (newValue, oldValue) arguments.
   * @param optContext - Context for the function.
   * @returns Listener object. Its dispose() method removes the callback.
   */
  public addListener(callback: (val: T, prev: T) => void, optContext?: object): Listener {
    return this._onChange.addListener(callback, optContext);
  }

  /**
   * Returns whether this observable has any listeners.
   */
  public hasListeners(): boolean {
    return this._onChange.hasListeners();
  }

  /**
   * Sets a single callback to be called when a listener is added or removed. It overwrites any
   * previously-set such callback.
   * @param changeCB - Function to call after a listener is added or
   *    removed. It's called with a boolean indicating whether this observable has any listeners.
   *    Pass in `null` to unset the callback. Note that it can be called multiple times in a row
   *    with hasListeners `true`.
   */
  public setListenerChangeCB(changeCB: (hasListeners: boolean) => void, optContext?: any): void {
    this._onChange.setChangeCB(changeCB, optContext);
  }

  /**
   * Used by subscriptions to keep track of dependencies. An observable that has dependnecies,
   * such as a computed observable, would override this method.
   * @internal
   */
  public _getDepItem(): DepItem|null {
    return null;
  }

  /**
   * Disposes the observable.
   */
  public dispose(): void {
    this._disposeOwned();
    this._onChange.dispose();
    (this._value as any) = undefined;
  }

  /**
   * Returns whether this observable is disposed.
   */
  public isDisposed(): boolean {
    return this._onChange.isDisposed();
  }

  /** @internal */
  protected _disposeOwned(arg?: any) { /* noop */ }

  /**
   * Allow derived classes to emit change events with an additional third argument describing the
   * change. It always emits the event without checking for value equality.
   * @internal
   */
  protected _setWithArg(value: T, arg: any) {
    const prev = this._value;
    this._value = value;
    this._onChange.emit(value, prev, arg);
    this._disposeOwned(arg);
    compute();
  }
}

/**
 * An Observable holds a value and allows subscribing to changes.
 */
export class Observable<T> extends BaseObservable<T> implements IDisposableOwnerT<T & IDisposable> {
  /** @internal */
  // See module-level holder() function below for documentation.
  public static holder<T>(value: T & IDisposable): Observable<T> {
    const obs = new Observable<T>(value);
    obs._owned = value;
    return obs;
  }

  /**
   * Creates a new Observable with the given initial value, and owned by owner.
   */
  public static create<T>(owner: IDisposableOwnerT<Observable<T>>|null, value: T): Observable<T> {
    return setDisposeOwner(owner, new Observable<T>(value));
  }

  private _owned?: T & IDisposable = undefined;

  /**
   * The use an observable for a disposable object, use it a DisposableOwner:
   *
   *    D.create(obs, ...args)                      // Preferred
   *    obs.autoDispose(D.create(null, ...args))    // Equivalent
   *
   * Either of these usages will set the observable to the newly created value. The observable
   * will dispose the owned value when it's set to another value, or when it itself is disposed.
   */
  public autoDispose(value: T & IDisposable): T & IDisposable {
    this.setAndTrigger(value);
    this._owned = value;
    return value;
  }

  /** @internal */
  protected _disposeOwned() {
    if (this._owned) {
      this._owned.dispose();
      this._owned = undefined;
    }
  }
}

/**
 * Creates a new Observable with the initial value of optValue if given or undefined if omitted.
 * @param optValue - The initial value to set.
 * @returns The newly created observable.
 */
export function observable<T>(value: T): Observable<T> {
  return new Observable<T>(value);
}

/**
 * Creates a new Observable with an initial disposable value owned by this observable, e.g.
 * ```
 *    const obs = obsHolder<D>(D.create(null, ...args));
 * ```
 *
 * This is needed because using simply `observable<D>(value)` would not cause the observable to take
 * ownership of value (i.e. to dispose it later). This function is a less hacky equivalent to:
 * ```
 *    const obs = observable<D>(null as any);
 *    D.create(obs, ...args);
 * ```
 *
 * To allow nulls, use `observable<D|null>(null)`; then the obsHolder() constructor is not needed.
 */
export function obsHolder<T>(value: T & IDisposable): Observable<T> {
  return Observable.holder<T>(value);
}
