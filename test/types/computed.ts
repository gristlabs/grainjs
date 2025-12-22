/**
 * Test types using tsd. See README in this directory.
 */
import {expectType, expectError} from 'tsd';
import { Computed, Holder, Observable, UseCBOwner } from '../../index';

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
Computed.create(holder, o1, o2, (use, _o1, _o2) => {
  expectError(foo(_o1, _o2));
  expectError(foo(use(o1), use(o2)));
});

// Type of observable is determined by return type of callback.
expectType<Computed<string>>(Computed.create(holder, (use) => "a" + use(o1)));
expectError(Computed.create<number>(holder, (use) => "a" + use(o1)));

// Should support up to 5 static dependencies. We are not using generics here only because
// var-args can't be used when they are not the last argument.
Computed.create(holder, o1, o2, o1, o2, o1, (use, _o1, _o2, _o1b, _o2b, _o1c) => {
  expectType<number>(_o1);
  expectType<string>(_o2);
  expectType<number>(_o1b);
  expectType<string>(_o2b);
  expectType<number>(_o1c);
  expectType<number>(use(o1));
  expectType<string>(use(o2));
  expectType<UseCBOwner>(use);
});
