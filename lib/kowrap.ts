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
 * and subscriptions and disposal are appropriately set up to make usage seamless. In particular,
 * the returned wrapper should not be disposed; it's tied to the lifetime of the wrapped object.
 */

import {BaseObservable, bundleChanges, Observable} from './observable';

// Implementation note. Both wrappers are implemented in the same way.
//
// Regarding disposal: the wrapper is always subscribed to the underlying observable. The
// underlying has a reference to the wrapper. So does any listener to the wrapper. The wrapper can
// be garbage-collected once it has no listeners AND the underlying observable is disposed or
// unreferenced.

export interface IKnockoutObservable<T> extends IKnockoutReadObservable<T> {
  (val: T): void;
}

export interface IKnockoutReadObservable<T> {
  (): T;
  peek(): T;
  subscribe(callback: (newValue: T) => void, target?: any, event?: "change"): any;
  getSubscriptionsCount(): number;
}

const fromKoWrappers: WeakMap<IKnockoutObservable<any>, BaseObservable<any>> = new WeakMap();
const toKoWrappers: WeakMap<Observable<any>, IKnockoutObservable<any>> = new WeakMap();

/**
 * Returns a Grain.js observable which mirrors a Knockout observable.
 *
 * Do not dispose this wrapper, as it is shared by all code using koObs, and its lifetime is tied
 * to the lifetime of koObs. If unused, it consumes minimal resources, and should get garbage
 * collected along with koObs.
 */
export function fromKo<T>(koObs: IKnockoutObservable<T>): BaseObservable<T> {
  return fromKoWrappers.get(koObs) || fromKoWrappers.set(koObs, new KoWrapObs(koObs)).get(koObs)!;
}

/**
 * An Observable that wraps a Knockout observable, created via fromKo(). It keeps minimal overhead
 * when unused by only subscribing to the wrapped observable while it itself has subscriptions.
 *
 * This way, when unused, the only reference is from the wrapper to the wrapped object. KoWrapObs
 * should not be disposed; its lifetime is tied to that of the wrapped object.
 */
export class KoWrapObs<T> extends BaseObservable<T> {
  private _koSub: any = null;

  constructor(private _koObs: IKnockoutObservable<T>) {
    super(_koObs.peek());
    this.setListenerChangeCB((hasListeners) => {
      if (!hasListeners) {
        this._koSub.dispose();
        this._koSub = null;
      } else if (!this._koSub) {
        // TODO this is a little hack, really, BaseObservable should expose a way to set the value
        // directly by derived classes, i.e. a protected setter.
        (this as any)._value = this._koObs.peek();
        this._koSub = this._koObs.subscribe((val) => this.setAndTrigger(val));
      }
    });
  }
  public get(): T { return this._koObs.peek(); }
  public set(value: T): void { bundleChanges(() => this._koObs(value)); }
  public dispose(): void { throw new Error("KoWrapObs should not be disposed"); }
}

export interface IKnockoutModule {
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
