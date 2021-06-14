# Miscellaneous

- [Event Emitters](#event-emitters)
- [Disposing DOM](#disposing-dom)
- [DOM Components](#dom-components)
  - [Functional Components](#functional-components)
- [Knockout Integration](#knockout-integration)

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

(NOTE: Emitters predate some newer parts of GrainJS; it would be good to add proper typings and to
support `Emitter.create(owner)` construct for consistency with other recommendations.)


# Disposing DOM

Sometimes, when you create DOM, you may want to run some cleanup when that DOM element is removed
from the page. For this, you may use `dom.onDispose()` and `dom.autoDispose()` functions.

For example:

```typescript
function buildLink(isBigObs: Observable<boolean>) {
  const isSmallObs = Computed.create(null, use => !use(isBigObs));
  return dom('a',
    dom.autoDispose(isSmallObs),
    dom.onDispose(() => console.log("Good bye, link!")),
    dom.cls('small-link', isSmallObs),
    ...
  );
}
```

This function builds and returns a DOM element. When this element is _disposed_, it will log the
`"Good bye, link!"` message, and will run `isSmallObs.dispose()`, which is important to avoid a
leak (what else would have the responsibility to dispose `isSmallObs`?)

(By the way, in this case, you could use `dom.cls('small-link', use => !use(isBigObs))`. Then you
don't need `isSmallObs`, and there is nothing to dispose.)

When we say that an element is _disposed_, that's a special step that needs to be run on DOM
elements. Directly, this step could be invoked as:

```typescript
dom.domDispose(node);
```

which would run disposers associated with `node` or with any of its descendants. Descendants are
processed first. The `domDispose` function is automatically called by GrainJS methods such as
`dom.maybe()` or `dom.forEach()` which create and remove DOM elements. It is also called
automatically if some function argument to `dom()` function throws an exception during element
creation. This way any disposers associated with the unfinished element get called.


# DOM Components

It's convenient to group a component's state, logic, and DOM into a single class.

Here's a simple temperature-converting example:

```typescript
class TCalculator extends Disposable {
  private _celsius = Observable.create(this, this._initialValue);
  private _fahrenheit = Computed.create(this, use => (use(this._celsius) * 9 / 5) + 32);

  constructor(private _initialValue: number = 100) { super(); }

  public buildDom() {
    return dom('div',
      dom('p',
        `Enter temperature in Celsius',
        dom('input', {type: 'text'}, dom.on('input', (ev, elem) => this._celsius.set(elem.value))),
      ),
      dom('p', 'Result in Fahrenheit: ',
        dom.text(this._fahrenheit)
      ),
    );
  }
}
```

Such a class, which extends `Disposable`, and provides a public `buildDom()` method, is called a
"DOM component". We can instantiate this component and insert its DOM into another element by
using `dom.create()`:

```typescript
dom('div', dom.create(TCalculator, 25))         // CORRECT USAGE
```

Essentially, this is similar to the following:

```typescript
dom('div', (new TCalculator(25)).buildDom())    // NON-EXAMPLE
```

The difference is with disposal: using `dom.create()` ensures that the created DOM component will
get disposed when the DIV is cleaned up, as well as in case of any exceptions that may occur
during DOM construction.

The `.buildDom()` method of a DOM component is called exactly once, right after the constructor,
and may return a Node, an array, or any content which may be added to the `dom()` function. All
the returned DOM will be disposed when the containing elemenet is disposed, followed by the
component instance itself.

## Functional Components

In an analogy to the distinction between React's "class components" and "functional components",
`dom.create()` may be used with a function. Its purpose, again, is to help with taking
responsibility for resource (i.e. disposing them when appropriate), and really there is not much
else to it.

Here's a tweaked example from above:

```typescript
function buildLink(owner: IDisposableOwner, isBigObs: Observable<boolean>) {
  const isSmallObs = Computed.create(owner, use => !use(isBigObs));
  return dom('a',
    dom.cls('small-link', isSmallObs),
    ...
  );
}

dom('div', dom.create(buildLink, isBigObs))
```

Note how we can create a `Computed` with an owner, and not have to worry about disposing it when
DOM is cleaned up.

The presence of the `owner` argument is the difference between `dom.create(buildLink, ...)` and
`buildLink(...)`. As with class-based DOM components, `dom.create()` takes the responsibility of
cleanup by creating a `MultiHolder` (see [Holders](dispose.md#holders)) which it promises to
dispose, and calling the passed-in function with it as the first argument.

In both cases, `dom.create` arranges for the DOM element to which the component is attached to be
the logical owner of the component. When the DOM element is disposed, so is the component.


# Knockout Integration

## Integrating Observables

GrainJS observables and computeds can work side by side with those from Knockout.js (which served as their inspiration).

```typescript
import {fromKo} from 'grainjs';

fromKo(koObservable);
```

This returns a GrainJS observable that mirrors the passed-in Knockout observable (which may be a
computed as well). Similarly,

```typescript
import {toKo} from 'grainjs';
import * as ko from 'knockout';

toKo(ko, grainObservable)
```

This returns a Knockout.js observable that mirrows the passed-in Grain observable or computed.
Note that `toKo()` must tbe called with the knockout module as an argument. This is to avoid
adding Knockout as a dependency of GrainJS.

In both cases, calling `fromKo`/`toKo` twice on the same observable will return the same wrapper,
and subscriptions and disposal are appropriately set up to make usage seamless. In particular, the
returned wrapper should not be disposed; it's tied to the lifetime of the wrapped object.

## Integrating DOM Disposal

When mixing libraries, such as GrainJS, Knockout, or JQuery, DOM may be created by different
libraries, and each has some provisions for cleaning up state associated with the DOM.

While GrainJS has `domDispose()`, Knockout does cleanup in `ko.cleanNode` and
`ko.removeNode`
(see [custom disposal logic](https://knockoutjs.com/documentation/custom-bindings-disposal.html)),
and JQuery in [remove()](https://api.jquery.com/remove/) and [empty()](https://api.jquery.com/empty/).

On removing a DOM element from the page, it's important to run all associated disposers, since
different descendants of an element, and even a single element, may have associated state from
different libraries.

GrainJS supports such integration:

```typescript
import {setupKoDisposal} from 'grainjs';
import * as ko from 'knockout';

setupKoDisposal(ko);
```

This sets up integration between GrainJS and Knockout disposal. Knockout happens to take care of
JQuery cleanup too if needed. Once called, a cleanup by Knockout will run GrainJS disposers, and
`dom.domDispose()` will run Knockout disposers.
