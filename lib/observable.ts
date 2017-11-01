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

import {compute, DepItem} from './_computed_queue';
import {Emitter, Listener} from './emit';

export {bundleChanges} from './_computed_queue';


export class Observable<T> {
  private _onChange: Emitter;
  private _value: T;

  /**
   * Internal constructor for an Observable. You should use observable() function instead.
   */
  constructor(value: T) {
    this._onChange = new Emitter();
    this._value = value;
  }

  /**
   * Returns the value of the observable. It is fast and does not create a subscription.
   * (It is similar to knockout's peek()).
   * @returns {Object} The current value of the observable.
   */
  public get(): T { return this._value; }

  /**
   * Sets the value of the observable. If the value differs from the previously set one, then
   * listeners to this observable will get called with (newValue, oldValue) as arguments.
   * @param {Object} value: The new value to set.
   */
  public set(value: T): void {
    const prev = this._value;
    if (value !== prev) {
      this._value = value;
      this._onChange.emit(value, prev);
      compute();
    }
  }

  /**
   * Adds a callback to listen to changes in the observable.
   * @param {Function} callback: Function, called on changes with (newValue, oldValue) arguments.
   * @param {Object} optContext: Context for the function.
   * @returns {Listener} Listener object. Its dispose() method removes the callback.
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
   * @param {Function} changeCB(hasListeners): Function to call after a listener is added or
   *    removed. It's called with a boolean indicating whether this observable has any listeners.
   *    Pass in `null` to unset the callback.
   */
  public setListenerChangeCB(changeCB: (hasListeners: boolean) => void): void {
    this._onChange.setChangeCB(changeCB);
  }

  /**
   * Used by subscriptions to keep track of dependencies. An observable that has dependnecies,
   * such as a computed observable, would override this method.
   */
  public _getDepItem(): DepItem|null {
    return null;
  }

  /**
   * Disposes the observable.
   */
  public dispose(): void {
    this._onChange.dispose();
    (this._value as any) = undefined;
  }

  /**
   * Returns whether this observable is disposed.
   */
  public isDisposed(): boolean {
    return this._onChange.isDisposed();
  }
}


/**
 * Creates a new Observable with the initial value of optValue if given or undefined if omitted.
 * @param {Object} optValue: The initial value to set.
 * @returns {Observable} The newly created observable.
 */
export default function observable<T>(value: T): Observable<T> {
  return new Observable<T>(value);
}
