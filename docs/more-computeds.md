# More on Computeds

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

::: info Knockout.js note
Note that this is a difference to how Knockout.js works.

In Knockout, changing the `amount` would trigger an update to `tax`, `tip`, and `total` (which
depend on it directly). While recalculating `tax`, it would trigger `total`, which depends on `tax`,
and it would get recalculated at that point (using a stale value for `tip`). Then when `tip` is
updated, it would trigger `total` calculation again (this time getting the correct value). Finally,
it will recalculate `total` a third time (the time triggered by the initial change to `amount`).

Improving on this is part of the motivation for GrainJS.
:::

When a computed is evaluated, it keeps
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

There is a known difficulty with GrainJS computeds. To avoid the possibility of infinite loops,
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
const discountObs = Computed.create(null, amountObs,
  (use, amount) => (amount > 100 ? 5 : 0));
```

::: info NOTE
If you run into a legitimate situation where this creates a problem, please open an issue. It's
an area of potential further work.
