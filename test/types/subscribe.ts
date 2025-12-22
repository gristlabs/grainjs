/**
 * Test types using tsd. See README in this directory.
 */
import { expectType } from 'tsd';
import { computed, Computed } from '../../lib/computed';
import { pureComputed, PureComputed } from '../../lib/pureComputed';
import { observable, Observable } from '../../lib/observable';
import { subscribe, Subscription, UseCB, UseCBOwner } from '../../lib/subscribe';

function foo(s: string, n: number): string { return ''; }

const o1: Observable<number> = observable(1);
const o2: Observable<string> = observable("2");
const c1: Computed<number> = computed((use) => 2 * use(o1));
const c2: Computed<string> = computed(o1, o2, (use, _o1, _o2) => foo(_o2, _o1) + foo(use(o2), use(o1)));
const p1: PureComputed<number> = pureComputed((use) => 2 * use(o1));
const p2: PureComputed<string> = pureComputed(o1, o2, (use, _o1, _o2) => foo(_o2, _o1) + foo(use(o2), use(o1)));
const s1: Subscription = subscribe((use) => console.log(2 * use(o1)));
const s2: Subscription = subscribe(o1, o2, (use, _o1, _o2) => console.log(foo(_o2, _o1), foo(use(o2), use(o1))));

[c1, c2, p1, p2, s1, s2];     // Silence unused-variable errors.

computed(o1, o2, (use, _o1, _o2) => {
  expectType<number>(_o1);
  expectType<string>(_o2);
  expectType<number>(use(o1));
  expectType<string>(use(o2));
  expectType<UseCBOwner>(use);
});

pureComputed(o1, o2, (use, _o1, _o2) => {
  expectType<number>(_o1);
  expectType<string>(_o2);
  expectType<number>(use(o1));
  expectType<string>(use(o2));
  expectType<UseCB>(use);
});

subscribe(o1, o2, (use, _o1, _o2) => {
  expectType<number>(_o1);
  expectType<string>(_o2);
  expectType<number>(use(o1));
  expectType<string>(use(o2));
  expectType<UseCB>(use);
});

// Should support up to 5 static dependencies. We are not using generics here only because
// var-args can't be used when they are not the last argument.
computed(o1, o2, o1, o2, o1, (use, _o1, _o2, _o1b, _o2b, _o1c) => {
  expectType<number>(_o1);
  expectType<string>(_o2);
  expectType<number>(_o1b);
  expectType<string>(_o2b);
  expectType<number>(_o1c);
  expectType<number>(use(o1));
  expectType<string>(use(o2));
  expectType<UseCBOwner>(use);
});
