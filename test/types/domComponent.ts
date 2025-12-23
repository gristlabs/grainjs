/**
 * Test types using tsd. See README in this directory.
 */
import { expectType, expectError } from 'tsd';
import { Disposable, dom, DomContents, IDisposableOwner } from '../../index';

class MyComp extends Disposable {
  constructor(public a: number, public b: string, public c?: boolean) { super(); }
  public buildDom() { return null; }
}

function myFunc(owner: IDisposableOwner, a: number, b: string, c?: boolean) {
  return null;
}

// Test that valid args are accepted.
expectType<DomContents>(dom.create(MyComp, 1, "hello", true));
expectType<DomContents>(dom.create(MyComp, 1, "hello"));
expectType<DomContents>(dom.create(myFunc, 1, "hello", true));
expectType<DomContents>(dom.create(myFunc, 1, "hello"));

// Test that invalid args are rejected with informative errors.
expectError(dom.create(MyComp, 1, "hello", 2));
expectError(dom.create(MyComp, "test", 1));
expectError(dom.create(MyComp, 1));
expectError(dom.create(MyComp));
expectError(dom.create(myFunc, 1, "hello", 2));
expectError(dom.create(myFunc, "test", 1));
expectError(dom.create(myFunc, 1));
expectError(dom.create(myFunc));

// This one doesn't return DomContents
function myNonFunc(owner: IDisposableOwner, a: number, b: string, c?: boolean) { return 1; }
expectError(dom.create(myNonFunc, 1, "hello", true));
