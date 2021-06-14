# Reference

- [DOM Reference](#dom-reference)
- [Disposables Reference](#disposables-reference)
- [Observables Reference](#observables-reference)

## DOM Reference

We refer to the functions like `dom.cls()`, which can be used as arguments to the `dom()` function
as “dom methods”. Here’s a reference of what is available. The type `BindableValue` means
that either a plain value (e.g. string) may be supplied, or an Observable (or Computed) containing
that type, or a “use callback” to create a Computed from (e.g. `use => use(obs1) && use(obs2)`).

Not that all the bindings are one-way: if the supplied value is an observable, the method will
listen to it, and update something about DOM when that observable changes.

```typescript
dom.**attr**(attrName: string, attrValue: BindableValue<string>)
```

Sets an attribute of a DOM element to the given value. Removes the attribute when the value is null or undefined.
For example, dom('a', dom.attr('href', urlObs)).

dom.*boolAttr*(attrName: string, boolValue: BindableValue<boolean>)

Sets or removes a boolean attribute of a DOM element.
For example, dom('button', 'Save', dom.boolAttr('disabled', use => !use(isChangedObs)).

dom.*text*(value: BindableValue<string>)

Adds a text node to the element.
For example, dom('span', 'Hello, ', dom.text(nameObs)).

dom.*style*(property: string, value: BindableValue<string>)

Sets a style property of a DOM element to the given value.
For example, dom('div', dom.style('height', (use) => `${use(heightObs)}px`)).

dom.*prop*<T>(property: string, value: BindableValue<T>)

Sets the property of a DOM element to the given value.
For example, dom('input', {type: 'text'}, dom.prop('value', valueObs)).

dom.*show*(boolValue: BindableValue<boolean>)

Shows or hides the element depending on a boolean value. Note that the element must be visible initially (i.e. unsetting the display style should show it).
For example, dom('button', 'Save', dom.show(isChangedObs)).

dom.*hide*(boolValue: BindableValue<boolean>)

The opposite of show, hiding the element when boolValue is true.
For example, dom('button', 'Save', dom.hide(isUnchangedObs)).

dom.*cls*(className: string, boolValue?: BindableValue<boolean>)
dom.*cls*(className: BindableValue<string>)

Sets or toggles a CSS class className. If className is an observable, it will be replaced when the observable changes. If a plain string, then an optional second boolean observable may be given, which will toggle it.

For example:

    * dom.cls('foo')               // Sets className 'foo'
    * dom.cls('foo', isFooObs);    // Toggles 'foo' className according to observable.
    * dom.cls(fooClassObs);        // Sets className to the value of fooClassObs. 

dom.*data*(key: string, value: BindableValue<any>)

Associate arbitrary data with a DOM element. Use getData() for retrieving it.
For example, dom('li', user.name, dom.data('userId', user.id)).

* dom.*getData*(elem: Node, key: string): any

Later when the <LI> element is available (perhaps in an event handler), dom.getData(liElem, 'userId') will return the associated value.

dom.*maybe*<T>(boolValue: BindableValue<T>, contentFunc: (val: NonNullable<T>) => DomArg)

Conditionally appends DOM to an element. The value may be an observable or function (from which a computed is created), whose value -- if truthy -- will be passed to contentFunc which should return DOM content. If the value is falsy, previously set DOM content is removed.

Note that if the observable changes between different truthy values, contentFunc gets called for each value, and previous content gets destroyed. To consider all truthy values the same, use an observable that returns a proper boolean, e.g. dom.maybe(use => Boolean(use(fooObs)), () => dom(...));

dom.maybe() may be used when the argument is not an observable or function, but is pointless. The following are equivalent when myValue is a boolean, and the latter is preferred for being simpler.

    * dom(..., dom.maybe(myValue, () => dom(...)));
    * dom(..., myValue ? dom(...) : null);

dom.*domComputed*<T>(value: BindableValue<T>, contentFunc: (val: T) => DomArg)
dom.*domComputed*(value: BindableValue<Node>)

Appends dynamic DOM content to an element. The value may be an observable or function (from which a computed is created), whose value will be passed to contentFunc, which should return DOM content. If the contentFunc is omitted, it defaults to identity, i.e. it's OK for the observable or function to return DOM directly.

The DOM content returned may be an element, string, array, or null, or even the result of dom.domComputed() or dom.maybe(). Whenever the observable changes, previous content is disposed and removed, and new content is added in its place.

The following are roughly equivalent:

* (A) domComputed(nlinesObs, nlines => nlines > 1 ? dom('textarea') : dom('input'));
    (B) domComputed(use => use(nlinesObs) > 1 ? dom('textarea') : dom('input'));
    (C) domComputed(use => use(nlinesObs) > 1,
          isTall => isTall ? dom('textarea') : dom('input'));

Here, (C) is best. Both (A) and (B) would rebuild DOM for any change in nlinesObs, but (C) encapsulates meaningful changes in the observable, and only recreates DOM when necessary.

Syntax (B), without the second argument, may be useful in cases when DOM depends on several observables, e.g.

* dom.domComputed(use => use(readonlyObs) ? dom('div') :
      (use(nlinesObs) > 1 ? dom('textarea') : dom('input')));

If the argument is not an observable, dom.domComputed() may still be used, but is pointless. The following are equivalent when nlines is a number, and the latter is preferred for being simpler.

    * dom(..., dom.domComputed(nlines, n => (n > 1) ? dom('textarea') : dom('input')));
    * dom(..., (nlines > 1) ? dom('textarea') : dom('input'));

dom.*forEach*<T>(obsArray: Observable<T[]> | T[],
               itemCreateFunc: (item: T) => Node|null)

Creates DOM elements for each element of an observable array. As the array is changed, children are added or removed. This works for any array-valued observable, and for obsArray() and computedArray() it works more efficiently for simple changes.

The given itemCreateFunc() should return a single DOM node for each item, or null to skip that item. It is called for new items whenever they are spliced in, or the array replaced. The forEach() owns the created nodes, and runs domDispose() on them when they are spliced out.

If the created nodes are removed from their parent externally, forEach() will cope with it, but will consider these elements as no longer owned, and will not run domDispose() on them.

Note that itemCreateFunc() does not receive an index: an index would only be correct at the time the item is created, and would not reflect further changes to the array (for a non-changing array, read on about Array.map alternative). If you'd like to map the DOM node back to its source item, use dom.data() and dom.getData() in itemCreateFunc.

When used with a plain array (rather than an observable), dom.forEach is equivalent to a plain Array.map (recall that an array of nodes is a valid argument to the dom() function). For instance, the following are equivalent:

    * dom('ul', dom.forEach(['a', 'b', 'c'], (item) => dom('li', item)))
    * dom('ul', ['a', 'b', 'c'].map(item => dom('li', item)))

DOM Events Reference

dom.*on*(eventType: string,
       callback: (ev: Event, elem: EventTarget) => void,
       {useCapture = false} = {})

Listen to the given event type.
For example: dom('button', dom.on('click', (ev, elem) => { ... }));

The callback is called with the event and the element to which it was attached. Unlike in JQuery’s on() method, the callback's return value is ignored. Use event.stopPropagation() and event.preventDefault() explicitly if needed.

dom.*onElem*(elem: EventTarget, eventType: string,
       callback: (ev: Event, elem: EventTarget) => void,
       {useCapture = false} = {}): IDisposable

Like dom.on(), but for use as a standalone function rather than a dom-method.
Listen to the given event on the given element. This returns a listener which may be disposed to stop listening.
For example: let listener = dom.onElem(elem, 'click', (event, elem) => { ... });
Then, to stop listening: listener.dispose();

Disposing the listener returned by onElem() is the only way to stop listening to an event.

You can use autoDispose to stop listening automatically when subscribing inside a Disposable object. For example: this.autoDispose(dom.onElem(document, 'mouseup', callback)).

dom.*onMatch*(selector: string, eventType: string,
            callback: (ev: Event, elem: EventTarget) => void,
            {useCapture = false} = {})

Listen to descendants of an element matching the given selector. This is what JQuery calls "delegated events", see http://api.jquery.com/on/). The element passed to the callback will be a DOM elemenet matching the given selector. If there are multiple matches, the callback is only called for the innermost one.

For example:

* dom('ul',
      dom.forEach(items, item => dom('li', item.name)),
      dom.onMatch('li', 'click', (ev, elem) => { ... })
    )

This attaches a single event handler to the <UL> element, which gets triggered whenever a click target is one of the <LI> elements inside it.


dom.*onMatchElem*(elem: EventTarget, selector: string, eventType: string,
       callback: (ev: Event, elem: EventTarget) => void,
       {useCapture = false} = {}): IDisposable

Like dom.onMatch(), but for use as a standalone function rather than a dom-method.
Listen to descendants of the given element matching the given selector. See dom.onMatch for details. This returns a listener which may be disposed to stop listening.


dom.*onKeyPress*(keyHandlers: {[key]: (event, elem) => void})
dom.*onKeyDown*(keyHandlers: {[key]: (event, elem) => void})

Listen to keyboard events, triggering callbacks corresponding to requested keys.

The keys of the passed-in object are the Key Names (https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values). Normally, handled events are stopped from bubbling with stopPropagation() and preventDefault(). If, however, you register a key with a "$" suffix (i.e. "Enter$" instead of "Enter"), then the event is allowed to bubble normally.

For example:

* dom('input', {type: 'text'},
      dom.onKeyDown({
         Enter: (ev, elem) => console.log("Enter pressed"),
        Escape: (ev, elem) => console.log("Escape pressed"),
        Delete$: (ev, elem) => console.log("Delete pressed, will bubble"),
       })
    )

This method also ensures that tabindex attribute is set (and sets it to -1 if not yet set), to allow this element to receive keyboard events.

dom.*onKeyElem*(elem: HTMLElement, eventType: KeyEventType,
    keyHandlers: {[key]: (ev, elem) => void},
): IDisposable;

Standalone method to listen to keyboard events (typically "keydown" or "keypress"), with specified per-key callbacks. This returns a listener which may be disposed to stop listening.

See dom.onKeyPress() / dom.onKeyDown() for details.







## Disposables Reference

## Observables Reference
