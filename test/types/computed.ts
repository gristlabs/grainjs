/**
 * Test types using dtslint. See README in this directory.
 */
import { Computed, Holder, Observable } from '../../index';

function foo(s: string, n: number): string { return ''; }

const holder = Holder.create(null);
const o1: Observable<number> = Observable.create(holder, 1);
const o2: Observable<string> = Observable.create(null, "2");
const c1: Computed<number> = Computed.create(holder, (use) => 2 * use(o1));
const c2: Computed<string> = Computed.create(holder, o1, o2, (use, _o1, _o2) =>
  foo(_o2, _o1) +
  foo(use(o2), use(o1))
);

[c1, c2];     // Silence unused-variable errors.

// Swap arguments to foo() to ensure types are known and checked.
Computed.create(holder, o1, o2, (use, _o1, _o2) =>
  foo(_o1, _o2) +         // $ExpectError
  foo(use(o1), use(o2))   // $ExpectError
);

// Type of observable is determined by return type of callback.
const notNumber: Computed<number> = Computed.create(holder, (use) => "a" + use(o1));  // $ExpectError

// Should support up to 5 static dependencies. We are not using generics here only because
// var-args can't be used when they are not the last argument.
Computed.create(holder, o1, o2, o1, o2, o1, (use, _o1, _o2, _o1b, _o2b, _o1c) => {
  _o1;        // $ExpectType number
  _o2;        // $ExpectType string
  _o1b;       // $ExpectType number
  _o2b;       // $ExpectType string
  _o1c;       // $ExpectType number
  use(o1);    // $ExpectType number
  use(o2);    // $ExpectType string
  use;        // $ExpectType UseCBOwner
});
