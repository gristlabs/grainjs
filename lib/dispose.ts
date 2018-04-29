/**
 * dispose.js provides tools to objects that needs to dispose resources, such as destroy DOM, and
 * unsubscribe from events. The motivation with examples is presented here:
 *
 *    https://phab.getgrist.com/w/disposal/
 *
 * Disposable is a class for components that need cleanup (e.g. maintain DOM, listen to events,
 * subscribe to anything). It provides a .dispose() method that should be called to destroy the
 * component, and .onDispose()/.autoDispose() methods that the component should use to take
 * responsibility for other pieces that require cleanup.
 *
 * To define a disposable class:
 *    class Foo extends Disposable { ... }
 *
 * To create Foo:
 *    const foo = Foo.create(owner, ...args);
 * This is better than `new Foo` for two reasons:
 *    1. If Foo's constructor throws an exception, any disposals registered in that constructor
 *       before the exception are honored.
 *    2. It ensures you specify the owner of the new instance (but you can use null to skip it).
 *
 * In Foo's constructor (or rarely methods), take ownership of other Disposable objects:
 *    this.bar = Bar.create(this, ...);
 *
 * For objects that are not instances of Disposable but have a .dispose() methods, use:
 *    this.bar = this.autoDispose(createSomethingDisposable());
 *
 * To call a function on disposal (e.g. to add custom disposal logic):
 *    this.onDispose(() => this.myUnsubscribeAllMethod());
 *    this.onDispose(this.myUnsubscribeAllMethod, this);    // slightly more efficient
 *
 * To mark this object to be wiped out on disposal (i.e. set all properties to null):
 *    this.wipeOnDispose();
 * See the documentation of that method for more info.
 *
 * To dispose Foo directly:
 *    foo.dispose();
 * To determine if an object has already been disposed:
 *    foo.isDisposed()
 *
 * If you need to replace an owned object, or release, or dispose it early, use a Holder:
 *    this._holder = Holder.create(this);
 *    Bar.create(this._holder, 1);      // creates new Bar(1)
 *    Bar.create(this._holder, 2);      // creates new Bar(2) and disposes previous object
 *    this._holder.clear();             // disposes contained object
 *    this._holder.release();           // releases contained object
 *
 * If creating your own class with a dispose() method, do NOT throw exceptions from dispose().
 * These cannot be handled properly in all cases. Read here about the same issue in C++:
 *    http://bin-login.name/ftp/pub/docs/programming_languages/cpp/cffective_cpp/MAGAZINE/SU_FRAME.HTM#destruct
 */

import {LLink} from './emit';

/**
 * Anything with a .dispose() method is a disposable object, and implements the IDisposable interface.
 */
export interface IDisposable {
  dispose(): void;
}

/**
 * Anything with .autoDispose() can be the owner of a disposable object. This is a type-specific
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
 * Base class for disposable objects that can own other objects. See the module documentation.
 */
export abstract class Disposable implements IDisposable, IDisposableOwner {
  /**
   * Create Disposable instances using `Class.create(owner, ...)` rather than `new Class(...)`.
   *
   * This reminds you to provide an owner, and ensures that if the constructor throws an
   * exception, dispose() gets called to clean up the partially-constructed object.
   *
   * Owner may be null if intend to ensure disposal some other way.
   *
   * TODO: create() needs more unittests, including to ensure that TypeScript types are done
   * correctly.
   */
  // The complex-looking overloads are to ensure that it can do type-checking for constuctors of
  // different arity. E.g. if Foo's constructor takes (number, string), we want Foo.create to
  // require (owner, number, string) as arguments.
  public static create<T extends IDisposable>(
    this: new () => T, owner: IDisposableOwnerT<T>|null): T;
  public static create<T extends IDisposable, A>(
    this: new (a: A) => T, owner: IDisposableOwnerT<T>|null, a: A): T;
  public static create<T extends IDisposable, A, B>(
    this: new (a: A, b: B) => T, owner: IDisposableOwnerT<T>|null, a: A, b: B): T;
  public static create<T extends IDisposable, A, B, C>(
    this: new (a: A, b: B, c: C) => T, owner: IDisposableOwnerT<T>|null, a: A, b: B, c: C): T;
  public static create<T extends IDisposable, A, B, C, D>(
    this: new (a: A, b: B, c: C, d: D) => T, owner: IDisposableOwnerT<T>|null, a: A, b: B, c: C, d: D): T;
  public static create<T extends IDisposable, A, B, C, D, E>(
    this: new (a: A, b: B, c: C, d: D, e: E) => T, owner: IDisposableOwnerT<T>|null, a: A, b: B, c: C, d: D, e: E): T;
  public static create<T extends IDisposable>(
    this: new (...args: any[]) => T, owner: IDisposableOwnerT<T>|null, ...args: any[]): T {

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
  }

  /** Take ownership of obj, and dispose it when this.dispose() is called. */
  public autoDispose<T extends IDisposable>(obj: T): T {
    this.onDispose(obj.dispose, obj);
    return obj;
  }

  /** Call the given callback when this.dispose() is called. */
  public onDispose<T>(callback: (this: T) => void, context?: T): void {
    this._disposalList.addListener(callback, context);
  }

  /**
   * Wipe out this object when it is disposed, i.e. set all its properties to null. It is
   * recommended to call this early in the constructor.
   *
   * This makes disposal more costly, but has certain benefits:
   * - If anything still refers to the object and uses it, we'll get an early error, rather than
   *   silently keep going, potentially doing useless work (or worse) and wasting resources.
   * - If anything still refers to the object (even without using it), the fields of the object
   *   can still be garbage-collected.
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
   * Clean up `this` by disposing all owned objects, and calling onDispose() callbacks, in reverse
   * order to that in which they were added.
   */
  public dispose(): void {
    const disposalList = this._disposalList;
    this._disposalList = null!;
    disposalList.callAndDispose(this);
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
 * holder.autoDispose() or Foo.create(holder, ...), it automatically disposes the currently held
 * object. It also disposes it when the holder itself is disposed.
 *
 * If the object is an instance of Disposable, the holder will also notice when the object gets
 * disposed from outside of it, in which case the holder will become empty again.
 *
 * TODO Holder needs unittests.
 */
export class Holder<T extends IDisposable> implements IDisposable, IDisposableOwner {
  public static create<T extends IDisposable>(owner: IDisposableOwner|null): Holder<T> {
    return setDisposeOwner(owner, new Holder<T>());
  }

  protected _owned: T|null = null;

  /** Take ownership of a new object, disposing the previously held one. */
  public autoDispose(obj: T): T {
    if (this._owned) { this._owned.dispose(); }
    this._owned = obj;
    if (obj instanceof Disposable) {
      obj.onDispose(this.release, this);
    }
    return obj;
  }

  /** Releases the held object without disposing it, emptying the holder. */
  public release(): IDisposable|null {
    const ret = this._owned;
    this._owned = null;
    return ret;
  }

  /** Disposes the held object and empties the holder. */
  public clear(): void {
    if (this._owned) {
      this._owned.dispose();
      this._owned = null;
    }
  }

  /** Returns the held object, or null if the Holder is empty. */
  public get(): T|null { return this._owned; }

  /** Returns whether the Holder is empty. */
  public isEmpty(): boolean { return !this._owned; }

  /** When the holder is disposed, it disposes the held object if any. */
  public dispose(): void { this.clear(); }
}

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

  public addListener<T>(callback: (this: T) => void, optContext?: T): void {
    const lis = new DisposeListener(callback, optContext);
    this._insertBefore(this._next!, lis);
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
class DisposeListener extends LLink {
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
}
