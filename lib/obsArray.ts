/**
 * ObsArray extends a plain Observable to allow for more efficient observation of array changes.
 *
 * As for any array-valued Observable, when the contents of the observed array changes, the
 * listeners get called with new and previous values which are the same array. For simple changes,
 * such as those made with .push() and .splice() methods, ObsArray allows for more efficient
 * handling of the change by calling listeners with splice info in the third argument.
 *
 * This module also provides computedArray(), which allows mapping each item of an ObsArray
 * through a function, passing through splice info for efficient handling of small changes. It
 * also allows mapping an observable or a computed whose value is an ObsArray.
 *
 * There is no need or benefit in using computedArray() if you have a computed() that returns a
 * plain array. It is specifically for the case when you want to preserve the efficiency of
 * ObsArray when you map its values.
 */

// tslint:disable:no-shadowed-variable

import {IDisposableOwner, setDisposeOwner} from './dispose';
import {Listener} from './emit';
import {Observable} from './observable';
import {subscribe, Subscription} from './subscribe';

/**
 * Info about a modification to ObsArray contents. It is included as a third argument to change
 * listeners when available. When not available, listeners should assume that the array changed
 * completely.
 */
export interface IObsArraySplice<T> {
  start: number;
  numAdded: number;
  deleted: T[];
}

export type ISpliceListener<T, C>  = (this: C, val: T[], prev: T[], change?: IObsArraySplice<T>) => void;

/**
 * ObsArray<T> is nothing more than an array-valued observable. This class only specifies more
 * precisely the types of some methods.
 */
export class ObsArray<T> extends Observable<T[]> {
  public addListener(callback: ISpliceListener<T, void>): Listener;
  public addListener<C>(callback: ISpliceListener<T, C>, context: C): Listener;
  public addListener(callback: ISpliceListener<T, any>, optContext?: any): Listener {
    return super.addListener(callback, optContext);
  }

  protected _setWithArg(value: T[], splice: IObsArraySplice<T>): void {
    return super._setWithArg(value, splice);
  }
}

/**
 * MutableObsArray<T> adds array-like mutation methods which emit events with splice info, to
 * allow more efficient processing of such changes. It is created with obsArray<T>().
 */
export class MutableObsArray<T> extends ObsArray<T> {
  public push(...args: T[]): number {
    const value = this.get();
    const start = value.length;
    const newLen = value.push(...args);
    this._setWithArg(value, {start, numAdded: args.length, deleted: []});
    return newLen;
  }

  public pop(): T|undefined {
    const value = this.get();
    if (value.length === 0) { return undefined; }
    const ret = value.pop()!;
    this._setWithArg(value, {start: value.length, numAdded: 0, deleted: [ret]});
    return ret;
  }

  public unshift(...args: T[]) {
    const value = this.get();
    const newLen = value.unshift(...args);
    this._setWithArg(value, {start: 0, numAdded: args.length, deleted: []});
    return newLen;
  }

  public shift(): T|undefined {
    const value = this.get();
    if (value.length === 0) { return undefined; }
    const ret = value.shift()!;
    this._setWithArg(value, {start: 0, numAdded: 0, deleted: [ret]});
    return ret;
  }

  public splice(start: number, deleteCount: number = Infinity, ...newValues: T[]) {
    const value = this.get();
    const len = value.length;
    start = Math.min(len, Math.max(0, start < 0 ? len + start : start));
    const deleted = value.splice(start, deleteCount, ...newValues);
    this._setWithArg(value, {start, numAdded: newValues.length, deleted});
    return deleted;
  }
}

/**
 * Creates a new MutableObsArray with an optional initial value, defaulting to the empty array.
 * It is essentially the same as observable<T[]>, but with array-like mutation methods.
 */
export function obsArray<T>(value: T[] = []): MutableObsArray<T> {
  return new MutableObsArray<T>(value);
}

/**
 * Returns true if val is an array-valued observable.
 */
function isObsArray(val: Observable<any>): val is Observable<any[]> {
  return Array.isArray(val.get());
}

/**
 * See computedArray() below for documentation.
 */
export class ComputedArray<T, U> extends ObsArray<U> {
  private _sub: Subscription;
  private _source?: Observable<T[]>;
  private _listener?: Listener;
  private _lastSplice?: IObsArraySplice<T>|false;     // false is a marker that full rebuild is needed

  constructor(obsArray: Observable<T[]> | Observable<Observable<T[]>>, private _mapper: (item: T) => U) {
    super([]);
    this._sub = isObsArray(obsArray) ?
      subscribe(obsArray, (use) => this._syncMap(obsArray)) :
      subscribe(obsArray, (use, obsArrayValue) => { use(obsArrayValue); return this._syncMap(obsArrayValue); });
  }

  public dispose() {
    this._unsync();
    this._sub.dispose();
    super.dispose();
  }

  private _syncMap(obsArray: Observable<T[]>): void {
    if (this._source !== obsArray) {
      this._unsync();
      this._listener = obsArray.addListener(this._recordChange, this);
      this._source = obsArray;
      this._rebuild(obsArray);
    } else if (this._lastSplice) {
      // If we are syncing to the same array as before and recorded a single splice, apply it now.
      this._applySplice(obsArray, this._lastSplice);
    } else {
      // If the full array changed or we had multiple splices, give up and rebuild.
      this._rebuild(obsArray);
    }
    this._lastSplice = undefined;
  }

  private _unsync() {
    if (this._listener) {
      this._listener.dispose();
      this._listener = undefined;
      this._source = undefined;
    }
  }

  private _rebuild(obsArray: Observable<T[]>) {
    const oldItems: U[] = this.get();
    const newItems: U[] = obsArray.get().map((item: T) => this._mapper.call(undefined, item));
    this._setWithArg(newItems, {start: 0, numAdded: newItems.length, deleted: oldItems});
  }

  private _applySplice(obsArray: Observable<T[]>, change: IObsArraySplice<T>) {
    const sourceArray: T[] = obsArray.get();
    const newItems: U[] = [];
    for (let i = change.start, n = 0; n < change.numAdded; i++, n++) {
      newItems.push(this._mapper.call(undefined, sourceArray[i]));
    }
    const items: U[] = this.get();
    const deleted = items.splice(change.start, change.deleted.length, ...newItems);
    this._setWithArg(items, {start: change.start, numAdded: newItems.length, deleted});
  }

  private _recordChange(newItems: T[], oldItems: T[], change?: IObsArraySplice<T>): void {
    // We don't attempt to handle efficiency multiple splices (it's quite hard in general, and
    // even harder to know that it's more efficient than rebuilding), so if _lastSplice is set, we
    // set it to a marker to mark the array for rebuilding.
    if (change && this._lastSplice === undefined) {
      this._lastSplice = change;
    } else {
      this._lastSplice = false;     // This is a marker that a full rebuild is needed.
    }
  }
}

/**
 * Returns an ObsArray that maps all elements of the passed-in ObsArray through a mapper function.
 * Also accepts an observable (e.g. a computed) whose value is an ObsArray. Usage:
 *
 *    computedArray(obsArray, mapper)
 *
 * The result is entirely analogous to:
 *
 *     computed((use) => use(obsArray).map(mapper))       // for ObsArray
 *     computed((use) => use(use(obsArray)).map(mapper))  // for Observable<ObsArray>
 *
 * The benefit of computedArray() is that a small change to the source array (e.g. one item
 * added or removed), causes a small change to the mapped array, rather than a full rebuild.
 *
 * This is intended for use with an ObsArray or with an observable whose value is an ObsArray, but
 * for consistency of interface, it may also be used with a plain array-valued observable.
 */
export function computedArray<T, U>(obsArray: Observable<T[]> | Observable<Observable<T[]>>,
                                    mapper: (item: T) => U): ObsArray<U> {
  return new ComputedArray<T, U>(obsArray, mapper);
}

/**
 * Returns a new observable representing an index into this array. It can be read and written, and
 * its value is clamped to be a valid index. The index is only null if the array is empty.
 *
 * As the array changes, the index is adjusted to continue pointing to the same element. If the
 * pointed element is deleted, the index is adjusted to after the deletion point.
 *
 * The returned observable has an additional .setLive(bool) method. While set to false, the
 * observable will not be adjusted as the array changes, except to keep it valid.
 */
export function makeLiveIndex<T>(owner: IDisposableOwner|null, obsArray: ObsArray<T>,
                                 initialIndex: number = 0): LiveIndex {
  return setDisposeOwner(owner, new LiveIndex(obsArray, initialIndex));
}

export class LiveIndex extends Observable<number|null> {
  private _listener: Listener;
  private _isLive: boolean = true;

  constructor(private _obsArray: ObsArray<any>, initialIndex: number = 0) {
    super(null);
    this.set(initialIndex);
    this._listener = _obsArray.addListener(this._onArrayChange, this);
  }

  public set(index: number|null) {
    // Clamp to [0, len) range of the observable array.
    const len = this._obsArray.get().length;
    super.set(len === 0 ? null : Math.max(0, Math.min(len - 1, index || 0)));
  }

  // Note that this feature comes from a rather obscure need, and it would be better if something
  // similar were possible without making it an explicit feature.
  public setLive(value: boolean): void {
    this._isLive = value;
  }

  public dispose() {
    this._listener.dispose();
    super.dispose();
  }

  private _onArrayChange<T>(newItems: T[], oldItems: T[], change?: IObsArraySplice<T>) {
    const idx = this.get();
    this.set(
      idx === null || !change ? 0 :
      // Adjust the index if it was beyond the deleted region.
      this._isLive && idx >= change.start + change.deleted.length ? idx + change.numAdded - change.deleted.length :
      // Adjust the index if it was inside the deleted region (and not replaced).
      this._isLive && idx >= change.start + change.numAdded ? change.start + change.numAdded :
      idx);
  }
}

// TODO
// Implement reuse of mapped items, as well as DOM nodes in case of dom.forEach, when an array
//   change involves reuse of existing items. Tricky when items are not unique. It is rare and
//   perhaps usually irrelevant, but should be handled reasonably.

// DISPOSAL
// 1. For any observable<D> where D is disposable, using .set(D.create(...)) should allow disposing
//    the referenced value when .set() is called again or when the observable is disposed.
// 2. Specifically, for computed<D>(use => D.create(...)) it is important to support disposal. This
//    exists in Grist as computedAutoDispose() and the hard-to-use computedBuilder().
// 3. For observable<D[]> and obsArray<D>, the items are what (MAY) need to be disposed whenever the
//    array is reassigned, or some items are removed, or the observable is disposed. In Grist, it
//    exists as .setAutoDispose() method on koArray.
// 4. Specifically for computedArray(arr, item => D.create(...)), it is vital to support disposal.
//
// Given the ownership semantics (D.create(owner, args)), we could express everything above
// elegantly with:
// 1. obs.set(D.create(obs, ...)), i.e. allow using Observable as owner.
//    Actually this IS awkward, because it's possible to use just `D.create(obs, ...)` and it's
//    not clear what it means if obs.set() isn't called with it.
// 2. computed<D>(use => D.create(use, ...)), i.e. allow using `use` function as owner. I don't
//    think it would work to use the computed itself since the callback gets called immeduately
//    before the assignment happens.
// 3. obs.set(arr.map(item => D.create(obs, item))), i.e. use Observable as owner of array items.
//    This is perhaps overly specific. Can instead offer DisposableArray<T> which has a .dispose()
//    method that disposes all items, and use Observable<DisposableArray<T>> instead of
//    Observable<T[]>.
// 4. computedArray(arr, (item, i, obsArray) => D.create(obsArraay, ...)), i.e. pass the ObsArray
//    to mapper and allow using it as owner of array items. Warn in usage that i is not stable.
