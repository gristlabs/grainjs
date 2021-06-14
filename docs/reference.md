# Reference

- [DOM Reference](#dom-reference)
- [Disposables Reference](#disposables-reference)
- [Observables Reference](#observables-reference)

## DOM Reference

We refer to the functions like `dom.cls()`, which can be used as arguments to the `dom()` function
as “dom-methods”. These often take an argument of type `BindableValue`, which means
that either a plain value (e.g. string) may be supplied, or an Observable (or Computed) containing
that type, or a “use callback” to create a Computed from (e.g. `use => use(obs1) && use(obs2)`).

Not that all the bindings are one-way: if the supplied value is an observable, the method will
listen to it, and update something about DOM when that observable changes.

### dom.attr _(dom-method)_
```typescript
dom.attr(attrName: string, attrValue: BindableValue<string>)
```

Sets an attribute of a DOM element to the given value. Removes the attribute when the value is
null or undefined.

> For example, `dom('a', dom.attr('href', urlObs))`.

### dom.boolAttr _(dom-method)_
```typescript
dom.boolAttr(attrName: string, boolValue: BindableValue<boolean>)
```

Sets or removes a boolean attribute of a DOM element.

> For example, `dom('button', 'Save', dom.boolAttr('disabled', use => !use(isChangedObs))`.

### dom.text _(dom-method)_
```typescript
dom.text(value: BindableValue<string>)
```

Adds a text node to the element.

> For example, `dom('span', 'Hello, ', dom.text(nameObs))`.

### dom.style _(dom-method)_
```typescript
dom.style(property: string, value: BindableValue<string>)
```

Sets a style property of a DOM element to the given value.

> For example, ``dom('div', dom.style('height', (use) => `${use(heightObs)}px`))``.

### dom.prop _(dom-method)_
```typescript
dom.prop<T>(property: string, value: BindableValue<T>)
```

Sets the property of a DOM element to the given value.

> For example, `dom('input', {type: 'text'}, dom.prop('value', valueObs))`.

### dom.show _(dom-method)_
```typescript
dom.show(boolValue: BindableValue<boolean>)
```

Shows or hides the element depending on a boolean value. Note that the element must be visible
initially (i.e. unsetting the display style should show it).

> For example, `dom('button', 'Save', dom.show(isChangedObs))`.

### dom.hide _(dom-method)_
```typescript
dom.hide(boolValue: BindableValue<boolean>)
```

The opposite of show, hiding the element when boolValue is true.

> For example, `dom('button', 'Save', dom.hide(isUnchangedObs))`.

### dom.cls _(dom-method)_
```typescript
dom.cls(className: string, boolValue?: BindableValue<boolean>)
dom.cls(className: BindableValue<string>)
```

Sets or toggles a CSS class className. If className is an observable, it will be replaced when the
observable changes. If a plain string, then an optional second boolean observable may be given,
which will toggle it.

For example:

  ```typescript
  dom.cls('foo')               // Sets className 'foo'
  dom.cls('foo', isFooObs);    // Toggles 'foo' className according to observable.
  dom.cls(fooClassObs);        // Sets className to the value of fooClassObs.
  ```

### dom.data _(dom-method)_
```typescript
dom.data(key: string, value: BindableValue<any>)
```

Associate arbitrary data with a DOM element. Use `getData()` for retrieving it.

> For example, `dom('li', user.name, dom.data('userId', user.id))`.

### dom.getData
```typescript
dom.getData(elem: Node, key: string): any
```

Returns the value associated with a DOM element using `dom.data()`

> For example, `dom.getData(liElem, 'userId')` will return the value set in the `dom.data()`
> example.

### dom.maybe _(dom-method)_
```typescript
dom.maybe<T>(boolValue: BindableValue<T>, contentFunc: (val: NonNullable<T>) => DomArg)
```

Conditionally appends DOM to an element. The value may be an observable or function (from which a
computed is created), whose value -- if truthy -- will be passed to `contentFunc` which should
return DOM content. If the value is falsy, the previously set DOM content is removed.

Note that if the observable changes between different truthy values, `contentFunc` gets called for
each value, and previous content gets destroyed. To consider all truthy values the same, use an
observable that returns a proper boolean, e.g.
`dom.maybe(use => Boolean(use(fooObs)), () => dom(...))`.

`dom.maybe()` may be used when the argument is not an observable or function, but is pointless.
The following are equivalent when myValue is a boolean, and the latter is preferred for being
simpler.

* `dom(..., dom.maybe(myValue, () => dom(...)));`
* `dom(..., myValue ? dom(...) : null);`

### dom.domComputed _(dom-method)_
```typescript
dom.domComputed<T>(value: BindableValue<T>, contentFunc: (val: T) => DomArg)
dom.domComputed(value: BindableValue<Node>)
```

Appends dynamic DOM content to an element. The value may be an observable or function (from which
a computed is created), whose value will be passed to `contentFunc`, which should return DOM
content. If the `contentFunc` is omitted, it defaults to identity, i.e. it's OK for the observable
or function to return DOM directly.

The DOM content returned may be an element, string, array, or null, or even the result of
`dom.domComputed()` or `dom.maybe()`. Whenever the observable changes, previous content is
disposed and removed, and new content is added in its place.

The following are roughly equivalent:

* (A) `domComputed(nlinesObs, nlines => nlines > 1 ? dom('textarea') : dom('input'));`
* (B) `domComputed(use => use(nlinesObs) > 1 ? dom('textarea') : dom('input'));`
* (C) `domComputed(use => use(nlinesObs) > 1, isTall => isTall ? dom('textarea') : dom('input'));`

Here, (C) is best. Both (A) and (B) would rebuild DOM for any change in nlinesObs, but (C)
encapsulates meaningful changes in the observable, and only recreates DOM when necessary.

Syntax (B), without the second argument, may be useful in cases when DOM depends on several observables, e.g.

```typescript
dom.domComputed(use => use(readonlyObs) ? dom('div') :
      (use(nlinesObs) > 1 ? dom('textarea') : dom('input')));
```

If the argument is not an observable, dom.domComputed() may still be used, but is pointless. The following are equivalent when nlines is a number, and the latter is preferred for being simpler.

* `dom(..., dom.domComputed(nlines, n => (n > 1) ? dom('textarea') : dom('input')));`
* `dom(..., (nlines > 1) ? dom('textarea') : dom('input'));`

### dom.forEach _(dom-method)_
```typescript
dom.forEach<T>(obsArray: Observable<T[]> | T[],
               itemCreateFunc: (item: T) => Node|null)
```

Creates DOM elements for each element of an observable array. As the array is changed, children
are added or removed. This works for any array-valued observable, and for `obsArray()` and
`computedArray()` it works more efficiently for simple changes.

The given `itemCreateFunc()` should return a single DOM node for each item, or null to skip that
item. It is called for new items whenever they are spliced in, or the array replaced. The
`forEach()` owns the created nodes, and runs `domDispose()` on them when they are spliced out.

If the created nodes are removed from their parent externally, `forEach()` will cope with it, but
will consider these elements as no longer owned, and will not run `domDispose()` on them.

Note that `itemCreateFunc()` does not receive an index: an index would only be correct at the time
the item is created, and would not reflect further changes to the array (for a non-changing array,
read on about `Array.map` alternative). If you'd like to map the DOM node back to its source item,
use `dom.data()` and `dom.getData()` in `itemCreateFunc`.

When used with a plain array (rather than an observable), `dom.forEach` is equivalent to a plain
`Array.map` (recall that an array of nodes is a valid argument to the `dom()` function). For
instance, the following are equivalent:

* `dom('ul', dom.forEach(['a', 'b', 'c'], (item) => dom('li', item)))`
* `dom('ul', ['a', 'b', 'c'].map(item => dom('li', item)))`


### dom.create _(dom-method)_
```typescript
dom.create(funcOrClass, ...args: any[]): DomContents
```

Creates a class- or function-based DOM component, and arranges for the containing DOM element to
take ownership of it.

For example:
```typescript
dom('div',
  dom.create(MyWidget, ...myArgs),        // Calls MyWidget.create(owner, ...myArgs)
  dom.create(createMyWidget, ...myArgs),  // Calls createMyWidget(owner, ...myArgs)
)
```


### dom.on _(dom-method)_
```typescript
dom.on(eventType: string,
       callback: (ev: Event, elem: EventTarget) => void,
       {useCapture = false} = {})
```

Listen to the given event type.

> For example: `dom('button', dom.on('click', (ev, elem) => { ... }));`

The callback is called with the event and the element to which it was attached. Unlike in JQuery’s
`on()` method, the callback's return value is ignored. Use `event.stopPropagation()` and
`event.preventDefault()` explicitly if needed.

### dom.onElem
```typescript
dom.onElem(elem: EventTarget, eventType: string,
       callback: (ev: Event, elem: EventTarget) => void,
       {useCapture = false} = {}): IDisposable
```

Like `dom.on()`, but for use as a standalone function rather than a dom-method.

Listen to the given event on the given element. This returns a listener which may be disposed to stop listening.

> For example: `const listener = dom.onElem(elem, 'click', (event, elem) => { ... });`.
Then, to stop listening: `listener.dispose();`

Disposing the listener returned by `onElem()` is the only way to stop listening to an event.

You can use `autoDispose` to stop listening automatically when subscribing inside a `Disposable`
object. For example: `this.autoDispose(dom.onElem(document, 'mouseup', callback))`.

### dom.onMatch _(dom-method)_
```typescript
dom.onMatch(selector: string, eventType: string,
            callback: (ev: Event, elem: EventTarget) => void,
            {useCapture = false} = {})
```

Listen to descendants of an element matching the given selector. This is what JQuery calls
[delegated events](http://api.jquery.com/on/)). The element passed to the callback will be a
DOM elemenet matching the given selector. If there are multiple matches, the callback is only
called for the innermost one.

For example:

```typescript
dom('ul',
    dom.forEach(items, item => dom('li', item.name)),
    dom.onMatch('li', 'click', (ev, elem) => { ... })
)
```

This attaches a single event handler to the `<UL>` element, which gets triggered whenever a click
target is one of the `<LI>` elements inside it.


### dom.onMatchElem
```typescript
dom.onMatchElem(elem: EventTarget, selector: string, eventType: string,
       callback: (ev: Event, elem: EventTarget) => void,
       {useCapture = false} = {}): IDisposable
```

Like `dom.onMatch()`, but for use as a standalone function rather than a dom-method.

Listen to descendants of the given element matching the given selector. See `dom.onMatch` for
details. This returns a listener which may be disposed to stop listening.


### dom.onKeyPress, dom.onKeyDown _(dom-method)_
```typescript
dom.onKeyPress(keyHandlers: {[key]: (event, elem) => void})
dom.onKeyDown(keyHandlers: {[key]: (event, elem) => void})
```

Listen to keyboard events, triggering callbacks corresponding to requested keys.

The keys of the passed-in object are the
[Key Values](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values).
Normally, handled events are stopped from bubbling with `stopPropagation()` and
`preventDefault()`. If, however, you register a key with a `"$"` suffix (i.e. `"Enter$"` instead
of `"Enter"`), then the event is allowed to bubble normally.

For example:

```typescript
dom('input', {type: 'text'},
  dom.onKeyDown({
    Enter: (ev, elem) => console.log("Enter pressed"),
    Escape: (ev, elem) => console.log("Escape pressed"),
    Delete$: (ev, elem) => console.log("Delete pressed, will bubble"),
  })
)
```

This method also ensures that `tabindex` attribute is set (and sets it to -1 if not yet set), to
allow this element to receive keyboard events.

### dom.onKeyElem
```typescript
dom.onKeyElem(elem: HTMLElement, eventType: KeyEventType,
    keyHandlers: {[key]: (ev, elem) => void},
): IDisposable;
```

Standalone method to listen to keyboard events (typically "keydown" or "keypress"), with specified
per-key callbacks. This returns a listener which may be disposed to stop listening.

See `dom.onKeyPress()` / `dom.onKeyDown()` for details.

### dom
```typescript
dom(tagString: string, ...args: DomArg[]): Element
```

The first argument is a string consisting of a tag name, with optional `#foo` suffix
to add the ID `'foo'`, and zero or more `.bar` suffixes to add a CSS class `'bar'`.

Note that better typings are available when a tag is used directly, e.g.
* `dom('input', {id: 'foo'}, (elem) => ...)` --> elem has type HTMLInputElement
* `dom('input#foo',          (elem) => ...)` --> elem has type HTMLElement

The rest of the arguments are optional and may be:

  * Nodes - which become children of the created element;
  * strings - which become text node children;
  * objects - of the form {attr: val} to set additional attributes on the element;
  * Arrays - which are flattened with each item processed recursively;
  * functions - which are called with elem as the argument, for a chance to modify the
      element as it's being created. Return values are processed recursively.
  * "dom methods" - expressions such as `dom.attr('href', url)` or `dom.hide(obs)`, which
      are actually special cases of the "functions" category.

### dom.svg
```typescript
dom.svg(tagString: string, ...args: DomArg[]): Element
```

Same as dom(...), but creates an SVG element.

### dom.update
```typescript
dom.update(elem: Element, ...args: DomArg[]): Element
```

Updates an existing element with any number of arguments, as documented in `dom()`.

### dom.frag
```typescript
dom.frag(...args: DomArg[]): DocumentFragment
```

Creates a DocumentFragment processing arguments the same way as the `dom()` function.

### dom.find
```typescript
dom.find(selector: string)
```

Alias for `document.querySelector`.

### dom.findAll
```typescript
dom.findAll(selector: string)
```

Alias for `document.querySelectorAll`.

### makeTestId
```typescript
makeTestId(prefix: string): TestId
```

A very simple setup to identify DOM elements for testing purposes. Here's a possible
usage.

```typescript
const testId = enableTesting ? makeTestId('test-xyz-') : noTestId;

dom('div', testId("some-name"),
  dom('button', testId("some-button"), ...)
)
```

This simply adds CSS classes like `"test-xyz-some-name"` and `"test-xyz-some-button"` to the
corresponding elements when `enableTesting` is true, to allow identifying these elements in
browser tests.

This is intentionally separate from CSS classes, so that it would not get used for CSS purposes. A
testId should not affect application behavior at all. See also `noTestId`.


### noTestId
```typescript
const noTestId: TestId
```

May be used in place of `makeTestId(...)`, to make `testId()` calls into no-ops. See
[makeTestId](#makeTestId).

### styled
```typescript
styled(tag: TagName, styles: string): DomCreateFunc<TagElem<Tag>> & IClsName;
styled(creator: (...args: any[]) => R, styles: string): typeof creator & IClsName;
```

Register a styled element. See [styling dom](basics.md#styling-dom).

### keyframes
```typescript
keyframes(styles: string): string
```

Produces a string with the generated name, for a new `@keyframes` element. Note that it does
not support nesting or ampersand (&) handling, since these would be difficult and are entirely
unneeded. See [styling dom](basics.md#styling-dom).



## Disposables Reference

See code for documentation.

* Disposable
* Holder
* MultiHolder

* dom.domDispose
* dom.onDisposeElem
* dom.onDispose
* dom.autoDisposeElem
* dom.autoDispose

## Observables Reference

See code for documentation.

* bundleChanges
* Observable
* observable
* obsHolder
* Computed
* computed
* Computed#onWrite
* PureComputed
* pureComputed
* subscribe

* ObsArray
* MutableObsArray
* obsArray
* ComputedArray
* computedArray
* makeLiveIndex

## UI Reference

See code for documentation.

* input
* select
