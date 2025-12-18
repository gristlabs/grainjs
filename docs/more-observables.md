# More on Observables

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
const a = obsArray<string>([]);
const b = obsArray<string>(['bus', 'bin']);
const toggle = Observable.create(null, true);
const array = Computed.create(null, use => use(toggle) ? a : b);
const mapped = computedArray(array, x => x.toUpperCase());

mapped.get();       // Returns [], reflecting content of a
a.push('ace');
mapped.get();       // Returns ['ACE']
toggle.set(false);  // array now returns b
mapped.get();       // Returns ['BUS', 'BIN'] reflecting content of b
```

There is no need or benefit in using `computedArray()` if you have a `computed()` that returns a
plain array. It is specifically for the case when you want to preserve the efficiency of
`ObsArray` when you map its values.

Either of `ObsArray` and `ComputedArray` may be used with disposable elements as their owner. E.g.

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
