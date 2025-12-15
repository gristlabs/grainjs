import {LLink} from './emit';

/**
 * Anything with a .dispose() method is a disposable object, and implements the IDisposable interface.
 */
export interface IDisposable {
  dispose(): void;
}

/**
 * Anything with `.autoDispose()` can be the owner of a disposable object. This is a type-specific
 * class that can only own a disposable object of type T.
 */
export interface IDisposableOwnerT<T extends IDisposable> {
  autoDispose(obj: T): void;
}

/**
 * Type that can own an object of any disposable type.
 */
export interface IDisposableOwner {
  autoDispose(obj: IDisposable): void;
}

// Internal "owner" of disposable objects which doesn't actually dispose or keep track of them. It
// is the effective owner when creating a Disposable with `new Foo()` rather than `Foo.create()`.
const _noopOwner: IDisposableOwner = {
  autoDispose(obj: IDisposable): void { /* noop */ },
};

// Newly-created Disposable instances will have this as their owner. This is not a constant, it
// is used by create() for the safe creation of Disposables.
let _defaultDisposableOwner = _noopOwner;

/**
 * The static portion of class Disposable.
 */
export interface IDisposableCtor<Derived, CtorArgs extends any[]> {
  new(...args: CtorArgs): Derived;
  create<T extends new(...args: any[]) => any>(
    this: T, owner: IDisposableOwnerT<InstanceType<T>>|null, ...args: ConstructorParameters<T>): InstanceType<T>;
}

/**
 * Base class for disposable objects that can own other objects.
 *
 * For background and motivation, see [Disposables](/dispose).
 *
 * `Disposable` is a class for components that need cleanup (e.g. maintain DOM, listen to events,
 * subscribe to anything). It provides a `.dispose()` method that should be called to destroy the
 * component, and `.onDispose()` / `.autoDispose()` methods that the component should use to take
 * responsibility for other pieces that require cleanup.
 *
 * To define a disposable class:
 * ```ts
 * class Foo extends Disposable { ... }
 * ```
 *
 * To create `Foo`:
 * ```ts
 * const foo = Foo.create(owner, ...args);
 * ```
 * This is better than `new Foo` for two reasons:
 *    1. If `Foo`'s constructor throws an exception, any disposals registered in that constructor
 *       before the exception are honored.
 *    2. It ensures you specify the owner of the new instance (but you can use null to skip it).
 *
 * In `Foo`'s constructor (or rarely methods), take ownership of other Disposable objects:
 * ```ts
 * this.bar = Bar.create(this, ...);
 * ```
 *
 * For objects that are not instances of Disposable but have a .dispose() methods, use:
 * ```ts
 * this.bar = this.autoDispose(createSomethingDisposable());
 * ```
 *
 * To call a function on disposal (e.g. to add custom disposal logic):
 * ```ts
 * this.onDispose(() => this.myUnsubscribeAllMethod());
 * this.onDispose(this.myUnsubscribeAllMethod, this);
 * ```
 *
 * To mark this object to be wiped out on disposal (i.e. set all properties to null):
 * ```ts
 * this.wipeOnDispose();
 * ```
 * See the documentation of that method for more info.
 *
 * To dispose Foo directly: `foo.dispose()`.
 *
 * To determine if an object has already been disposed: `foo.isDisposed()`.
 *
 * If you need to replace an owned object, or release, or dispose it early, use a
 * [`Holder`](#Holder) or [`MultiHolder`](#MultiHolder).
 *
 * If creating your own class with a `dispose()` method, do NOT throw exceptions from `dispose()`.
 * These cannot be handled properly in all cases.
 *
 * Using a parametrized (generic) class as a Disposable is tricky. E.g.
 * ```ts
 * class Bar<T> extends Disposable { ... }
 * // Bar<T>.create(...)   <-- doesn't work
 * // Bar.create<T>(...)   <-- doesn't work
 * // Bar.create(...)      <-- works, but with {} for Bar's type parameters
 * ```
 *
 * The solution is to expose the constructor type using a helper method:
 * ```ts
 * class Bar<T> extends Disposable {
 *   // Note the tuple below which must match the constructor parameters of Bar<U>.
 *   public static ctor<U>(): IDisposableCtor<Bar<U>, [U, boolean]> { return this; }
 *   constructor(a: T, b: boolean) { ... }
 * }
 * Bar.ctor<T>().create(...)   // <-- works, creates Bar<T>, and does type-checking!
 * ```
 */
export abstract class Disposable implements IDisposable, IDisposableOwner {
  /**
   * Create Disposable instances using `Class.create(owner, ...)` rather than `new Class(...)`.
   *
   * This reminds you to provide an owner, and ensures that if the constructor throws an
   * exception, `dispose()` gets called to clean up the partially-constructed object.
   *
   * Owner may be `null` if you intend to ensure disposal some other way.
   */
  public static create<T extends new (...args: any[]) => any>(
    this: T, owner: IDisposableOwnerT<InstanceType<T>>|null, ...args: ConstructorParameters<T>): InstanceType<T> {

    const origDefaultOwner = _defaultDisposableOwner;
    const holder = new Holder();
    try {
      // The newly-created object will have holder as its owner.
      _defaultDisposableOwner = holder;
      return setDisposeOwner(owner, new this(...args));
    } catch (e) {
      try {
        // This calls dispose on the partially-constructed object
        holder.clear();
      } catch (e2) {
        // tslint:disable-next-line:no-console
        console.error("Error disposing partially constructed %s:", this.name, e2);
      }
      throw e;
    } finally {
      // On success, the new object has a new owner, and we release it from holder.
      // On error, the holder has been cleared, and the release() is a no-op.
      holder.release();
      _defaultDisposableOwner = origDefaultOwner;
    }
  }

  private _disposalList: DisposalList = new DisposalList();

  constructor() {
    // This registers with a temp Holder when using create(), and is a no-op when using `new Foo`.
    _defaultDisposableOwner.autoDispose(this);
    // Be sure to reset to no-op, so that a (non-recommended) direct call like 'new Bar()', from
    // inside Foo's constructor doesn't use the same Holder that's temporarily holding Foo.
    _defaultDisposableOwner = _noopOwner;
  }

  /** Take ownership of `obj`, and dispose it when `this.dispose()` is called. */
  public autoDispose<T extends IDisposable>(obj: T): T {
    this.onDispose(obj.dispose, obj);
    return obj;
  }

  /** Call the given callback when `this.dispose()` is called. */
  public onDispose<T>(callback: (this: T) => void, context?: T): IDisposable {
    return this._disposalList.addListener(callback, context);
  }

  /**
   * Wipe out this object when it is disposed, i.e. set all its properties to null. It is
   * recommended to call this early in the constructor.
   *
   * This makes disposal more costly, but has certain benefits:
   *
   * - If anything still refers to the object and uses it, we'll get an early error, rather than
   *   silently keep going, potentially doing useless work (or worse) and wasting resources.
   *
   * - If anything still refers to the object (even without using it), the fields of the object
   *   can still be garbage-collected.
   *
   * - If there are circular references involving this object, they get broken, making the job
   *   easier for the garbage collector.
   *
   * The recommendation is to use it for complex, longer-lived objects, but to skip for objects
   * which are numerous and short-lived (and less likely to be referenced from unexpected places).
   */
  public wipeOnDispose(): void {
    this.onDispose(this._wipeOutObject, this);
  }

  /**
   * Returns whether this object has already been disposed.
   */
  public isDisposed(): boolean {
    return this._disposalList === null;
  }

  /**
   * Clean up `this` by disposing all owned objects, and calling `onDispose()` callbacks, in reverse
   * order to that in which they were added.
   */
  public dispose(): void {
    const disposalList = this._disposalList;
    if (!disposalList) {
        // tslint:disable-next-line:no-console
      console.error("Error disposing %s which is already disposed", _describe(this));
    } else {
      this._disposalList = null!;
      disposalList.callAndDispose(this);
    }
  }

  /**
   * Wipe out this object by setting each property to null. This is helpful for objects that are
   * disposed and should be ready to be garbage-collected.
   */
  private _wipeOutObject(): void {
    // The sentinel value doesn't have to be null, but some values cause more helpful errors than
    // others. E.g. if a.x = "disposed", then a.x.foo() throws "undefined is not a function", but
    // when a.x = null, a.x.foo() throws a more helpful "Cannot read property 'foo' of null".
    for (const k of Object.keys(this)) {
      (this as any)[k] = null;
    }
  }
}

/**
 * Holder keeps a single disposable object. If given responsibility for another object using
 * `holder.autoDispose()` or `Foo.create(holder, ...)`, it automatically disposes the currently held
 * object. It also disposes it when the holder itself is disposed.
 *
 * If the object is an instance of `Disposable`, the holder will also notice when the object gets
 * disposed from outside of it, in which case the holder will become empty again.
 *
 * If you need a container for multiple objects and dispose them all together, use a `MultiHolder`:
 *
 * :::info Example
 * ```ts
 * this._holder = Holder.create(this);
 * Bar.create(this._holder, 1);      // creates new Bar(1), assuming it's a Disposable
 * Bar.create(this._holder, 2);      // creates new Bar(2) and disposes previous object
 * this._holder.clear();             // disposes contained object
 * this._holder.release();           // releases contained object
 * ```
 * :::
 */
export class Holder<T extends IDisposable> implements IDisposable, IDisposableOwner {
  /** `Holder.create(owner)` creates a new `Holder`. */
  public static create<T extends IDisposable>(owner: IDisposableOwnerT<Holder<T>>|null): Holder<T> {
    return setDisposeOwner(owner, new Holder<T>());
  }

  /** @internal */
  protected _owned: T|null = null;
  private _disposalListener: IDisposable|undefined = undefined;

  /** Take ownership of a new object, disposing the previously held one. */
  public autoDispose(obj: T): T {
    this.clear();
    this._owned = obj;
    if (obj instanceof Disposable) {
      this._disposalListener = obj.onDispose(this._onOutsideDispose, this);
    }
    return obj;
  }

  /** Releases the held object without disposing it, emptying the holder. */
  public release(): IDisposable|null {
    this._unlisten();
    const ret = this._owned;
    this._owned = null;
    return ret;
  }

  /** Disposes the held object and empties the holder. */
  public clear(): void {
    this._unlisten();
    const owned = this._owned;
    if (owned) {
      this._owned = null;
      owned.dispose();
    }
  }

  /** Returns the held object, or null if the Holder is empty. */
  public get(): T|null { return this._owned; }

  /** Returns whether the Holder is empty. */
  public isEmpty(): boolean { return !this._owned; }

  /** When the holder is disposed, it disposes the held object if any. */
  public dispose(): void { this.clear(); }

  /** Stop listening for the disposal of this._owned. */
  private _unlisten() {
    const disposalListener = this._disposalListener;
    if (disposalListener) {
      this._disposalListener = undefined;
      disposalListener.dispose();
    }
  }

  private _onOutsideDispose() {
    this._disposalListener = undefined;
    this._owned = null;
  }
}

/**
 * `MultiHolder` keeps multiple disposable objects. It disposes all held object when the holder
 * itself is disposed. It's actually nothing more than the `Disposable` base class itself, just
 * exposed with a clearer name that describes its purpose.
 *
 * :::info Example
 * ```ts
 * this._mholder = MultiHolder.create(null);
 * Bar.create(this._mholder, 1);     // create new Bar(1)
 * Bar.create(this._mholder, 2);     // create new Bar(2)
 * this._mholder.dispose();          // disposes both objects
 * ```
 * :::
 */
export class MultiHolder extends Disposable {}

/**
 * Sets owner of obj (i.e. calls owner.autoDispose(obj)) unless owner is null. Returns obj.
 */
export function setDisposeOwner<T extends IDisposable>(owner: IDisposableOwnerT<T>|null, obj: T): T {
  if (owner) { owner.autoDispose(obj); }
  return obj;
}

/**
 * Helper for reporting errors during disposal. Try to report the type of the object.
 */
function _describe(obj: any) {
  return (obj && obj.constructor && obj.constructor.name ? obj.constructor.name : '' + obj);
}

/**
 * DisposalList is an internal class mimicking emit.Emitter. The difference is that callbacks are
 * called in reverse order, and exceptions in callbacks are reported and swallowed.
 */
class DisposalList extends LLink {
  constructor() { super(); }

  public addListener<T>(callback: (this: T) => void, optContext?: T): DisposeListener {
    const lis = new DisposeListener(callback, optContext);
    this._insertBefore(this._next!, lis);
    return lis;
  }

  /**
   * Call all callbacks and dispose this object. The owner is required for better reporting of
   * errors if any callback throws.
   */
  public callAndDispose(owner: Disposable): void {
    try {
      DisposeListener.callAll(this._next!, this, owner);
    } finally {
      this._disposeList();
    }
  }
}

/**
 * Internal class that keeps track of one item of the DisposalList. It mimicks emit.Listener, but
 * reports and swallows erros when it calls the callbacks in the list.
 */
class DisposeListener extends LLink implements IDisposable {
  public static callAll(begin: LLink, end: LLink, owner: Disposable): void {
    while (begin !== end) {
      const lis = begin as DisposeListener;
      try {
        lis.callback.call(lis.context);
      } catch (e) {
        // tslint:disable-next-line:no-console
        console.error("While disposing %s, error disposing %s: %s", _describe(owner), _describe(this), e);
      }
      begin = lis._next!;
    }
  }

  constructor(private callback: () => void, private context?: any) { super(); }

  public dispose(): void {
    if (this.isDisposed()) { return; }
    this._removeNode(this);
  }
}
