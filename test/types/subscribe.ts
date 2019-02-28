import { computed, Computed } from '../../lib/computed';
import { pureComputed, PureComputed } from '../../lib/pureComputed';
import { observable, Observable } from '../../lib/observable';
import { subscribe, Subscription } from '../../lib/subscribe';

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
  _o1;        // $ExpectType number
  _o2;        // $ExpectType string
  use(o1);    // $ExpectType number
  use(o2);    // $ExpectType string
  use;        // $ExpectType UseCB
});

pureComputed(o1, o2, (use, _o1, _o2) => {
  _o1;        // $ExpectType number
  _o2;        // $ExpectType string
  use(o1);    // $ExpectType number
  use(o2);    // $ExpectType string
  use;        // $ExpectType UseCB
});

subscribe(o1, o2, (use, _o1, _o2) => {
  _o1;        // $ExpectType number
  _o2;        // $ExpectType string
  use(o1);    // $ExpectType number
  use(o2);    // $ExpectType string
  use;        // $ExpectType UseCB
});

// Should support up to 5 static dependencies. We are not using generics here only because
// var-args can't be used when they are not the last argument.
computed(o1, o2, o1, o2, o1, (use, _o1, _o2, _o1b, _o2b, _o1c) => {
  _o1;        // $ExpectType number
  _o2;        // $ExpectType string
  _o1b;       // $ExpectType number
  _o2b;       // $ExpectType string
  _o1c;       // $ExpectType number
  use(o1);    // $ExpectType number
  use(o2);    // $ExpectType string
  use;        // $ExpectType UseCB
});
