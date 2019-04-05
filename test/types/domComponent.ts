import { Disposable, dom, IDisposableOwner } from '../../index';

class MyComp extends Disposable {
  constructor(public a: number, public b: string, public c?: boolean) { super(); }
  public buildDom() { return null; }
}

function myFunc(owner: IDisposableOwner, a: number, b: string, c?: boolean) {
  return null;
}

// Test that valid args are accepted.
dom.create(MyComp, 1, "hello", true);     // $ExpectType DomContents
dom.create(MyComp, 1, "hello");           // $ExpectType DomContents
dom.create(myFunc, 1, "hello", true);     // $ExpectType DomContents
dom.create(myFunc, 1, "hello");           // $ExpectType DomContents

// Test that invalid args are rejected with informative errors.
dom.create(MyComp, 1, "hello", 2);        // $ExpectError
dom.create(MyComp, "test", 1);            // $ExpectError
dom.create(MyComp, 1);                    // $ExpectError
dom.create(MyComp);                       // $ExpectError
dom.create(myFunc, 1, "hello", 2);        // $ExpectError
dom.create(myFunc, "test", 1);            // $ExpectError
dom.create(myFunc, 1);                    // $ExpectError
dom.create(myFunc);                       // $ExpectError

// This one doesn't return DomContents
function myNonFunc(owner: IDisposableOwner, a: number, b: string, c?: boolean) { return 1; }
dom.create(myNonFunc, 1, "hello", true);  // $ExpectError
