# Disposables

- [Class Disposable](#class-disposable)
- [Taking Ownership](#taking-ownership)
- [Holders](#holders)
- [Further Notes](#further-notes)

There is a subtle issue with building long-lived front-end applications, which is that objects
need to be disposed. The need for this permeates the design of GrainJS.

In C++, classes can have constructors and destructors, with deterministic rules for when
destructors are called to clean up an object state. Destructors aren’t a feature of most languages
with automatic memory management (like Javascript), because there is no need to release memory
when an object is no longer used; the garbage-collector takes care of that. But memory is not the
only resource that’s acquired in the constructor and that may need to be released. In fact, in
C++, the pairing of constructors and destructors is so useful for managing resources that there is
a named pattern for this: RAII (https://en.cppreference.com/w/cpp/language/raii).

Imagine this situation. You have some component that listens to window resizing and updates
something about the DOM (perhaps redraws a chart). Let’s say the component’s state lives in a
class `MyChart`, and we add a listener to the resize event in its constructor:

```typescript
class MyChart {
  constructor() {
    window.addListener('resize', () => this._updateChartSize());
  }
  ...
}
```

When we create an instance of `MyChart`, the event listener is added, and presumably we add some
DOM to the page to show this chart. In a dynamic application, we may remove the chart from the
page later. When we do, what happens to the event listener?

Nothing! When the window is resized, there is still a callback that will be called. Since this
callback refers to our `MyChart` object, that object can’t be garbage-collected. Any DOM that the
callback updates, even if it’s no longer attached to the page, is still alive and well in memory,
and gets updated uselessly when the callback runs.

This is a leak — not only of memory, but of CPU processing, and possibly much else (e.g. requests
may continue to be sent to the server). In a long-lived web application, these leaks will
accumulate, and are unacceptable.

What we should do is remove the listener when we no longer need our object. In GrainJS, we call this
“disposing” the object. In addition to removing the chart from the page, we “dispose” the object,
i.e. run any needed clean-up. In this case, we need to run `window.removeListener('resize', ...)`.
If we remember to do that, then the callback is no longer registered, no longer triggered by
window resizing, and no longer keeping references to our object or the associated DOM, so that all
that memory may get garbage-collected.

In GrainJS, objects that need disposal should have a method called `dispose()`, to serve the
purpose similar to a C++ destructor. At a basic level, the example above could be:

```typescript
class MyChart {
   private _onResize = () => this._updateChartSize();
  constructor() {
    window.addListener('resize', this._onResize);
  }
  public dispose() {
    window.removeListener('resize', this._onResize);
  }
  ...
}
```

But it’s not enough to define a `dispose()` method — we need to actually call it. In fact,
whatever code creates a `MyChart` object needs to remember to dispose it when this object is no
longer needed.

When do we need to worry about disposal? At a lowest level, any kind of subscription or listener
to an event, needs to be cleaned up. This could be a DOM event on a longer-lived object (e.g. on
`window`), but it could also be a listener to messages from a websocket, or to custom events
emitted by other parts of the app. Any object that may contain such subscriptions needs to be
disposable. At the next level, any object which creates a disposable object, itself needs to do
cleanup — namely, to dispose of the objects it created — so it itself needs to be disposable. And
so the requirement to remember to clean up the resources you create, propagates through the whole
app.

On other words, we find ourselves in a situation similar to C++ — all code needs to be aware of
disposable objects it creates, and needs to dispose them when they are no longer needed.

That’s quite a chore, and GrainJS offers some particular approaches and tools to make it easier.

## Class Disposable

The basic tool is a class called `Disposable`, intended as a base class for any components that need
cleanup. It provides a `.dispose()` method that should be called to clean up the component, and
`.onDispose()` / `.autoDispose()` methods that the component should use to take responsibility for
other pieces that require cleanup.

To define a disposable class:

```typescript
class Foo extends Disposable { ... }
```

If you create somthing in `Foo`’s constructor that needs to be disposed, use:

```typescript
this.bar = this.autoDispose(createSomethingDisposable());
```

Or, to call a function on disposal:

```typescript
this.onDispose(doSomeCleanup);
```

When `foo.dispose()` is called (defined by the `Disposable` base class), it will automatically
call `doSomeCleanup` and `this.bar.dispose()`, in reverse order to that in which they were
registered. The benefit here is that cleanup of a resource is easy to set up right next to where
the resource itself gets created.

For example, we can simplify our `MyChart` class above. The `dispose()` method is defined for us.

```typescript
class MyChart extends Disposable {
  constructor() {
    const onResize = () => this._updateChartSize();
    window.addListener('resize', onResize);
    this.onDispose(() => window.removeListener('resize', onResize));
  }
  ...
}
```

Various GrainJS tools are designed to work nicely with disposal. So using GrainJS event handling
methods, it’s shorter:

```typescript
// THE RECOMMENDED WAY
class MyChart extends Disposable {
  constructor() {
    this.autoDispose(dom.onElem(window, 'resize', () => this._updateChartSize());
  }
  ...
}
```

Now, let’s say you want to create `MyChart` as a member of another object, say `MyDashboard`.
You’ll have to remember to dispose the chart when the dashboard is disposed. The best option here
is the following:

```typescript
class MyDashboard extends Disposable {
   private _chart: MyChart;
  constructor() {
    this._chart = MyChart.create(this);  // Create MyChart, owned by this.
  }
}
```

This is roughly equivalent to `this.autoDispose(new MyChart())`, but is better for two reasons:

1. If `MyChart` constructor throws an exception, any disposals registered in that constructor before
   the exception will be honored. (Otherwise, some resources will leak in this case.)
2. The required first argument to `.create(owner)` ensures you specify the owner of the new
   instance. It's easier to remember that than to remember to call `this.autoDispose()` for a new
   object.

## Taking Ownership

Every class that derives from `Disposable` has a static `create` method that takes an “owner” as
the first argument. The owner is another `Disposable` which has the responsibility for cleaning up
the newly created object.

In other words, the newly created object’s lifetime is tied to the lifetime of its owner. When
the owner is disposed, it will disposed its owned objects.

The owner can be set to `null`, e.g. `MyChart.create(null)`, which makes it similar to `new
MyChart()`, with the notable difference that the `create()` method will clean up resources created
in case `MyChart` constructor throws an exception.

In short, when creating an instance of `Disposable`:

1. Always prefer using `SomeClass.create()` method.
2. Always prefer passing in the owner as the first argument.

Because the owned objects aren’t cleaned up until their owner is disposed, this pattern should be
used in the constructor. It may also make sense in some initialization method that’s called once.
It does not make sense to call SomeClass.create(this) or this.autoDispose(...) in a method that
gets called multiple times. On each call, some resource gets created (like `SomeClass` or a
subscription), and they will accumulate until this object itself is disposed. In most cases like
this, you’d want each call to create and take ownership of the new resource, and clean up the
previous one. For this, read on about Holders.

## Holders

If you need to replace an owned object, or release an object from disposal, or dispose it early, use a Holder:

```typescript
this._holder = Holder.create(this);
Bar.create(this._holder, 1);  // creates new Bar(1)
Bar.create(this._holder, 2);  // creates new Bar(2) and disposes previous object
this._holder.get();           // returns the contained object
this._holder.clear();         // disposes the contained object
this._holder.release();       // releases the contained object
```

If you need a container for multiple objects and dispose them all together, use a MultiHolder:

```typescript
this._mholder = MultiHolder.create(this);
Bar.create(this._mholder, 1);  // create new Bar(1)
Bar.create(this._mholder, 2);  // create new Bar(2)
this._mholder.dispose();       // disposes both objects
```

## Further Notes

Once an object is disposed, some code may still have a reference to it. Using a disposed object is
usually a bad idea — the fact that it’s disposed says loud and clear that this object should no
longer be used. You can check if an object has already been disposed:

```typescript
foo.isDisposed()
```

If creating your own class with a `dispose()` method, do NOT throw exceptions from `dispose()`.
These cannot be handled properly in all cases, in particular when the disposal is called while
processing another exception. (You can find explanations of this online in the context of C++ and
destructors, but the same reasons apply here.)

You can make a TypeScript parametrized (generic) class inherit from `Disposable`, but it’s tricky
to use its `.create()` method. For example:

```typescript
class Bar<T> extends Disposable { ... }
// Bar<T>.create(...) <-- doesn't work
// Bar.create<T>(...) <-- doesn't work
// Bar.create(...)    <-- works, but with {} for Bar's type parameters
```

The solution is to expose the constructor type using a helper method:

```typescript
class Bar<T> extends Disposable {
  // Note the tuple below which must match the constructor parameters of Bar<U>.
  public static ctor<U>(): IDisposableCtor<Bar<U>, [U, boolean]> { return this; }
  constructor(a: T, b: boolean) { ... }
}
Bar.ctor<T>().create(...) // <-- works, creates Bar<T>, and does type-checking!
```

(Perhaps this can become easier as TypeScript adds features.)

