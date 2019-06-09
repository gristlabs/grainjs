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

import {domDisposeHooks} from './domDispose';
import {bundleChanges, Observable} from './observable';

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

// Inference from Knockout observable gets very tricky because ko.Observable includes the function
// signature `(val: T) => any` from which type `any` gets inferred. We can infer the correct type
// with this helper.
export type InferKoType<KObs extends IKnockoutReadObservable<any>> =
  KObs extends {peek(): infer T} ? T : never;

const fromKoWrappers: WeakMap<IKnockoutObservable<any>, Observable<any>> = new WeakMap();
const toKoWrappers: WeakMap<Observable<any>, IKnockoutObservable<any>> = new WeakMap();

/**
 * Returns a Grain.js observable which mirrors a Knockout observable.
 *
 * Do not dispose this wrapper, as it is shared by all code using koObs, and its lifetime is tied
 * to the lifetime of koObs. If unused, it consumes minimal resources, and should get garbage
 * collected along with koObs.
 */
export function fromKo<KObs extends IKnockoutObservable<any>>(koObs: KObs): Observable<InferKoType<KObs>> {
  return fromKoWrappers.get(koObs) || fromKoWrappers.set(koObs, new KoWrapObs(koObs)).get(koObs)!;
}

/**
 * An Observable that wraps a Knockout observable, created via fromKo(). It keeps minimal overhead
 * when unused by only subscribing to the wrapped observable while it itself has subscriptions.
 *
 * This way, when unused, the only reference is from the wrapper to the wrapped object. KoWrapObs
 * should not be disposed; its lifetime is tied to that of the wrapped object.
 */
export class KoWrapObs<T> extends Observable<T> {
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
  cleanNode(node: Node): void;
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

// Marker for when knockout-disposal integration has already been setup.
let koDisposalIsSetup = false;

/**
 * Set up integration between grainjs and knockout disposal. Knockout does cleanup using
 * ko.removeNode / ko.cleanNode (it also takes care of JQuery cleanup if needed). GrainJS does
 * cleanup using dom.domDispose(). By default these don't know about each other.
 *
 * If you mix the two libraries, however, disposing an element may need to trigger disposers
 * registered by either library.
 *
 * This method ensures that this happens.
 *
 * Note: grainjs disposes text nodes too, but nothing relies on it. When disposal is triggered via
 * knockout, we are forced to rely on knockout's node traversal which ignores text nodes.
 */
export function setupKoDisposal(ko: IKnockoutModule) {
  // Ensure we don't do the setup more than once, or things will get called multiple times.
  if (koDisposalIsSetup) { return; }
  koDisposalIsSetup = true;

  const koDomNodeDisposal = (ko as any).utils.domNodeDisposal;

  // Knockout by default has an external-data-cleanup func set to cleanup JQuery. Whatever it is
  // set to, we will continue calling it, and also will call grainjs domDisposeNode.
  const origKoCleanExternalData = koDomNodeDisposal.cleanExternalData;

  // The original function called by grainjs to clean nodes recursively. We'll override it.
  const origGrainDisposeRecursive = domDisposeHooks.disposeRecursive;

  // New function called by knockout to do extra cleanup. Now calls grainjs single-node cleanup.
  // (In knockout, we can only override single-node cleanup.)
  function newKoCleanExternalData(node: Node) {
    origKoCleanExternalData(node);
    domDisposeHooks.disposeNode(node);
  }

  // Function called by grainjs to clean nodes recursively. We override the recursive cleanup
  // function to call the recursive knockout cleanup (letting knockout do the dom traversal it
  // normally does).
  function newGrainDisposeRecursive(node: Node) {
    origGrainDisposeRecursive(node);

    // While doing knockout cleanup, do NOT have it call grainjs cleanup too, as that would cause
    // multiple unnecessary traversals of DOM.
    koDomNodeDisposal.cleanExternalData = origKoCleanExternalData;
    try {
      ko.cleanNode(node);
    } finally {
      koDomNodeDisposal.cleanExternalData = newKoCleanExternalData;
    }
  }

  // Use knockout and grainjs hooks to actually set the new cleanup functions.
  koDomNodeDisposal.cleanExternalData = newKoCleanExternalData;
  domDisposeHooks.disposeRecursive = newGrainDisposeRecursive;
}
