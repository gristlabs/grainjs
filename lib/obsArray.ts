import {IDisposable, IDisposableOwnerT, setDisposeOwner} from './dispose';
import {Listener} from './emit';
import {BaseObservable, Observable} from './observable';
import {subscribe, Subscription} from './subscribe';

/**
 * Either an observable or a plain array of T. This is useful for functions like dom.forEach()
 * which are convenient to have available for both.
 */
export type MaybeObsArray<T> = BaseObservable<T[]> | T[];

/**
 * Info about a modification to ObsArray contents. It is included as a third argument to change
 * listeners when available. When not available, listeners should assume that the array changed
 * completely.
 */
export interface IObsArraySplice<T> {
  start: number;        /** asdf */
  numAdded: number;
  deleted: T[];
}

export type ISpliceListener<T, C>  = (this: C, val: T[], prev: T[], change?: IObsArraySplice<T>) => void;

/**
 * `ObsArray<T>` is essentially an array-valued observable. It extends a plain Observable to allow
 * for more efficient observation of array changes. It also may be
 * used as an owner for disposable array elements.
 *
 * As for any array-valued `Observable`, when the contents of the observed array changes, the
 * listeners get called with new and previous values which are the same array. For simple changes,
 * such as those made with `.push()` and `.splice()` methods, `ObsArray` allows for more efficient
 * handling of the change by calling listeners with splice info in the third argument.
 *
 * `ObsArray` may be used with disposable elements as their owner. E.g.
 * ```ts
 * const arr = obsArray<D>();
 * arr.push(D.create(arr, "x"), D.create(arr, "y"));
 * arr.pop();      // Element "y" gets disposed.
 * arr.dispose();  // Element "x" gets disposed.
 * ```
 *
 * Note that only the pattern above works: `obsArray` may only be used to take
 * ownership of those disposables that are added to it as array elements.
 */
export class ObsArray<T> extends BaseObservable<T[]> {
  private _ownedItems?: Set<T & IDisposable> = undefined;

  /**
   * Adds a callback to listen to changes in the observable. In case of `ObsArray`, the listener
   * gets additional information.
   */
  public addListener(callback: ISpliceListener<T, void>): Listener;
  public addListener<C>(callback: ISpliceListener<T, C>, context: C): Listener;
  public addListener(callback: ISpliceListener<T, any>, optContext?: any): Listener {
    return super.addListener(callback, optContext);
  }

  /**
   * Take ownership of an item added to this array. This should _only_ be used for array elements,
   * not any unrelated items.
   */
  public autoDispose(value: T & IDisposable): T & IDisposable {
    if (!this._ownedItems) { this._ownedItems = new Set<T & IDisposable>(); }
    this._ownedItems.add(value);
    return value;
  }

  /** @override */
  public dispose(): void {
    if (this._ownedItems) {
      for (const item of this.get() as Array<T & IDisposable>) {
        if (this._ownedItems.delete(item)) {
          item.dispose();
        }
      }
      this._ownedItems = undefined;
    }
    super.dispose();
  }

  /** @internal */
  protected _setWithSplice(value: T[], splice: IObsArraySplice<T>): void {
    return this._setWithArg(value, splice);
  }

  /** @internal */
  protected _disposeOwned(splice?: IObsArraySplice<T>): void {
    if (!this._ownedItems) { return; }
    if (splice) {
      for (const item of splice.deleted as Array<T & IDisposable>) {
        if (this._ownedItems.delete(item)) {
          item.dispose();
        }
      }
    } else {
      const oldOwnedItems = this._ownedItems;

      // Rebuild the _ownedItems array to have only the current items that were owned from before.
      this._ownedItems = new Set<T & IDisposable>();
      for (const item of this.get() as Array<T & IDisposable>) {
        if (oldOwnedItems.delete(item)) {
          this._ownedItems.add(item);
        }
      }
      // After removing current items, dispose any remaining owned items.
      for (const item of oldOwnedItems) {
        item.dispose();
      }
    }
  }
}

/**
 * `MutableObsArray<T>` adds array-like mutation methods which emit events with splice info, to
 * allow more efficient processing of such changes. It is created with `obsArray<T>()`.
 */
export class MutableObsArray<T> extends ObsArray<T> {
  /** Appends elements to the end and returns the new length (like `Array#push`). */
  public push(...args: T[]): number {
    const value = this.get();
    const start = value.length;
    const newLen = value.push(...args);
    this._setWithSplice(value, {start, numAdded: args.length, deleted: []});
    return newLen;
  }

  /** Removes and returns the last element (like `Array#pop`). */
  public pop(): T|undefined {
    const value = this.get();
    if (value.length === 0) { return undefined; }
    const ret = value.pop()!;
    this._setWithSplice(value, {start: value.length, numAdded: 0, deleted: [ret]});
    return ret;
  }

  /** Prepends elements to the start and returns the new length (like `Array#unshift`). */
  public unshift(...args: T[]) {
    const value = this.get();
    const newLen = value.unshift(...args);
    this._setWithSplice(value, {start: 0, numAdded: args.length, deleted: []});
    return newLen;
  }

  /** Removes and returns the first element (like `Array#shift`). */
  public shift(): T|undefined {
    const value = this.get();
    if (value.length === 0) { return undefined; }
    const ret = value.shift()!;
    this._setWithSplice(value, {start: 0, numAdded: 0, deleted: [ret]});
    return ret;
  }

  /**
   * Removes and/or inserts elements at a given index and returns the removed elements (like
   * `Array#splice`).
   */
  public splice(start: number, deleteCount: number = Infinity, ...newValues: T[]) {
    const value = this.get();
    const len = value.length;
    start = Math.min(len, Math.max(0, start < 0 ? len + start : start));
    const deleted = value.splice(start, deleteCount, ...newValues);
    this._setWithSplice(value, {start, numAdded: newValues.length, deleted});
    return deleted;
  }
}

/**
 * Creates a new MutableObsArray with an optional initial value, defaulting to the empty array.
 * It is essentially the same as `observable<T[]>`, but with array-like mutation methods.
 */
export function obsArray<T>(value: T[] = []): MutableObsArray<T> {
  return new MutableObsArray<T>(value);
}

/**
 * Returns true if val is an array-valued observable.
 */
function isObsArray(val: BaseObservable<any>): val is BaseObservable<any[]> {
  return Array.isArray(val.get());
}

/**
 * See [`computedArray()`](#computedArray) for documentation.
 */
export class ComputedArray<T, U> extends ObsArray<U> {
  private _sub: Subscription;
  private _source?: BaseObservable<T[]>;
  private _listener?: Listener;
  private _lastSplice?: IObsArraySplice<T>|false;     // false is a marker that full rebuild is needed

  constructor(
    obsArr: BaseObservable<T[]> | Observable<BaseObservable<T[]>>,
    private _mapper: (item: T, index: number, arr: ComputedArray<T, U>) => U,
  ) {
    super([]);
    this._sub = isObsArray(obsArr) ?
      subscribe(obsArr, (use) => this._syncMap(obsArr)) :
      subscribe(obsArr, (use, obsArrayValue) => { use(obsArrayValue); return this._syncMap(obsArrayValue); });
  }

  /** @internal */
  public dispose() {
    this._unsync();
    this._sub.dispose();
    super.dispose();
  }

  private _syncMap(obsArr: BaseObservable<T[]>): void {
    if (this._source !== obsArr) {
      this._unsync();
      this._listener = obsArr.addListener(this._recordChange, this);
      this._source = obsArr;
      this._rebuild(obsArr);
    } else if (this._lastSplice) {
      // If we are syncing to the same array as before and recorded a single splice, apply it now.
      this._applySplice(obsArr, this._lastSplice);
    } else {
      // If the full array changed or we had multiple splices, give up and rebuild.
      this._rebuild(obsArr);
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

  private _rebuild(obsArr: BaseObservable<T[]>) {
    this.set(obsArr.get().map((item: T, i: number) => this._mapper.call(undefined, item, i, this)));
  }

  private _applySplice(obsArr: BaseObservable<T[]>, change: IObsArraySplice<T>) {
    const sourceArray: T[] = obsArr.get();
    const newItems: U[] = [];
    for (let i = change.start, n = 0; n < change.numAdded; i++, n++) {
      newItems.push(this._mapper.call(undefined, sourceArray[i], i, this));
    }
    const items: U[] = this.get();
    const deleted = items.splice(change.start, change.deleted.length, ...newItems);
    this._setWithSplice(items, {start: change.start, numAdded: newItems.length, deleted});
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
 * Returns an `ObsArray` that maps all elements of the passed-in `ObsArray` through a mapper
 * function. Also accepts an observable (e.g. a computed) whose value is an `ObsArray`.
 * ```ts
 * computedArray(obsArray, mapper)
 * ```
 *
 * The result is analogous to:
 * ```ts
 * computed((use) => use(obsArray).map(mapper))       // for ObsArray
 * computed((use) => use(use(obsArray)).map(mapper))  // for Observable<ObsArray>
 * ```
 *
 * The benefit of `computedArray()` is that a small change to the source array (e.g. one item
 * added or removed), causes a small change to the mapped array, rather than a full rebuild.
 *
 * This is useful with an `ObsArray` or with an observable whose value is an `ObsArray`, and also
 * when the computed array's items are disposable and it owns them.
 *
 * There is no need or benefit to using `computedArray()` if you have a `computed()` that returns
 * a plain array. It is specifically for the case when you want to preserve the efficiency of
 * `ObsArray` when you map its values.
 *
 * Note that the mapper function is called with `(item, index, array)` as for a standard
 * `array.map()`, but that the index is only accurate at the time of the call, and will stop
 * reflecting the true index if more items are inserted into the array later.
 *
 * As with `ObsArray`, a `ComputedArray` may be used with disposable elements as their owners. E.g.
 * ```ts
 * const values = obsArray<string>();
 * const compArr = computedArray<D>(values, (val, i, compArr) => D.create(compArr, val));
 * values.push("foo", "bar");      // D("foo") and D("bar") get created
 * values.pop();                   // D("bar") gets disposed.
 * compArr.dispose();              // D("foo") gets disposed.
 * ```
 *
 * Note that only the pattern above works: obsArray (or compArray) may only be used to take
 * ownership of those disposables that are added to it as array elements.
 */
export function computedArray<T, U>(
  obsArr: BaseObservable<T[]> | Observable<BaseObservable<T[]>>,
  mapper: (item: T, index: number, arr: ComputedArray<T, U>) => U,
): ObsArray<U> {
  return new ComputedArray<T, U>(obsArr, mapper);
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
export function makeLiveIndex<T>(owner: IDisposableOwnerT<LiveIndex>|null, obsArr: ObsArray<T>,
                                 initialIndex: number = 0): LiveIndex {
  return setDisposeOwner(owner, new LiveIndex(obsArr, initialIndex));
}

/**
 * An Observable that represents an index into an `ObsArray`, clamped to be in the valid range.
 */
export class LiveIndex extends Observable<number|null> {
  private _listener: Listener;
  private _isLive: boolean = true;

  constructor(private _obsArray: ObsArray<any>, initialIndex: number = 0) {
    super(null);
    this.set(initialIndex);
    this._listener = _obsArray.addListener(this._onArrayChange, this);
  }

  /**
   * Set the index, clamping it to a valid value.
   */
  public set(index: number|null) {
    // Clamp to [0, len) range of the observable array.
    const len = this._obsArray.get().length;
    super.set(len === 0 ? null : Math.max(0, Math.min(len - 1, index || 0)));
  }

  /**
   * Turn "liveness" on or off. While set to false, the observable will not be adjusted as the
   * array changes, except to keep it valid.
   *
   * @privateRemarks
   * Note that this feature comes from a rather obscure need, and it would be better if something
   * similar were possible without making it an explicit feature.
   */
  public setLive(value: boolean): void {
    this._isLive = value;
  }

  /** @override */
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
