# More on Observables

  - [Subscribe](#subscribe)
  - [Disposable Values](#disposable-values)
  - [ObsArray](#obsarray)
  - [PureComputed](#purecomputed)
  - [Order of Evaluation](#order-of-evaluation)

## Subscribe

Computed observables are based on a lower-level primitive for subscribing to observables, which is
sometimes handy to use directly.

The `subscribe()` function allows subscribing to several observables at once.

For example, if we have some existing observables (which may be instances of `Computed`),
we can subscribe to them explicitly:

```typescript
const obs1 = Observable.create(owner, 5);
const obs2 = Observable.create(owner, 12);
subscribe(obs1, obs2, (use, v1, v2) => console.log(v1, v2));
```

or implicitly by using `use(obs)` function, which allows dynamic subscriptions:

```typescript
subscribe(use => console.log(use(obs1), use(obs2)));
```

In either case, the callback is called immediately, and then again whenever `obs1` or `obs2` is
changed.

Creating a subscription allows any number of dependencies to be specified explicitly, and their
values will be passed to the callback. These may be combined with automatic dependencies
detected using `use()`. Note that constructor dependencies have less overhead.

```typescript
subscribe(...deps, ((use, ...depValues) => READ_CALLBACK));
```


## Disposable Values

An observable may contain a disposable object. It may be used as the owner when an object is
created with the `create` static method, or it may take ownership of an object using the
Observable's `autoDispose()` method.

```typescript
const obs = Observable.create<MyClass|null>(owner, null);
MyClass.create(obs, ...args)                      // Preferred
obs.autoDispose(MyClass.create(null, ...args))    // Equivalent
```

Either of these usages will set the observable to the newly created `MyClass` object. The
observable will dispose the owned object when it's set to another value, or when it itself is
disposed.

To create an observable with an initial disposable value owned by this observable, use
`obsHolder`:

```typescript
const obs = obsHolder<MyClass>(MyClass.create(null, ...args));
```

This is needed because using simply `observable<MyClass>(value)` would not cause the observable to
take ownership of value (i.e. to dispose it later).


## ObsArray

`ObsArray` extends a plain Observable to allow for more efficient observation of array changes.

You may use a regular observable with an array for its value. To set it to a new value, you'd need
to provide a new array, or you could modify the array in place, and call
`Observable.setAndTrigger(array)` (to ensure that listeners are called even though the value is
still the same array object). In either case, listeners will be called with the new and old values,
but with no info on what changed inside the array.

For simple changes, such as those made with `.push()` and `.splice()` methods, `ObsArray` allows
for more efficient handling of the change by calling listeners with splice info in the third
argument. This is used by `dom.forEach()` for more efficient handling of array-driven DOM.

For example:

```typescript
const arr = obsArray<string>();
arr.push("b", "c");
arr.splice(1, 0, "b1", "b2");
arr.splice(2, 2)
```

Related to this, there is also a `computedArray()`, which allows mapping each item of an `ObsArray`
through a function, passing through splice info for efficient handling of small changes.

```typescript
const array = obsArray<string>([]);
const mapped = computedArray(array, x => x.toUpperCase());

array.push("a", "b", "c");
mapped.get();     // Returns ["A", "B", "C"]
```

It also allows mapping an observable or a computed whose value is an `ObsArray`. In which case, it
will listen both to the changes to the top-level observable, and to the changes in the
`ObsArray`:

```typescript
const a = obsArray<number>([]);
const b = obsArray<number>([1, 2, 3]);
const toggle = Observable.create(null, true);
const array = Computed.create(null, use => use(toggle) ? a : b);
const mapped = computedArray(array, x => x.toUpperCase());

mapped.get();       // Returns [], reflecting content of a
a.push(10);
mapped.get();       // Returns [10]
toggle.set(false);  // array now returns b
mapped.get();       // Returns [1, 2, 3] reflecting content of b
```

There is no need or benefit in using `computedArray()` if you have a `computed()` that returns a
plain array. It is specifically for the case when you want to preserve the efficiency of
`ObsArray` when you map its values.

Both `ObsArray` and `ComputedArray` may be used with disposable elements as their owners. E.g.

```typescript
const arr = obsArray<D>();
arr.push(D.create(arr, "x"), D.create(arr, "y"));
arr.pop();      // Element "y" gets disposed.
arr.dispose();  // Element "x" gets disposed.

const values = obsArray<string>();
const compArr = computedArray<D>(values, (val, i, compArr) => D.create(compArr, val));
values.push("foo", "bar");      // D("foo") and D("bar") get created
values.pop();                   // D("bar") gets disposed.
compArr.dispose();              // D("foo") gets disposed.
```

Note that only the pattern above works: the observable array may only be used to take
ownership of those disposables that are added to it as array elements.

One more tool available for observale arrays is a `makeLiveIndex(owner, obsArr)`. It
returns a new observable representing an index into the array. The created "live index" observable
can be read and written, and its value is clamped to be a valid index. The index is only null if
the array is empty. As the array changes (e.g. via splicing), the live index is adjusted to
continue pointing to the same element. If the pointed element is deleted, the index is adjusted to
after the deletion point.


## PureComputed

A `pureComputed()` is a variant of `computed()` suitable for use with a pure read function
(free of side-effects). A `pureComputed` only subscribes to its dependencies when something
subscribes to the `pureComputed` itself. At other times, it is not subscribed to anything, and
calls to `get()` will recompute its value each time.

Its syntax and usage are otherwise exactly as for a computed.

In addition to being cheaper when unused, a `pureComputed()` also avoids leaking memory when
unused (since it's not registered with dependencies), so it is not necessary to dispose it.


## Order of Evaluation

When work happens in response to changing observables, or when computed observables are used to
create non-trivial objects, it may be useful to understand the order of evaluation of computeds.

Consider this toy example:

```typescript
const amount = Observable.create(null, 12.95);
const tax = Computed.create(null, use => use(amount) * 0.08875);
const tip = Computed.create(null, use => use(amount) * 0.20);
const total = Computed.create(null, use => use(amount) + use(tax) + use(tip));
```

If you call `amount.set(18.50)`, then `tax`, `tip`, and `total` need to be recomputed. GrainJS
takes care of recomputing them in a correct order: `tax`, then `tip`, then `total`. This way by
the time `total` is calculated, it sees up-to-date values for all of its dependencies.

Note that this is a difference to how Knockout.js works.
In Knockout, changing the `amount` would trigger an update to `tax` and `tip`, and before it gets
to `tip`, while recalculating `tax`, it would trigger `total`. So `total` would get calculated
twice: once in response to the `tax` change (and using a stale value for `tip`), and a second time
in response to the `tip` change, when it finally becomes correct.

Improving on this is part of the motivation for GrainJS. When a computed is evaluated, it keeps
track of a "priority" value, updating it to be greater than the priority of any dependency.
GrainJS uses a priority queue to recalculate values in the order of these priorities. This helps
ensure that when a computed is evaluated, all its dependencies are up to date.

### bundleChanges

Sometimes, it's useful to change multiple observables before recalculating any computed values.
This is possible using `bundleChanges()` method:

```typescript
import {bundleChanges} from 'grainjs';

const taxRate = Observable.create(null, 0);
const tipRate = Observable.create(null, 0);
...
const total = Computed.create(null, use => ...use(taxRate)...use(tipRate)...);

bundleChanges(() => {
  taxRate.set(0.0875);
  tipRate.set(0.20);
});
```

This sets both `taxRate` and `tipRate` before calling any computed callbacks. This way, by the
time such callbacks are called, they see up-to-date values for both observables.

### Single evaluation

There is one known difficulty with GrainJS computeds. To avoid the possibility of infinite loops,
a computed callback will not be called more than once in response to a single change (or a single
`bundleChanges()` call). Normally that's what you want. But you could create a situation when
the single evaluation isn't enough.

Here's a contrived example:

```typescript
const amountObs = Observable.create(null, 0);
const discountObs = Observable.create(null, 0);
const total = Computed.create(null, use => use(amountObs) - use(discountObs));
subscribe(amountObs, (use, amount) => {
  discountObs.set(amount >= 100 ? 5 : 0);
});
```

Here, a change in the amount, e.g. `amountObs.set(200)`, will trigger a recompute of `total`,
producing a value of 200. Then the subscribed callback runs, and sets the `discountObs` to 5. That
ought to trigger a recalculation of `total` to produce a correct value of 195, but because `total`
was already calculated once in this update, it will not be calculated again. It will stay 200.

The issue here is that GrainJS has no way to know that `discountObs` depends on `amountObs` -- the
update happens manually in a subscription. Replacing it with a computed would fix the issue:

```typescript
const discountObs = Computed.create(null, amountObs, (use, amount) => (amount > 100 ? 5 : 0));
```

(If you run into a legitimate situation where this creates a problem, please open an issue. It's
an area of potential further work.)
