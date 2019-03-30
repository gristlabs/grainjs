/**
 * binding.ts offers a convenient subscribe() function that creates a binding to an observable, a
 * a plain value, or a function from which it builds a computed.
 */

import {autoDisposeElem} from './_domDispose';
import {computed} from './computed';
import {IDisposable} from './dispose';
import {IKnockoutReadObservable} from './kowrap';
import {Observable} from './observable';
import {UseCBOwner} from './subscribe';

export type BindableValue<T> = Observable<T> | ComputedCallback<T> | T | IKnockoutReadObservable<T>;

export type ComputedCallback<T> = (use: UseCBOwner, ...args: any[]) => T;

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
export function subscribeBindable<T>(valueObs: BindableValue<T>,
                                     callback: (newVal: T, oldVal?: T) => void): IDisposable|null {
  // A plain function (to make a computed from), or a knockout observable.
  if (typeof valueObs === 'function') {
    // Knockout observable.
    const koValue = valueObs as IKnockoutReadObservable<T>;
    if (typeof koValue.peek === 'function') {
      let savedValue = koValue.peek();
      const sub = koValue.subscribe((val: T) => {
        const old = savedValue;
        savedValue = val;
        callback(val, old);
      });
      callback(savedValue, undefined);
      return sub;
    }

    // Function from which to make a computed. Note that this is also reasonable:
    //    let sub = subscribe(use => callback(valueObs(use)));
    // The difference is that when valueObs() evaluates to unchanged value, callback would be
    // called in the version above, but not in the version below.
    const comp = computed(valueObs as ComputedCallback<T>);
    comp.addListener(callback);
    callback(comp.get(), undefined);
    return comp;      // Disposing this will dispose its one listener.
  }

  // An observable.
  if (valueObs instanceof Observable) {
    const sub = valueObs.addListener(callback);
    callback(valueObs.get(), undefined);
    return sub;
  }

  callback(valueObs, undefined);
  return null;
}

/**
 * Subscribes a callback to valueObs (which may be a value, observable, or function) using
 * subscribe(), and disposes the subscription with the passed-in element.
 */
export function subscribeElem<T>(elem: Node, valueObs: BindableValue<T>,
                                 callback: (newVal: T, oldVal?: T) => void): void {
  autoDisposeElem(elem, subscribeBindable(valueObs, callback));
}
