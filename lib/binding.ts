/**
 * binding.ts offers a convenient subscribe() function that creates a binding to an observable, a
 * a plain value, or a function from which it builds a computed.
 */

import {IDisposable} from './dispose';
import {autoDisposeElem} from './domDispose';
import {IKnockoutReadObservable, InferKoType} from './kowrap';
import {BaseObservable} from './observable';
import {subscribe, UseCB} from './subscribe';

/**
 * Any of the value types that DOM methods know how to subscribe to: a plain value (like a
 * string); an Observable (including a Computed); a knockout observable; a function.
 *
 * If a function, it's used to create a `Computed`, and will be called with a context function
 * `use`, allowing it to depend on other observable values (see documentation for `Computed`).
 */
export type BindableValue<T> = BaseObservable<T> | ComputedCallback<T> | T | IKnockoutReadObservable<T>;

export type ComputedCallback<T> = (use: UseCB, ...args: any[]) => T;

/**
 * Subscribes a callback to valueObs, which may be one a plain value, an observable, a knockout
 * observable, or a function. If a function, it's used to create a computed() and will be called
 * with a context function `use`, allowing it to depend on other observable values (see
 * documentation for `computed`).
 *
 * In all cases, `callback(newValue, oldValue)` is called immediately and whenever the value
 * changes. On the initial call, oldValue is undefined.
 *
 * Returns an object which should be disposed to remove the created subscriptions, or null.
 */
// The overload below is annoying, but needed for correct type inference; see test/types/kowrap.ts.
export function subscribeBindable<KObs extends IKnockoutReadObservable<any>>(
    valueObs: KObs, callback: (val: InferKoType<KObs>) => void): IDisposable|null;
export function subscribeBindable<T>(
    valueObs: BindableValue<T>, callback: (val: T) => void): IDisposable|null;
export function subscribeBindable<T>(
    valueObs: BindableValue<T>, callback: (val: T) => void): IDisposable|null {
  // A plain function (to make a computed from), or a knockout observable.
  if (typeof valueObs === 'function') {
    // Knockout observable.
    const koValue = valueObs as IKnockoutReadObservable<T>;
    if (typeof koValue.peek === 'function') {
      const sub = koValue.subscribe((val) => callback(val));
      callback(koValue.peek());
      return sub;
    }

    // Function from which to make a computed. This is similar to creating a computed and
    // subscribing to it, but with a single subsciption. This difference from this naive approach:
    //    let sub = subscribe(use => callback(valueObs(use)));
    // is that when valueObs() evaluates to unchanged value, we don't want the callback called, to
    // match behavior of regular computeds.
    const cb = valueObs as ComputedCallback<T>;
    let _lastValue: unknown = undefined;
    return subscribe(use => {
      const value = cb(use);
      if (value !== _lastValue) {
        _lastValue = value;
        callback(value);
      }
    });
  }

  // An observable.
  if (valueObs instanceof BaseObservable) {
    // Use subscribe() rather than addListener(), so that bundling of changes (implicit and with
    // bundleChanges()) is respected. This matters when callback also uses observables.
    return subscribe(valueObs, (use, val) => callback(val));
  }

  callback(valueObs);
  return null;
}

/**
 * Subscribes a callback to `valueObs` (which may be a value, observable, or function) using
 * `subscribeBindable()`, and ties the disposal of this subscription to the passed-in element.
 */
export function subscribeElem<T>(elem: Node, valueObs: BindableValue<T>,
                                 callback: (newVal: T, oldVal?: T) => void): void {
  autoDisposeElem(elem, subscribeBindable(valueObs, callback));
}
