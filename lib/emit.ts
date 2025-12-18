function _noop() { /* noop */}

export type ListenerCB<T> = (this: T, ...args: any[]) => void;

/**
 * A callback that listens to _changes_ in the Emitter listeners. This is mainly used for
 * internal purposes.
 */
export type ChangeCB = (hasListeners: boolean) => void;

/**
 * This is an implementation of a doubly-linked list, with just the minimal functionality we need.
 * @internal
 */
export class LLink {
  protected _next: LLink|null = null;
  protected _prev: LLink|null = null;

  constructor() {
    // This immediate circular reference might be undesirable for GC, but might not matter, and
    // makes the linked list implementation simpler and faster.
    this._next = this;
    this._prev = this;
  }

  public isDisposed(): boolean {
    return !this._next;
  }

  protected _insertBefore(next: LLink, node: LLink): void {
    const last = next._prev!;
    last._next = node;
    next._prev = node;
    node._prev = last;
    node._next = next;
  }

  protected _removeNode(node: LLink): void {
    if (node._prev) {
      node._prev._next = node._next;
      node._next!._prev = node._prev;
    }
    node._prev = node._next = null;
  }

  protected _disposeList(): void {
    let node: LLink = this;     // eslint-disable-line @typescript-eslint/no-this-alias
    let next = node._next;
    while (next !== null) {
      node._next = node._prev = null;
      node = next;
      next = node._next;
    }
  }
}

/**
 * An `Emitter` emits events to a list of listeners. Listeners are
 * simply functions to call, and "emitting an event" just calls those functions.
 *
 * This is similar to Backbone events, with more focus on efficiency. Both inserting and removing
 * listeners is constant time.
 *
 * To create an emitter:
 * ```ts
 * const emitter = new Emitter();
 * ```
 *
 * To add a listener:
 * ```ts
 * const listener = fooEmitter.addListener(callback);
 * ```
 *
 * To remove a listener:
 * ```ts
 * listener.dispose();
 * ```
 *
 * The only way to remove a listener is to dispose the `Listener` object returned by `addListener()`.
 * You can often use autoDispose to do this automatically when subscribing in a constructor:
 * ```ts
 * this.autoDispose(fooEmitter.addListener(this.onFoo, this));
 * ```
 *
 * To emit an event, call `emit()` with any number of arguments:
 * ```ts
 * emitter.emit("hello", "world");
 * ```
 *
 * @privateRemarks
 *
 * Note about a possible alternative implementation.
 *
 * We could implement the same interface using an array of listeners. Certain issues apply, in
 * particular with removing listeners from inside emit(), and in ensuring that removals are
 * constant time on average. Such an implementation was attempted and timed. The result is that
 * compared to the linked-list implementation here, add/remove combination could be made nearly
 * twice faster (on average), while emit and add/remove/emit are consistently slightly slower.
 *
 * The implementation here was chosen based on those timings, and as the simpler one. For example,
 * on one setup (macbook, node4, 5-listener queue), add+remove take 0.1us, while add+remove+emit
 * take 3.82us. (In array-based implementation with same set up, add+remove is 0.06us, while
 * add+remove+emit is 4.80us.)
 */
export class Emitter extends LLink {
  private _changeCB: ChangeCB = _noop;
  private _changeCBContext: any = undefined;

  /**
   * Adds a listening callback to the list of functions to call on emit().
   * @param callback - Function to call.
   * @param optContext - Context for the function.
   * @returns Listener object. Its dispose() method removes the callback from the list.
   */
  public addListener<T>(callback: ListenerCB<T>, optContext?: T): Listener {
    return new Listener(this, callback, optContext);
  }

  /**
   * Calls all listener callbacks, passing all arguments to each of them.
   */
  public emit(...args: any[]): void {
    Listener.callAll(this._next!, this, args);
  }

  /**
   * Sets the single callback that would get called when a listener is added or removed.
   * @param changeCB - Function to call after a listener is added or
   *    removed. It's called with a boolean indicating whether this Emitter has any listeners.
   *    Pass in `null` to unset the callback. Note that it can be called multiple times in a row
   *    with hasListeners `true`.
   */
  public setChangeCB(changeCB: ChangeCB, optContext?: any): void {
    this._changeCB = changeCB || _noop;
    this._changeCBContext = optContext;
  }

  /**
   * Helper used by Listener class, but not intended for public usage.
   * @internal
   */
  public _triggerChangeCB(): void {
    this._changeCB.call(this._changeCBContext, this.hasListeners());
  }

  /**
   * Returns whether this Emitter has any listeners.
   */
  public hasListeners(): boolean {
    return this._next !== this;
  }

  /**
   * Disposes the Emitter. It breaks references between the emitter and all the items, allowing
   * for better garbage collection. It effectively disposes all current listeners.
   */
  public dispose(): void {
    this._disposeList();
    this._changeCB = _noop;
    this._changeCBContext = undefined;
  }
}

/**
 * The `Listener` object wraps a callback added to an Emitter, allowing for O(1) removal when the
 * listener is disposed. It implements `IDisposable`.
 */
export class Listener extends LLink {
  /** @internal */
  public static callAll(begin: LLink, end: LLink, args: any[]): void {
    while (begin !== end) {
      const lis = begin as Listener;
      lis.callback.call(lis.context, ...args);
      begin = lis._next!;
    }
  }

  constructor(private emitter: Emitter,
              private callback: ListenerCB<any>,
              private context?: any) {
    super();
    this._insertBefore(emitter, this);
    emitter._triggerChangeCB();
  }

  /** @internal */
  public dispose(): void {
    if (this.isDisposed()) { return; }
    this._removeNode(this);
    this.emitter._triggerChangeCB();
  }
}
