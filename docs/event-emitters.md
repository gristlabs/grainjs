# Event Emitters

GrainJS offers a simple `Emitter` class which emits events to a list of listeners. Listeners are
simply functions to call, and "emitting an event" just calls those functions.

This is similar to Backbone events, with more focus on efficiency. Both inserting and removing
listeners is constant time. For example, emitters are used internally to add listeners to
observables.

```typescript
const emitter = new Emitter();                    // Create an emitter
const listener = emitter.addListener(callback);   // Add a listener
listener.dispose();                               // Remove a listener
```

The only way to remove a listener is to dispose the `Listener` object returned by `addListener()`.
When subscribing to an event in a constructor of a disposable object, you would normally use
`autoDispose` to do this automatically:

```typescript
this.autoDispose(fooEmitter.addListener(this._onFoo, this));
```

To emit an event, call `emit()` with any number of arguments:

```typescript
emitter.emit("hello", "world");
```

Note that this is simpler and more limited than, say,
[EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget) or Node's
[EventEmitter](https://nodejs.org/api/events.html#class-eventemitter):
there are no event names or event interfaces. Nevertheless, it is often enough.

Let's say you want to emit events like `cartItemAdded` or `cartItemRemoved`. Simply have two
Emitters:

```ts
const cartItemAdded = new Emitter();
const cartItemRemoved = new Emitter();
```

Some code will call `addListener()` on them, some code will call `emit()`. Using distinct
variables to distingusih the events means less chance for typos in event names, and less work for
the code to dispatch based on event names.

::: info NOTE
Emitters predate some newer parts of GrainJS; it would be good to add proper typings and to
support `Emitter.create(owner)` construct for consistency with other recommendations.
:::
