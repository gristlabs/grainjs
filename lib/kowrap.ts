/**
 * Grain.js observables and computeds are similar to (and mostly inspired by) those in
 * Knockout.js. In fact, they can work together.
 *
 *  import {fromKo} from 'kowrap'
 *
 *  fromKo(koObservable)
 *
 * returns a Grain.js observable that mirrors the passed-in Knockout observable (which may be a
 * computed as well). Similarly,
 *
 *  import {toKo} from 'kowrap';
 *  import * as ko from 'knockout';
 *
 *  toKo(ko, observable)
 *
 * returns a Knockout.js observable that mirrows the passed-in Grain observable or computed. Note
 * that toKo() mus tbe called with the knockout module as an argument. This is to avoid adding
 * knockout as a dependency of grainjs.
 *
 * In both cases, calling fromKo/toKo twice on the same observable will return the same wrapper,
 * and subscriptions and disposal are appropriately set up to make usage seamless.
 */

import {observable, Observable} from './observable';

// Implementation note. Both wrappers are implemented in the same way.
//
// Regarding disposal: the wrapper is always subscribed to the underlying observable. The
// underlying has a reference to the wrapper. So does any listener to the wrapper. The wrapper can
// be garbage-collected once it has no listeners AND the underlying observable is disposed or
// unreferenced.

interface IKnockoutObservable<T> {
  (val: T): void;
  peek(): T;
  subscribe(callback: (newValue: T) => void, target?: any, event?: "change"): any;
}

const fromKoWrappers: WeakMap<IKnockoutObservable<any>, Observable<any>> = new WeakMap();
const toKoWrappers: WeakMap<Observable<any>, IKnockoutObservable<any>> = new WeakMap();

/**
 * Returns a Grain.js observable which mirrors a Knockout observable.
 */
export function fromKo<T>(koObservable: IKnockoutObservable<T>): Observable<T> {
  const prevObs = fromKoWrappers.get(koObservable);
  if (prevObs) {
    return prevObs;
  }
  const newObs = observable(koObservable.peek());
  fromKoWrappers.set(koObservable, newObs);
  koObservable.subscribe((val) => newObs.set(val));
  return newObs;
}

interface IKnockoutModule {
  observable<T>(value: T): IKnockoutObservable<T>;
}

/**
 * Returns a Knockout observable which mirrors a Grain.js observable.
 */
export function toKo<T>(knockout: IKnockoutModule, grainObs: Observable<T>): IKnockoutObservable<T> {
  const prevKoObs = toKoWrappers.get(grainObs);
  if (prevKoObs) {
    return prevKoObs;
  }
  const newKoObs = knockout.observable(grainObs.get());
  toKoWrappers.set(grainObs, newKoObs);
  grainObs.addListener((val) => newKoObs(val));
  return newKoObs;
}
