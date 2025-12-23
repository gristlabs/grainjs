/**
 * Test types using tsd. See README in this directory.
 */
import { expectType, expectError } from 'tsd';
import { Disposable, IDisposable, IDisposableCtor, IDisposableOwnerT } from '../../lib/dispose';

class MyFoo extends Disposable {
  public args: any[];
  constructor(public a: number, public b: string, public c?: boolean) {
    super();
    this.args = [a, b, c];
  }
}

class OtherFoo extends Disposable {
  public hello() {}
}

class Owner<T extends IDisposable> implements IDisposableOwnerT<T> {
  public autoDispose(x: T) {}
}

// Test that valid args are accepted.
MyFoo.create(null, 1, "hello", true);
MyFoo.create(null, 1, "hello");

// Test that invalid args are rejected with informative errors.
// TODO Haven't found a way to verify that e.g. last arg is boolean|undefined.
expectError(MyFoo.create(null, 1, "hello", 2));
expectError(MyFoo.create(null, "test", 1));
expectError(MyFoo.create(null, 1));
expectError(MyFoo.create(null));

// Test that the return type is correct.
expectType<MyFoo>(MyFoo.create(null, 1, "hello", true));

// Test that correct Owner type is accepted.
expectType<MyFoo>(MyFoo.create(new Owner<MyFoo>(), 1, "hello", true));

// Test that incorrect Owner type is rejected.
expectError(MyFoo.create(new Owner<OtherFoo>(), 1, "hello", true));

// ----------------------------------------
// Test using a parametrized class with Disposable.
// ----------------------------------------
class MyBar<T> extends Disposable {
  public static ctor<U>(): IDisposableCtor<MyBar<U>, [U, boolean?]> { return this; }
  constructor(public a: T, public b?: boolean) { super(); }
}
// Check that correct usage works.
MyBar.ctor<number>().create(null, 17, false);
MyBar.ctor<number>().create(null, 17);
MyBar.ctor<string>().create(null, "test", true);
MyBar.ctor<string>().create(null, "test");

// Check that type-checking rejects incorrect arguments.
expectError(MyBar.ctor<number>().create(null, 17, false, "x"));
expectError(MyBar.ctor<string>().create(null));
expectError(MyBar.ctor<number>().create(null, "test", false));
expectError(MyBar.ctor<number>().create(null, 17, "test"));
expectError(MyBar.ctor<string>().create(null, 17, false));
