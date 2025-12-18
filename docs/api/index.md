# API Reference
- [DOM reference](#dom-reference)
- [Disposable reference](#disposable-reference)
- [Observables reference](#observables-reference)
- [Other](#other)
- [Misc Types](#misc-types)
## DOM reference {#dom-reference}

We refer to the functions like `dom.cls()`, which can be used as arguments to the `dom()`
function as "dom-methods". These often take an argument of type `BindableValue`, which means
that either a plain value (e.g. string) may be supplied, or an `Observable` (or `Computed`)
containing that type, or a "use callback" to create a `Computed` from
(e.g. `use => use(obs1) && use(obs2)`).

Note that all the bindings are one-way: if the supplied value is an observable, the method will
listen to it, and update something about DOM when that observable changes.

### dom {#dom}
```ts refs=TagName=grainjs!TagName:type|IDomArgs=grainjs!IDomArgs:interface|TagElem=grainjs!TagElem:type|TagElem=grainjs!TagElem:type
dom<Tag extends TagName>(tagString: Tag, ...args: IDomArgs<TagElem<Tag>>): TagElem<Tag>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dom.ts" target="_blank">Defined in dom.ts</a></div>

`dom()` provides a way to build a DOM tree easily.

The first argument is a string consisting of a lowercase tag name (e.g. `"div"`), with optional `"#foo"` suffix to add the ID `'foo'`, and zero or more `".bar"` suffixes to add a CSS class `'bar'`.

The rest of the arguments are optional and may be any number, of these types:

| Parameter | Description |
| --- | --- |
| `Nodes` | become children of the created element |
| `strings` | become text node children |
| `objects` | Literal objects to set string attributes on the element. E.g. `{title: "foo"}`. |
| `null` | The values `null` and `undefined` values are ignored completely. |
| `Arrays` | flattened with each item processed recursively |
| `functions` | called with the element being built as the argument, for a chance to modify the element as it's being created. Return values are processed recursively. |
| `functions` | "dom methods" are a expressions such as `dom.attr('href', url)` or `dom.hide(obs)`, which are special cases of the "functions" category. |


::: info Example

```ts
import {dom} from 'grainjs';
dom('a', {href: url, className: 'myclass'}, 'Hello ', dom('strong', 'world'));
```

creates HTML element `<a href={{url}} class="myclass">Hello <strong>world</strong></a>`.

:::

::: info Example

Here's an example equivalent to the one above, using dom methods `dom.cls`, `dom.attr`, `dom.text`. In reality, these methods are useful with observable values rather than constant strings.
```ts
 dom('a', dom.attr('href', url), dom.cls('myclass'),
     dom.text('Hello '), dom('strong', dom.text('world')));
```


:::

::: info See

[DOM & Observables](/basics).

:::

### dom.attr {#attr}
```ts refs=BindableValue=grainjs!BindableValue:type|DomElementMethod=grainjs!DomElementMethod:type
attr(attrName: string, attrValueObs: BindableValue<string | null | undefined>): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets an attribute of a DOM element to the given value. Removes the attribute when the value is null or undefined.

::: info Example

```ts
dom('a', dom.attr('href', urlObs))
```


:::

### dom.attrElem {#attrElem}
```ts refs=Element=mdn#Element
attrElem(elem: Element, attrName: string, attrValue: string | null | undefined): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets an attribute of a DOM element to the given value. Removes the attribute when the value is null or undefined.

| Parameter | Description |
| --- | --- |
| `elem` | The element to update. |
| `attrName` | The name of the attribute to bind, e.g. 'href'. |
| `attrValue` | The string value, or null or undefined to remove the attribute. |


### dom.attrs {#attrs}
```ts refs=IAttrObj=grainjs!IAttrObj:interface|DomElementMethod=grainjs!DomElementMethod:type
attrs(attrsObj: IAttrObj): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets multiple attributes of a DOM element. Null and undefined values are omitted, and booleans are either omitted or set to empty string.

### dom.attrsElem {#attrsElem}
```ts refs=Element=mdn#Element|IAttrObj=grainjs!IAttrObj:interface
attrsElem(elem: Element, attrsObj: IAttrObj): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets multiple attributes of a DOM element. Null and undefined values are omitted, and booleans are either omitted or set to empty string.

| Parameter | Description |
| --- | --- |
| `attrsObj` | Object mapping attribute names to attribute values. |


### dom.boolAttr {#boolAttr}
```ts refs=BindableValue=grainjs!BindableValue:type|DomElementMethod=grainjs!DomElementMethod:type
boolAttr(attrName: string, boolValueObs: BindableValue<boolean>): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Dom-method that sets or removes a boolean attribute of a DOM element.

| Parameter | Description |
| --- | --- |
| `attrName` | The name of the attribute to bind, e.g. 'checked'. |
| `boolValueObs` | Value, observable, or function for a whether to set or unset the attribute. |


### dom.boolAttrElem {#boolAttrElem}
```ts refs=Element=mdn#Element
boolAttrElem(elem: Element, attrName: string, boolValue: boolean): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets or removes a boolean attribute of a DOM element. According to the spec, empty string is a valid true value for the attribute, and the false value is indicated by the attribute's absence.

| Parameter | Description |
| --- | --- |
| `elem` | The element to update. |
| `attrName` | The name of the attribute to bind, e.g. 'checked'. |
| `boolValue` | Boolean value whether to set or unset the attribute. |


### dom.cls {#cls}
```ts refs=BindableValue=grainjs!BindableValue:type|DomElementMethod=grainjs!DomElementMethod:type|BindableValue=grainjs!BindableValue:type|DomElementMethod=grainjs!DomElementMethod:type
cls(className: string, boolValue?: BindableValue<boolean>): DomElementMethod;
cls(className: BindableValue<string>): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets or toggles a css class className. If className is an observable, it will be replaced when the observable changes. If a plain string, then an optional second boolean observable may be given, which will toggle it.
```ts
dom.cls('foo')                                // Sets className 'foo'
dom.cls('foo', isFoo);                        // Toggles 'foo' className according to observable.
dom.cls('foo', (use) => use(isFoo));          // Toggles 'foo' className according to observable.
dom.cls(fooClass);                            // Sets className to the value of fooClass observable
dom.cls((use) => `prefix-${use(fooClass)}`);  // Sets className to prefix- plus fooClass observable.
```


### dom.clsElem {#clsElem}
```ts refs=Element=mdn#Element
clsElem(elem: Element, className: string, boolValue?: boolean): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets or toggles the given css class className.

### dom.clsPrefix {#clsPrefix}
```ts refs=BindableValue=grainjs!BindableValue:type|DomElementMethod=grainjs!DomElementMethod:type|BindableValue=grainjs!BindableValue:type|DomElementMethod=grainjs!DomElementMethod:type
clsPrefix(prefix: string, className: string, boolValue?: BindableValue<boolean>): DomElementMethod;
clsPrefix(prefix: string, className: BindableValue<string>): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Just like cls() but prepends a prefix to className, including when it is an observable.

### dom.create {#create}
```ts refs=IDomCreator=grainjs!IDomCreator:type|DomCreatorArgs=grainjs!DomCreatorArgs:type|DomContents=grainjs!DomContents:type
create<Fn extends IDomCreator<any[]>>(fn: Fn, ...args: DomCreatorArgs<Fn>): DomContents;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domComponent.ts" target="_blank">Defined in domComponent.ts</a></div>

UI components that can be inserted into `dom()`.

Components are created and inserted using `dom.create()`:
```ts
dom('div',
  dom.create(MyWidget, ...myArgs),        // Calls MyWidget.create(owner, ...myArgs)
  dom.create(createMyWidget, ...myArgs),  // Calls createMyWidget(owner, ...myArgs)
)
```

The first argument may be a function, which is called directly, or a class with a `.create()` static method, in which case that's what gets called.

In both cases, the call gets a first argument of `owner` followed by the rest of the arguments to `dom.create()`. The `owner` is a `MultiHolder` that will own this component. This works naturally with any class that derives from Disposable, since it then has a suitable static `create()` method.

Function-based components may use owner to easily handle disposal. For example:
```ts
dom.create(createMyWidget)
function createMyWidget(owner) {
  const foo = Foo.create(owner);
  return dom('div', foo.getTitle());
}
```

The `owner` argument is the main benefit of `dom.create()`. Logically, the owner is the DOM where the component is attached. When the parent DOM element is disposed, so is the component.

:::info Explanation

To understand why the syntax is such, consider a potential alternative such as:
```ts
dom('div', _insert_(new Comp1()), _insert_(new Comp2(...args)))
```

In both cases, the constructor for Comp1 runs before the constructor for Comp2. What happens when Comp2's constructor throws an exception? In the second case, nothing yet owns the created Comp1 component, and it will never get cleaned up. With `dom.create()`, the DOM gets ownership of Comp1 early enough and will dispose it.

:::

A function component may return DOM directly. A class component returns the class instance, which must have a `.buildDom()` method which will be called right after the constructor to get the DOM. Note that buildDom is only called once.

A function component may also return an object with `.buildDom()`. So these are equivalent:
```ts
dom.create(MyWidget)
dom.create((owner) => MyWidget.create(owner))
```

Note that ownership should be handled using the `owner` argument. Don't do this:
```ts
// NON-EXAMPLE: Nothing will dispose the created object:
// dom.create(() => new MyWidget());
```

The returned DOM may includes Nodes, strings, and `domComputed()` values, as well as arrays of any of these. In other words, any `DomArg` goes except `DomMethods`. All the DOM returned will be disposed when the containing element is disposed, followed by the `owner` itself.

### dom.data {#data}
```ts refs=BindableValue=grainjs!BindableValue:type|DomMethod=grainjs!DomMethod:type
data(key: string, valueObs: BindableValue<any>): DomMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Associate arbitrary data with a DOM element: `value` may be an observable or a function.

| Parameter | Description |
| --- | --- |
| `key` | Key to identify this piece of data among others attached to elem. |
| `value` | Arbitrary value to associate with elem. |


### dom.dataElem {#dataElem}
```ts refs=Node=mdn#Node
dataElem(elem: Node, key: string, value: any): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Associate arbitrary data with a DOM element.

| Parameter | Description |
| --- | --- |
| `elem` | The element with which to associate data. |
| `key` | Key to identify this piece of data among others attached to elem. |
| `value` | Arbitrary value to associate with elem. |


### dom.domComputed {#domComputed}
```ts refs=BindableValue=grainjs!BindableValue:type|Exclude=tsutil#excludeuniontype-excludedmembers|DomArg=grainjs!DomArg:type|DomMethod=grainjs!DomMethod:type|DomComputed=grainjs!DomComputed:type|BindableValue=grainjs!BindableValue:type|DomContents=grainjs!DomContents:type|DomComputed=grainjs!DomComputed:type
domComputed(valueObs: BindableValue<Exclude<DomArg, DomMethod>>): DomComputed;
domComputed<T>(valueObs: BindableValue<T>, contentFunc: (val: T) => DomContents): DomComputed;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

Appends dynamic DOM content to an element. The value may be an observable or function (from which a computed is created), whose value will be passed to `contentFunc` which should return DOM content. If the contentFunc is omitted, it defaults to identity, i.e. it's OK for the observable or function to return DOM directly.

The DOM content returned may be an element, string, array, or null. Whenever the observable changes, previous content is disposed and removed, and new content added in its place.

The following are roughly equivalent:
```ts
// (A)
domComputed(nlinesObs, nlines => nlines > 1 ? dom('textarea') : dom('input'))
// (B)
domComputed(use => use(nlinesObs) > 1 ? dom('textarea') : dom('input'))
// (C)
domComputed(use => use(nlinesObs) > 1, isTall => isTall ? dom('textarea') : dom('input'))
```

Here, (C) is best. Both (A) and (B) would rebuild DOM for any change in nlinesObs, but (C) encapsulates meaningful changes in the observable, and only recreates DOM when necessary.

Syntax (B), without the second argument, may be useful in cases of DOM depending on several observables, e.g.
```ts
domComputed(use => use(readonlyObs) ? dom('div') :
    (use(nlinesObs) > 1 ? dom('textarea') : dom('input')))
```

If the argument is not an observable, `domComputed()` may but should not be used. The following are equivalent:
```ts
dom(..., domComputed(listValue, list => `Have ${list.length} items`), ...);
dom(..., `Have ${listValue.length} items`, ...);
```

In this case, the latter is preferred as the clearly simpler one.

| Parameter | Description |
| --- | --- |
| `valueObs` | Observable or function for a computed. |
| `contentFunc` | Function called with the result of valueObs as the input, and returning DOM as output. If omitted, defaults to the identity function. |


### dom.domComputedOwned {#domComputedOwned}
```ts refs=BindableValue=grainjs!BindableValue:type|MultiHolder=grainjs!MultiHolder:class|DomContents=grainjs!DomContents:type|DomComputed=grainjs!DomComputed:type
domComputedOwned<T>(valueObs: BindableValue<T>, contentFunc: (owner: MultiHolder, val: T) => DomContents): DomComputed;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

Like domComputed(), but the callback gets an additional first argument, owner, which may be used to take ownership of objects created by the callback. These will be disposed before each new call to the callback, and when the containing DOM is disposed.

`domComputedOwned(valueObs, (owner, value) => Editor.create(owner, value).renderSomething())`

### dom.find {#find}
```ts refs=Element=mdn#Element
find(selector: string): Element | null;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

Find the first element matching a selector; just an abbreviation for document.querySelector().

### dom.findAll {#findAll}
```ts refs=NodeListOf=mdn#NodeList|Element=mdn#Element
findAll(selector: string): NodeListOf<Element>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

Find all elements matching a selector; just an abbreviation for document.querySelectorAll().

### dom.forEach {#forEach}
```ts refs=MaybeObsArray=grainjs!MaybeObsArray:type|Node=mdn#Node|DomContents=grainjs!DomContents:type
forEach<T>(obsArray: MaybeObsArray<T>, itemCreateFunc: (item: T, index: number) => Node | null): DomContents;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domForEach.ts" target="_blank">Defined in domForEach.ts</a></div>

Creates DOM elements for each element of an observable array. As the array is changed, children are added or removed. This works for any array-valued observable, and for obsArray() and computedArray() it works more efficiently for simple changes.

The given itemCreateFunc() should return a single DOM node for each item, or null to skip that item. It is called for new items whenever they are spliced in, or the array replaced. The forEach() owns the created nodes, and runs domDispose() on them when they are spliced out.

If the created nodes are removed from their parent externally, forEach() will cope with it, but will consider these elements as no longer owned, and will not run domDispose() on them.

Note that itemCreateFunc() is called with an index as the second argument, but that index is only accurate at the time of the call, and will stop reflecting the true index if more items are inserted or removed before it.

If you'd like to map the DOM node back to its source item, use dom.data() and dom.getData() in itemCreateFunc().

### dom.frag {#frag}
```ts refs=IDomArgs=grainjs!IDomArgs:interface|DocumentFragment=mdn#DocumentFragment|DocumentFragment=mdn#DocumentFragment
frag(...args: IDomArgs<DocumentFragment>): DocumentFragment;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

Creates a `DocumentFragment`, processing arguments in the same way as the `dom()` function.

It's rarely needed since an array of `dom()` arguments is treated the same as a `DocumentFragment` in most cases.

::: info Example

```ts
dom.frag(dom('span', 'Hello'), ' good ', dom('div', 'world'))
```

creates document fragment with `<span>Hello</span> good <div>world</div>`.

:::

::: info Example

These two examples are equivalent:
```ts
const world1 = () => dom.frag(' good ', dom('div', 'world'));
dom('div', 'Hello', world1);

const world2 = () => [' good ', dom('div', 'world')];
dom('div', 'Hello', world2);
```


:::

### dom.getData {#getData}
```ts refs=Node=mdn#Node
getData(elem: Node, key: string): any;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Retrieve data associated with a DOM element using `data()` or `dataElem()`.

### dom.hide {#hide}
```ts refs=BindableValue=grainjs!BindableValue:type|DomElementMethod=grainjs!DomElementMethod:type
hide(boolValueObs: BindableValue<boolean>): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

The opposite of show, hiding the element when boolValue is true. `boolValueObs` may be an observable or a function. Note that the element must be visible by default (i.e. unsetting `style.display` should show it).

### dom.hideElem {#hideElem}
```ts refs=HTMLElement=mdn#HTMLElement
hideElem(elem: HTMLElement, boolValue: boolean): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

The opposite of show, hiding the element when boolValue is true.

| Parameter | Description |
| --- | --- |
| `elem` | The element to update. |
| `boolValue` | True to hide the element, false to show it. |


### dom.maybe {#maybe}
```ts refs=BindableValue=grainjs!BindableValue:type|NonNullable=tsutil#nonnullabletype|DomContents=grainjs!DomContents:type|DomComputed=grainjs!DomComputed:type
maybe<T>(boolValueObs: BindableValue<T>, contentFunc: (val: NonNullable<T>) => DomContents): DomComputed;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

Conditionally appends DOM to an element. The value may be an observable or function (from which a computed is created), whose value -- if truthy -- will be passed to `contentFunc` which should return DOM content. If the value is falsy, DOM content is removed.

Note that if the observable changes between different truthy values, contentFunc gets called for each value, and previous content gets destroyed. To consider all truthy values the same, use an observable that returns a proper boolean, e.g.
```ts
   dom.maybe(use => Boolean(use(fooObs)), () => dom(...));
```

As with domComputed(), dom.maybe() may but should not be used when the argument is not an observable or function. The following are equivalent:
```ts
   dom(..., dom.maybe(myValue, () => dom(...)));
   dom(..., myValue ? dom(...) : null);
```

The latter is preferred for being simpler.

| Parameter | Description |
| --- | --- |
| `boolValueObs` | Observable or function for a computed. |
| `contentFunc` | Called with the result of boolValueObs when it is truthy. Should return DOM. |


### dom.maybeOwned {#maybeOwned}
```ts refs=BindableValue=grainjs!BindableValue:type|MultiHolder=grainjs!MultiHolder:class|NonNullable=tsutil#nonnullabletype|DomContents=grainjs!DomContents:type|DomComputed=grainjs!DomComputed:type
maybeOwned<T>(boolValueObs: BindableValue<T>, contentFunc: (owner: MultiHolder, val: NonNullable<T>) => DomContents): DomComputed;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

Like maybe(), but the callback gets an additional first argument, owner, which may be used to take ownership of objects created by the callback. These will be disposed before each new call to the callback, and when the condition becomes false or the containing DOM gets disposed.
```ts
   maybeOwned(showEditor, (owner) => Editor.create(owner).renderSomething())
```


### dom.on {#on}
```ts refs=EventName=grainjs!EventName:type|EventTarget=mdn#EventTarget|EventCB=grainjs!EventCB:type|EventType=grainjs!EventType:type|DomMethod=grainjs!DomMethod:type
on<E extends EventName | string, T extends EventTarget>(eventType: E, callback: EventCB<EventType<E>, T>, { useCapture }?: {
    useCapture?: boolean | undefined;
}): DomMethod<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

Listen to a DOM event. It is typically used as an argument to the `dom()` function:
```ts
dom('div', dom.on('click', (event, elem) => { ... }));
```

When the div is disposed, the listener is automatically removed.

The callback is called with the event and the element to which it was attached. Unlike in, say, JQuery, the callback's return value is ignored. Use `event.stopPropagation()` and `event.preventDefault()` explicitly if needed.

To listen to descendants of an element matching the given selector (what JQuery calls "delegated events", see http://api.jquery.com/on/), see [`onMatch`](#onMatch).

| Parameter | Description |
| --- | --- |
| `eventType` | Event type to listen for (e.g. `'click'`). |
| `callback` | Callback to call as `callback(event, elem)`, where `elem` is the element this listener is attached to. |
| `options` | `useCapture?: boolean`: Add the listener in the capture phase. |


### dom.onElem {#onElem}
```ts refs=EventName=grainjs!EventName:type|EventTarget=mdn#EventTarget|EventCB=grainjs!EventCB:type|EventType=grainjs!EventType:type|IDisposable=grainjs!IDisposable:interface
onElem<E extends EventName | string, T extends EventTarget>(elem: T, eventType: E, callback: EventCB<EventType<E>, T>, { useCapture }?: {
    useCapture?: boolean | undefined;
}): IDisposable;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

Listen to a DOM event, returning the listener object.
```ts
const listener = dom.onElem(elem, 'click', (event, elem) => { ... });
```

To stop listening:
```ts
listener.dispose();
```

Disposing the listener returned by `onElem()` is the only way to stop listening to an event. You can use `autoDispose` to stop listening automatically when subscribing in a `Disposable` object:
```ts
this.autoDispose(domevent.onElem(document, 'mouseup', callback));
```

If you need "once" semantics, i.e. to remove the callback on first call, here's a useful pattern:
```ts
const lis = domevent.onElem(elem, 'mouseup', e => { lis.dispose(); other_work(); });
```

| Parameter | Description |
| --- | --- |
| `elem` | DOM Element to listen to. |
| `eventType` | Event type to listen for (e.g. `'click'`). |
| `callback` | Callback to call as `callback(event, elem)`, where elem is `elem`. |
| `options` | `useCapture: boolean`: Add the listener in the capture phase. This should very rarely be useful (e.g. JQuery doesn't even offer it as an option). |


::: info Returns

 Listener object whose `.dispose()` method will remove the event listener.

:::

### dom.onKeyDown {#onKeyDown}
```ts refs=HTMLElement=mdn#HTMLElement|IKeyHandlers=grainjs!IKeyHandlers:interface|DomMethod=grainjs!DomMethod:type
onKeyDown<T extends HTMLElement>(keyHandlers: IKeyHandlers<T>): DomMethod<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

Add listeners to `"keydown"` events. See [`onKeyElem`](#onKeyElem) for details.

### dom.onKeyElem {#onKeyElem}
```ts refs=HTMLElement=mdn#HTMLElement|KeyEventType=grainjs!KeyEventType:type|IKeyHandlers=grainjs!IKeyHandlers:interface|IDisposable=grainjs!IDisposable:interface
onKeyElem<T extends HTMLElement>(elem: T, evType: KeyEventType, keyHandlers: IKeyHandlers<T>): IDisposable;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

Listen to key events (typically 'keydown' or 'keypress'), with specified per-key callbacks. Key names are listed at https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values

By default, handled events are stopped from bubbling with stopPropagation() and preventDefault(). If, however, you register a key with a "$" suffix (i.e. "Enter$" instead of "Enter"), then the event is allowed to bubble normally.

When this handler is set on an element, we automatically ensure that tabindex attribute is set, to allow this element to receive keyboard events.

For example:
```
   dom('input', ...
     dom.onKeyDown({
       Enter: (e, elem) => console.log("Enter pressed"),
       Escape: (e, elem) => console.log("Escape pressed"),
       Delete$: (e, elem) => console.log("Delete pressed, will bubble"),
     })
   )
```


### dom.onKeyPress {#onKeyPress}
```ts refs=HTMLElement=mdn#HTMLElement|IKeyHandlers=grainjs!IKeyHandlers:interface|DomMethod=grainjs!DomMethod:type
onKeyPress<T extends HTMLElement>(keyHandlers: IKeyHandlers<T>): DomMethod<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

Add listeners to `"keypress"` events. See [`onKeyElem`](#onKeyElem) for details.

### dom.onMatch {#onMatch}
```ts refs=EventCB=grainjs!EventCB:type|DomElementMethod=grainjs!DomElementMethod:type
onMatch(selector: string, eventType: string, callback: EventCB, { useCapture }?: {
    useCapture?: boolean | undefined;
}): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

Listen to a DOM event on descendants of the given element matching the given selector.

This is similar to JQuery's [delegated events](https://api.jquery.com/on/#direct-and-delegated-events)
```ts
dom('div', dom.onMatch('.selector', 'click', (event, elem) => { ... }));
```

In this usage, the element passed to the callback will be a DOM element matching the given selector. If there are multiple matches, the callback is only called for the innermost one.

| Parameter | Description |
| --- | --- |
| `selector` | CSS selector string to filter elements that trigger this event. |
| `eventType` | Event type to listen for (e.g. `'click'`). |
| `callback` | Callback to call as `callback(event, elem)`, where `elem` is an element matching `selector`. |
| `options` | `useCapture?: boolean`: Add the listener in the capture phase. |


### dom.onMatchElem {#onMatchElem}
```ts refs=EventTarget=mdn#EventTarget|EventCB=grainjs!EventCB:type|IDisposable=grainjs!IDisposable:interface
onMatchElem(elem: EventTarget, selector: string, eventType: string, callback: EventCB, { useCapture }?: {
    useCapture?: boolean | undefined;
}): IDisposable;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

Listen to a DOM event on descendants of the given elem matching the given selector.
```ts
const let lis = domevent.onMatchElem(elem, '.selector', 'click', (event, el) => { ... });
```

| Parameter | Description |
| --- | --- |
| `elem` | DOM Element to whose descendants to listen. |
| `selector` | CSS selector string to filter elements that trigger this event. JQuery calls it "delegated events" (http://api.jquery.com/on/). The callback will only be called when the event occurs for an element matching the given selector. If there are multiple elements matching the selector, the callback is only called for the innermost one. |
| `eventType` | Event type to listen for (e.g. 'click'). |
| `callback` | Callback to call as `callback(event, elem)`, where elem is a descendent of `elem` which matches `selector`. |
| `options` | `useCapture?: boolean`: Add the listener in the capture phase. |


::: info Returns

 Listener object whose `.dispose()` method will remove the event listener.

:::

### dom.prop {#prop}
```ts refs=BindableValue=grainjs!BindableValue:type|DomMethod=grainjs!DomMethod:type
prop<T>(property: string, valueObs: BindableValue<T>): DomMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets the property of a DOM element to the given value, which may be an observable or a function.

| Parameter | Description |
| --- | --- |
| `property` | The name of the property to update, e.g. 'disabled'. |
| `value` | The value for the property. |


### dom.propElem {#propElem}
```ts refs=Node=mdn#Node
propElem<T>(elem: Node, property: string, value: T): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets the property of a DOM element to the given value.

| Parameter | Description |
| --- | --- |
| `elem` | The element to update. |
| `property` | The name of the property to update, e.g. 'disabled'. |
| `value` | The value for the property. |


### dom.replaceContent {#replaceContent}
```ts refs=Node=mdn#Node|Node=mdn#Node|DomContents=grainjs!DomContents:type
replaceContent(nodeBefore: Node, nodeAfter: Node, content: DomContents): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

Replaces the content between nodeBefore and nodeAfter, which should be two siblings within the same parent node. New content may be anything allowed as an argument to dom(), including null to insert nothing. Runs disposers, if any, on all removed content.

### dom.show {#show}
```ts refs=BindableValue=grainjs!BindableValue:type|DomElementMethod=grainjs!DomElementMethod:type
show(boolValueObs: BindableValue<boolean>): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Shows or hides the element depending on a boolean value, which may be an observable or a function. Note that the element must be visible by default (i.e. unsetting `style.display` should show it).

### dom.showElem {#showElem}
```ts refs=HTMLElement=mdn#HTMLElement
showElem(elem: HTMLElement, boolValue: boolean): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Shows or hides the element depending on a boolean value. Note that the element must be visible initially (i.e. unsetting style.display should show it).

| Parameter | Description |
| --- | --- |
| `elem` | The element to update. |
| `boolValue` | True to show the element, false to hide it. |


### dom.style {#style}
```ts refs=BindableValue=grainjs!BindableValue:type|DomElementMethod=grainjs!DomElementMethod:type
style(property: string, valueObs: BindableValue<string>): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets a style property of a DOM element to the given value, which may be an observable or a function.

| Parameter | Description |
| --- | --- |
| `property` | The name of the style property to update, e.g. 'fontWeight'. |
| `value` | The value for the property. |


### dom.styleElem {#styleElem}
```ts refs=Element=mdn#Element
styleElem(elem: Element, property: string, value: string): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets a style property of a DOM element to the given value.

| Parameter | Description |
| --- | --- |
| `elem` | The element to update. |
| `property` | The name of the style property to update, e.g. 'fontWeight'. |
| `value` | The value for the property. |


### dom.svg {#svg}
```ts refs=IDomArgs=grainjs!IDomArgs:interface|SVGElement=mdn#SVGElement|SVGElement=mdn#SVGElement
svg(tagString: string, ...args: IDomArgs<SVGElement>): SVGElement;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

svg('tag#id.class1.class2', ...args) Same as dom(...), but creates an SVG element.

### dom.text {#text}
```ts refs=BindableValue=grainjs!BindableValue:type|DomMethod=grainjs!DomMethod:type
text(valueObs: BindableValue<string>): DomMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets text content of a DOM element to a value that may be an observable or a function.

### dom.textElem {#textElem}
```ts refs=Node=mdn#Node
textElem(elem: Node, value: string): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Adds a text node to the element.

| Parameter | Description |
| --- | --- |
| `elem` | The element to update. |
| `value` | The text value to add. |


### dom.update {#update}
```ts refs=Node=mdn#Node|IDomArgs=grainjs!IDomArgs:interface
update<T extends Node, Args extends IDomArgs<T>>(elem: T, ...args: Args): T;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

Update an element with any number of arguments, as documented in dom().

### IAttrObj {#IAttrObj}
```ts refs=
interface IAttrObj {
  [attrName: string]: string | boolean | null | undefined;
}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

Object mapping attribute names to attribute values. When applied to a DOM element, null and undefined values are omitted, and booleans are either omitted or set to empty string.

### keyframes {#keyframes}
```ts refs=
keyframes(styles: string): string;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/styled.ts" target="_blank">Defined in styled.ts</a></div>

Animations with `@keyframes` may be created with a unique name by using the keyframes() helper:
```ts
const rotate360 = keyframes(`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`);

const Rotate = styled('div', `
  display: inline-block;
  animation: ${rotate360} 2s linear infinite;
`);
```

This function returns simply a string with the generated name. Note that keyframes do not support nesting or ampersand (&) handling, like `styled()` does, since these would be difficult and are entirely unneeded.

### makeTestId {#makeTestId}
```ts refs=TestId=grainjs!TestId:type
makeTestId(prefix: string): TestId;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

See documentation for TestId above.

### noTestId {#noTestId}
```ts refs=TestId=grainjs!TestId:type
noTestId: TestId
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

See documentation for TestId above.

### styled {#styled}
```ts refs=TagName=grainjs!TagName:type|DomCreateFunc=grainjs!DomCreateFunc:type|TagElem=grainjs!TagElem:type|IClsName=grainjs!IClsName:interface|Element=mdn#Element|IClsName=grainjs!IClsName:interface
styled<Tag extends TagName>(tag: Tag, styles: string): DomCreateFunc<TagElem<Tag>> & IClsName;
styled<Args extends any[], R extends Element>(creator: (...args: Args) => R, styles: string): typeof creator & IClsName;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/styled.ts" target="_blank">Defined in styled.ts</a></div>

In-code styling for DOM components, inspired by Reacts Styled Components.

Usage:
```ts
const cssTitle = styled('h1', `
  font-size: 1.5em;
  text-align: center;
  color: palevioletred;
`);

const cssWrapper = styled('section', `
  padding: 4em;
  background: papayawhip;
`);

cssWrapper(cssTitle('Hello world'))
```

This generates class names for `cssTitle` and `cssWrapper`, adds the styles to the document on first use, and the result is equivalent to:
```ts
dom(`section.${cssWrapper.className}`, dom(`h1.${cssTitle.className}`, 'Hello world'));
```

What `styled(tag)` returns is a function that takes the same arguments `...args` as `dom(tag, ...args)`. In particular, you may call it with all the arguments that [`dom()`](#dom) takes: content, DOM methods, event handlers, etc.

Calls to `styled()` should happen at the top level, at import time, in order to register all styles upfront. Actual work happens the first time a style is needed to create an element. Calling `styled()` elsewhere than at top level is wasteful and bad for performance.

You may create a style that modifies an existing `styled()` or other component, e.g.
```ts
const cssTitle2 = styled(cssTitle, `font-size: 1rem; color: red;`);
```

Now calling `cssTitle2('Foo')` becomes equivalent to `dom('h1', {className: cssTitle.className + ' ' + cssTitle2.className})`.

Styles may incorporate other related styles by nesting them under the main one as follows:
```ts
const myButton = styled('button', `
  border-radius: 0.5rem;
  border: 1px solid grey;
  font-size: 1rem;

  &:active {
    background: lightblue;
  }
  &-small {
    font-size: 0.6rem;
  }
`);
```

In nested styles, ampersand (&) gets replaced with the generated .className of the main element.

The resulting styled component provides a `.cls()` helper to simplify using prefixed classes. It behaves as `dom.cls()`, but prefixes the class names with the generated className of the main element. E.g. for the example above,
```ts
myButton(myButton.cls('-small'), 'Test')
```

creates a button with both the `myButton` style above, and the style specified under "&-small".

### TestId {#TestId}
```ts refs=DomElementMethod=grainjs!DomElementMethod:type
type TestId = (name: string) => DomElementMethod | null;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

A very simple setup to identify DOM elements for testing purposes. Here's the recommended usage.
```ts
  // In the component to be tested.
  import {noTestId, TestId} from 'grainjs';

  function myComponent(myArgs, testId: TestId = noTestId) {
    return dom(..., testId("some-name"),
      dom(..., testId("another-name"), ...),
    );
  }
```

In the fixture code using this component:
```ts
  import {makeTestId} from 'grainjs';

  dom(..., myComponent(myArgs, makeTestId('test-mycomp-'), ...)
```

In the webdriver test code:
```ts
  driver.find('.test-my-comp-some-name')
  driver.find('.test-my-comp-another-name')
```

When myComponent() is created with testId argument omitted, the testId() calls are no-ops. When makeTestId('test-foo-') is passed in, testId() calls simply add a css class with that prefix.

## Disposable reference {#disposable-reference}

See [Disposables](/dispose) for background.

### Disposable {#Disposable}
```ts refs=IDisposable=grainjs!IDisposable:interface|IDisposableOwner=grainjs!IDisposableOwner:interface
abstract class Disposable implements IDisposable, IDisposableOwner
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Base class for disposable objects that can own other objects.

For background and motivation, see [Disposables](/dispose).

`Disposable` is a class for components that need cleanup (e.g. maintain DOM, listen to events, subscribe to anything). It provides a `.dispose()` method that should be called to destroy the component, and `.onDispose()` / `.autoDispose()` methods that the component should use to take responsibility for other pieces that require cleanup.

To define a disposable class:
```ts
class Foo extends Disposable { ... }
```

To create `Foo`:
```ts
const foo = Foo.create(owner, ...args);
```

This is better than `new Foo` for two reasons: 1. If `Foo`'s constructor throws an exception, any disposals registered in that constructor before the exception are honored. 2. It ensures you specify the owner of the new instance (but you can use null to skip it).

In `Foo`'s constructor (or rarely methods), take ownership of other Disposable objects:
```ts
this.bar = Bar.create(this, ...);
```

For objects that are not instances of Disposable but have a .dispose() methods, use:
```ts
this.bar = this.autoDispose(createSomethingDisposable());
```

To call a function on disposal (e.g. to add custom disposal logic):
```ts
this.onDispose(() => this.myUnsubscribeAllMethod());
this.onDispose(this.myUnsubscribeAllMethod, this);
```

To mark this object to be wiped out on disposal (i.e. set all properties to null):
```ts
this.wipeOnDispose();
```

See the documentation of that method for more info.

To dispose Foo directly: `foo.dispose()`.

To determine if an object has already been disposed: `foo.isDisposed()`.

If you need to replace an owned object, or release, or dispose it early, use a [`Holder`](#Holder) or [`MultiHolder`](#MultiHolder).

If creating your own class with a `dispose()` method, do NOT throw exceptions from `dispose()`. These cannot be handled properly in all cases.

Using a parametrized (generic) class as a Disposable is tricky. E.g.
```ts
class Bar<T> extends Disposable { ... }
// Bar<T>.create(...)   <-- doesn't work
// Bar.create<T>(...)   <-- doesn't work
// Bar.create(...)      <-- works, but with {} for Bar's type parameters
```

The solution is to expose the constructor type using a helper method:
```ts
class Bar<T> extends Disposable {
  // Note the tuple below which must match the constructor parameters of Bar<U>.
  public static ctor<U>(): IDisposableCtor<Bar<U>, [U, boolean]> { return this; }
  constructor(a: T, b: boolean) { ... }
}
Bar.ctor<T>().create(...)   // <-- works, creates Bar<T>, and does type-checking!
```


### Disposable.create {#Disposable.create}
```ts refs=IDisposableOwnerT=grainjs!IDisposableOwnerT:interface|InstanceType=tsutil#instancetypetype|ConstructorParameters=tsutil#constructorparameterstype|InstanceType=tsutil#instancetypetype
static create<T extends new (...args: any[]) => any>(this: T, owner: IDisposableOwnerT<InstanceType<T>> | null, ...args: ConstructorParameters<T>): InstanceType<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Create Disposable instances using `Class.create(owner, ...)` rather than `new Class(...)`.

This reminds you to provide an owner, and ensures that if the constructor throws an exception, `dispose()` gets called to clean up the partially-constructed object.

Owner may be `null` if you intend to ensure disposal some other way.

### Disposable#autoDispose {#Disposable#autoDispose}
```ts refs=IDisposable=grainjs!IDisposable:interface
autoDispose<T extends IDisposable>(obj: T): T;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Take ownership of `obj`, and dispose it when `this.dispose()` is called.

### Disposable#dispose {#Disposable#dispose}
```ts refs=
dispose(): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Clean up `this` by disposing all owned objects, and calling `onDispose()` callbacks, in reverse order to that in which they were added.

### Disposable#isDisposed {#Disposable#isDisposed}
```ts refs=
isDisposed(): boolean;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Returns whether this object has already been disposed.

### Disposable#onDispose {#Disposable#onDispose}
```ts refs=IDisposable=grainjs!IDisposable:interface
onDispose<T>(callback: (this: T) => void, context?: T): IDisposable;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Call the given callback when `this.dispose()` is called.

### Disposable#wipeOnDispose {#Disposable#wipeOnDispose}
```ts refs=
wipeOnDispose(): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Wipe out this object when it is disposed, i.e. set all its properties to null. It is recommended to call this early in the constructor.

This makes disposal more costly, but has certain benefits:

- If anything still refers to the object and uses it, we'll get an early error, rather than silently keep going, potentially doing useless work (or worse) and wasting resources.

- If anything still refers to the object (even without using it), the fields of the object can still be garbage-collected.

- If there are circular references involving this object, they get broken, making the job easier for the garbage collector.

The recommendation is to use it for complex, longer-lived objects, but to skip for objects which are numerous and short-lived (and less likely to be referenced from unexpected places).

### dom.autoDispose {#autoDispose}
```ts refs=IDisposable=grainjs!IDisposable:interface|Node=mdn#Node
autoDispose(disposable: IDisposable | null): ((elem: Node) => void) | undefined;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

Make the given element own the disposable, and call its dispose method when `domDispose()` is called on the element or any of its parents.

| Parameter | Description |
| --- | --- |
| `disposable` | Anything with a `.dispose()` method. |


### dom.autoDisposeElem {#autoDisposeElem}
```ts refs=Node=mdn#Node|IDisposable=grainjs!IDisposable:interface
autoDisposeElem(elem: Node, disposable: IDisposable | null): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

Make the given element own the disposable, and call its dispose method when `domDispose()` is called on the element or any of its parents.

| Parameter | Description |
| --- | --- |
| `elem` | The element to own the disposable. |
| `disposable` | Anything with a `.dispose()` method. |


### dom.domDispose {#domDispose}
```ts refs=Node=mdn#Node
domDispose(node: Node): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

Run disposers associated with any descendant of elem or with elem itself. Disposers get associated with elements using dom.onDispose(). Descendants are processed first.

It is automatically called if one of the function arguments to dom() throws an exception during element creation. This way any onDispose() handlers set on the unfinished element get called.

| Parameter | Description |
| --- | --- |
| `node` | The element to run disposers on. |


### dom.onDispose {#onDispose}
```ts refs=INodeFunc=grainjs!INodeFunc:type|Node=mdn#Node
onDispose(disposerFunc: INodeFunc): (elem: Node) => void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

Associate a disposer function with a DOM element. It will be called when the element is disposed using `domDispose()` on it or any of its parents. If called multiple times, all disposer functions will be called in reverse order.

| Parameter | Description |
| --- | --- |
| `disposerFunc` | Will be called when `domDispose()` is called on the element or its ancestor. |


### dom.onDisposeElem {#onDisposeElem}
```ts refs=Node=mdn#Node|INodeFunc=grainjs!INodeFunc:type
onDisposeElem(elem: Node, disposerFunc: INodeFunc): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

Associate a disposer function with a DOM element. It will be called when the element is disposed using `domDispose()` on it or any of its parents. If called multiple times, all disposer functions will be called in reverse order.

Note that it is not necessary usually to dispose event listeners attached to an element (e.g. with `dom.on()`) since their lifetime is naturally limited to the lifetime of the element.

| Parameter | Description |
| --- | --- |
| `elem` | The element to associate the disposer with. |
| `disposerFunc` | Will be called when `domDispose()` is called on the element or its ancestor. |


### domDisposeHooks {#domDisposeHooks}
```ts refs=IDomDisposeHooks=grainjs!IDomDisposeHooks:interface
domDisposeHooks: IDomDisposeHooks
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

Support for extending dom disposal. This is very low-level, and needs utmost care. Any disposers set should take care of calling the original versions of the disposers.

### Holder {#Holder}
```ts refs=IDisposable=grainjs!IDisposable:interface|IDisposable=grainjs!IDisposable:interface|IDisposableOwner=grainjs!IDisposableOwner:interface
class Holder<T extends IDisposable> implements IDisposable, IDisposableOwner
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Holder keeps a single disposable object. If given responsibility for another object using `holder.autoDispose()` or `Foo.create(holder, ...)`, it automatically disposes the currently held object. It also disposes it when the holder itself is disposed.

If the object is an instance of `Disposable`, the holder will also notice when the object gets disposed from outside of it, in which case the holder will become empty again.

If you need a container for multiple objects and dispose them all together, use a `MultiHolder`:

:::info Example
```ts
this._holder = Holder.create(this);
Bar.create(this._holder, 1);      // creates new Bar(1), assuming it's a Disposable
Bar.create(this._holder, 2);      // creates new Bar(2) and disposes previous object
this._holder.clear();             // disposes contained object
this._holder.release();           // releases contained object
```

:::

### Holder.create {#Holder.create}
```ts refs=IDisposable=grainjs!IDisposable:interface|IDisposableOwnerT=grainjs!IDisposableOwnerT:interface|Holder=grainjs!Holder:class|Holder=grainjs!Holder:class
static create<T extends IDisposable>(owner: IDisposableOwnerT<Holder<T>> | null): Holder<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

`Holder.create(owner)` creates a new `Holder`.

### Holder#autoDispose {#Holder#autoDispose}
```ts refs=
autoDispose(obj: T): T;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Take ownership of a new object, disposing the previously held one.

### Holder#clear {#Holder#clear}
```ts refs=
clear(): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Disposes the held object and empties the holder.

### Holder#dispose {#Holder#dispose}
```ts refs=
dispose(): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

When the holder is disposed, it disposes the held object if any.

### Holder#get {#Holder#get}
```ts refs=
get(): T | null;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Returns the held object, or null if the Holder is empty.

### Holder#isEmpty {#Holder#isEmpty}
```ts refs=
isEmpty(): boolean;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Returns whether the Holder is empty.

### Holder#release {#Holder#release}
```ts refs=IDisposable=grainjs!IDisposable:interface
release(): IDisposable | null;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Releases the held object without disposing it, emptying the holder.

### IDisposable {#IDisposable}
```ts refs=
interface IDisposable {
  dispose(): void;
}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Anything with a .dispose() method is a disposable object, and implements the IDisposable interface.

### IDisposableCtor {#IDisposableCtor}
```ts refs=IDisposableOwnerT=grainjs!IDisposableOwnerT:interface|InstanceType=tsutil#instancetypetype|ConstructorParameters=tsutil#constructorparameterstype|InstanceType=tsutil#instancetypetype
interface IDisposableCtor<Derived, CtorArgs extends any[]> {
  new (...args: CtorArgs): Derived;
  create<T extends new (...args: any[]) => any>(this: T, owner: IDisposableOwnerT<InstanceType<T>> | null, ...args: ConstructorParameters<T>): InstanceType<T>;
}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

The static portion of class Disposable.

### IDisposableOwner {#IDisposableOwner}
```ts refs=IDisposable=grainjs!IDisposable:interface
interface IDisposableOwner {
  autoDispose(obj: IDisposable): void;
}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Type that can own an object of any disposable type.

### IDisposableOwnerT {#IDisposableOwnerT}
```ts refs=IDisposable=grainjs!IDisposable:interface
interface IDisposableOwnerT<T extends IDisposable> {
  autoDispose(obj: T): void;
}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Anything with `.autoDispose()` can be the owner of a disposable object. This is a type-specific class that can only own a disposable object of type T.

### MultiHolder {#MultiHolder}
```ts refs=Disposable=grainjs!Disposable:class
class MultiHolder extends Disposable
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

`MultiHolder` keeps multiple disposable objects. It disposes all held object when the holder itself is disposed. It's actually nothing more than the `Disposable` base class itself, just exposed with a clearer name that describes its purpose.

:::info Example
```ts
this._mholder = MultiHolder.create(null);
Bar.create(this._mholder, 1);     // create new Bar(1)
Bar.create(this._mholder, 2);     // create new Bar(2)
this._mholder.dispose();          // disposes both objects
```

:::

### setDisposeOwner {#setDisposeOwner}
```ts refs=IDisposable=grainjs!IDisposable:interface|IDisposableOwnerT=grainjs!IDisposableOwnerT:interface
setDisposeOwner<T extends IDisposable>(owner: IDisposableOwnerT<T> | null, obj: T): T;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Sets owner of obj (i.e. calls owner.autoDispose(obj)) unless owner is null. Returns obj.

## Observables reference {#observables-reference}

See [Observables](/basics#observables) for background.

### BaseObservable {#BaseObservable}
```ts refs=
class BaseObservable<T>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

Base class for several variants of observable values.

### BaseObservable#addListener {#BaseObservable#addListener}
```ts refs=Listener=grainjs!Listener:class
addListener(callback: (val: T, prev: T) => void, optContext?: object): Listener;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

Adds a callback to listen to changes in the observable.

| Parameter | Description |
| --- | --- |
| `callback` | Function, called on changes with (newValue, oldValue) arguments. |
| `optContext` | Context for the function. |


::: info Returns

 Listener object. Its dispose() method removes the callback.

:::

### BaseObservable#dispose {#BaseObservable#dispose}
```ts refs=
dispose(): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

Disposes the observable.

### BaseObservable#get {#BaseObservable#get}
```ts refs=
get(): T;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

Returns the value of the observable. It is fast and does not create a subscription. (It is similar to knockout's peek()).

::: info Returns

 The current value of the observable.

:::

### BaseObservable#hasListeners {#BaseObservable#hasListeners}
```ts refs=
hasListeners(): boolean;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

Returns whether this observable has any listeners.

### BaseObservable#isDisposed {#BaseObservable#isDisposed}
```ts refs=
isDisposed(): boolean;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

Returns whether this observable is disposed.

### BaseObservable#set {#BaseObservable#set}
```ts refs=
set(value: T): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

Sets the value of the observable. If the value differs from the previously set one, then listeners to this observable will get called with (newValue, oldValue) as arguments.

| Parameter | Description |
| --- | --- |
| `value` | The new value to set. |


### BaseObservable#setAndTrigger {#BaseObservable#setAndTrigger}
```ts refs=
setAndTrigger(value: T): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

Sets the value of the observable AND calls listeners even if the value is unchanged.

### BaseObservable#setListenerChangeCB {#BaseObservable#setListenerChangeCB}
```ts refs=
setListenerChangeCB(changeCB: (hasListeners: boolean) => void, optContext?: any): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

Sets a single callback to be called when a listener is added or removed. It overwrites any previously-set such callback.

| Parameter | Description |
| --- | --- |
| `changeCB` | Function to call after a listener is added or removed. It's called with a boolean indicating whether this observable has any listeners. Pass in `null` to unset the callback. Note that it can be called multiple times in a row with hasListeners `true`. |


### BindableValue {#BindableValue}
```ts refs=BaseObservable=grainjs!BaseObservable:class|ComputedCallback=grainjs!ComputedCallback:type|IKnockoutReadObservable=grainjs!IKnockoutReadObservable:interface
type BindableValue<T> = BaseObservable<T> | ComputedCallback<T> | T | IKnockoutReadObservable<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/binding.ts" target="_blank">Defined in binding.ts</a></div>

Any of the value types that DOM methods know how to subscribe to: a plain value (like a string); an Observable (including a Computed); a knockout observable; a function.

If a function, it's used to create a `Computed`, and will be called with a context function `use`, allowing it to depend on other observable values (see documentation for `Computed`).

### Computed {#Computed}
```ts refs=Observable=grainjs!Observable:class
class Computed<T> extends Observable<T>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/computed.ts" target="_blank">Defined in computed.ts</a></div>

`Computed` implements a computed observable, whose value depends on other observables and gets recalculated automatically when they change.

E.g. if we have some existing observables (which may themselves be instances of `Computed`), we can create a computed that subscribes to them explicitly:
```ts
const obs1 = Observable.create(null, 5), obs2 = Observable.create(null, 12);
const computed1 = Computed.create(null, obs1, obs2, (use, v1, v2) => v1 + v2);
```

or implicitly by using `use(obs)` function:
```ts
const computed2 = Computed.create(null, use => use(obs1) + use(obs2));
```

In either case, `computed1.get()` and `computed2.get()` will have the value 17. If `obs1` or `obs2` is changed, `computed1` and `computed2` will get recomputed automatically.

Creating a computed allows any number of dependencies to be specified explicitly, and their values will be passed to the `read()` callback. These may be combined with automatic dependencies detected using `use()`. Note that constructor dependencies have less overhead.
```ts
const val = Computed.create(null, ...deps, ((use, ...depValues) => READ_CALLBACK));
```

You may specify a `write` callback by calling `onWrite(WRITE_CALLBACK)`, which will be called whenever `set()` is called on the computed by its user. If a `write` bacllback is not specified, calling `set` on a computed observable will throw an exception.

Note that `PureComputed` offers a variation of `Computed` with the same interface, but which stays unsubscribed from dependencies while it itself has no subscribers.

A computed may be used with a disposable value using `use.owner` as the value's owner. E.g.
```ts
const val = Computed.create(null, ((use) => Foo.create(use.owner, use(a), use(b)));
```

When the `Computed` is re-evaluated, and when it itself is disposed, it disposes the previously owned value. Note that only the pattern above works, i.e. `use.owner` may only be used to take ownership of the same disposable that the callback returns.

### Computed.create {#Computed.create}
```ts refs=UseCB=grainjs!UseCBOwner:interface|Computed=grainjs!Computed:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCBOwner:interface|Computed=grainjs!Computed:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCBOwner:interface|Computed=grainjs!Computed:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCBOwner:interface|Computed=grainjs!Computed:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCBOwner:interface|Computed=grainjs!Computed:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCBOwner:interface|Computed=grainjs!Computed:class
static create<T>(owner: Owner<T>, cb: (use: UseCB) => T): Computed<T>;
static create<T, A>(owner: Owner<T>, a: Obs<A>, cb: (use: UseCB, a: A) => T): Computed<T>;
static create<T, A, B>(owner: Owner<T>, a: Obs<A>, b: Obs<B>, cb: (use: UseCB, a: A, b: B) => T): Computed<T>;
static create<T, A, B, C>(owner: Owner<T>, a: Obs<A>, b: Obs<B>, c: Obs<C>, cb: (use: UseCB, a: A, b: B, c: C) => T): Computed<T>;
static create<T, A, B, C, D>(owner: Owner<T>, a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>, cb: (use: UseCB, a: A, b: B, c: C, d: D) => T): Computed<T>;
static create<T, A, B, C, D, E>(owner: Owner<T>, a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>, e: Obs<E>, cb: (use: UseCB, a: A, b: B, c: C, d: D, e: E) => T): Computed<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/computed.ts" target="_blank">Defined in computed.ts</a></div>

Creates a new Computed, owned by the given owner.

| Parameter | Description |
| --- | --- |
| `owner` | Object to own this Computed, or null to handle disposal manually. |
| `observables` | Zero or more observables on which this computes depends. The callback will get called when any of these changes. |
| `callback` | Read callback that will be called with `(use, ...values)`, i.e. the `use` function and values for all of the `...observables`. The callback is called immediately and whenever any dependency changes. |


::: info Returns

 The newly created `Computed` observable.

:::

### Computed#dispose {#Computed#dispose}
```ts refs=
dispose(): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/computed.ts" target="_blank">Defined in computed.ts</a></div>

Disposes the computed, unsubscribing it from all observables it depends on.

### Computed#onWrite {#Computed#onWrite}
```ts refs=Computed=grainjs!Computed:class
onWrite(writeFunc: (value: T) => void): Computed<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/computed.ts" target="_blank">Defined in computed.ts</a></div>

Set callback to call when this.set(value) is called, to make it a writable computed. If not set, attempting to write to this computed will throw an exception.

### Computed#set {#Computed#set}
```ts refs=
set(value: T): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/computed.ts" target="_blank">Defined in computed.ts</a></div>

"Sets" the value of the computed by calling the write() callback if one was provided in the constructor. Throws an error if there was no such callback (not a "writable" computed).

| Parameter | Description |
| --- | --- |
| `value` | The value to pass to the write() callback. |


### computed {#computed}
```ts refs=UseCB=grainjs!UseCBOwner:interface|Computed=grainjs!Computed:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCBOwner:interface|Computed=grainjs!Computed:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCBOwner:interface|Computed=grainjs!Computed:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCBOwner:interface|Computed=grainjs!Computed:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCBOwner:interface|Computed=grainjs!Computed:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCBOwner:interface|Computed=grainjs!Computed:class
computed<T>(cb: (use: UseCB) => T): Computed<T>;
computed<T, A>(a: Obs<A>, cb: (use: UseCB, a: A) => T): Computed<T>;
computed<T, A, B>(a: Obs<A>, b: Obs<B>, cb: (use: UseCB, a: A, b: B) => T): Computed<T>;
computed<T, A, B, C>(a: Obs<A>, b: Obs<B>, c: Obs<C>, cb: (use: UseCB, a: A, b: B, c: C) => T): Computed<T>;
computed<T, A, B, C, D>(a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>, cb: (use: UseCB, a: A, b: B, c: C, d: D) => T): Computed<T>;
computed<T, A, B, C, D, E>(a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>, e: Obs<E>, cb: (use: UseCB, a: A, b: B, c: C, d: D, e: E) => T): Computed<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/computed.ts" target="_blank">Defined in computed.ts</a></div>

Creates a new Computed.

| Parameter | Description |
| --- | --- |
| `observables` | The initial params, of which there may be zero or more, are observables on which this computed depends. When any of them change, the `read()` callback will be called with the values of these observables as arguments. |
| `readCallback` | Read callback that will be called with `(use, ...values)`, i.e. the `use` function and values for all of the `...observables`. The callback is called immediately and whenever any dependency changes. |


::: info Returns

 The newly created `Computed` observable.

:::

### ComputedArray {#ComputedArray}
```ts refs=ObsArray=grainjs!ObsArray:class
class ComputedArray<T, U> extends ObsArray<U>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

See [`computedArray()`](#computedArray) for documentation.

### computedArray {#computedArray}
```ts refs=BaseObservable=grainjs!BaseObservable:class|Observable=grainjs!Observable:class|BaseObservable=grainjs!BaseObservable:class|ComputedArray=grainjs!ComputedArray:class|ObsArray=grainjs!ObsArray:class
computedArray<T, U>(obsArr: BaseObservable<T[]> | Observable<BaseObservable<T[]>>, mapper: (item: T, index: number, arr: ComputedArray<T, U>) => U): ObsArray<U>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Returns an `ObsArray` that maps all elements of the passed-in `ObsArray` through a mapper function. Also accepts an observable (e.g. a computed) whose value is an `ObsArray`.
```ts
computedArray(obsArray, mapper)
```

The result is analogous to:
```ts
computed((use) => use(obsArray).map(mapper))       // for ObsArray
computed((use) => use(use(obsArray)).map(mapper))  // for Observable<ObsArray>
```

The benefit of `computedArray()` is that a small change to the source array (e.g. one item added or removed), causes a small change to the mapped array, rather than a full rebuild.

This is useful with an `ObsArray` or with an observable whose value is an `ObsArray`, and also when the computed array's items are disposable and it owns them.

There is no need or benefit to using `computedArray()` if you have a `computed()` that returns a plain array. It is specifically for the case when you want to preserve the efficiency of `ObsArray` when you map its values.

Note that the mapper function is called with `(item, index, array)` as for a standard `array.map()`, but that the index is only accurate at the time of the call, and will stop reflecting the true index if more items are inserted into the array later.

As with `ObsArray`, a `ComputedArray` may be used with disposable elements as their owners. E.g.
```ts
const values = obsArray<string>();
const compArr = computedArray<D>(values, (val, i, compArr) => D.create(compArr, val));
values.push("foo", "bar");      // D("foo") and D("bar") get created
values.pop();                   // D("bar") gets disposed.
compArr.dispose();              // D("foo") gets disposed.
```

Note that only the pattern above works: obsArray (or compArray) may only be used to take ownership of those disposables that are added to it as array elements.

### IObsArraySplice {#IObsArraySplice}
```ts refs=
interface IObsArraySplice<T> {
  deleted: T[];
  numAdded: number;
  start: number;
}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Info about a modification to ObsArray contents. It is included as a third argument to change listeners when available. When not available, listeners should assume that the array changed completely.

### LiveIndex {#LiveIndex}
```ts refs=Observable=grainjs!Observable:class
class LiveIndex extends Observable<number | null>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

An Observable that represents an index into an `ObsArray`, clamped to be in the valid range.

### LiveIndex#set {#LiveIndex#set}
```ts refs=
set(index: number | null): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Set the index, clamping it to a valid value.

### LiveIndex#setLive {#LiveIndex#setLive}
```ts refs=
setLive(value: boolean): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Turn "liveness" on or off. While set to false, the observable will not be adjusted as the array changes, except to keep it valid.

### makeLiveIndex {#makeLiveIndex}
```ts refs=IDisposableOwnerT=grainjs!IDisposableOwnerT:interface|LiveIndex=grainjs!LiveIndex:class|ObsArray=grainjs!ObsArray:class|LiveIndex=grainjs!LiveIndex:class
makeLiveIndex<T>(owner: IDisposableOwnerT<LiveIndex> | null, obsArr: ObsArray<T>, initialIndex?: number): LiveIndex;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Returns a new observable representing an index into this array. It can be read and written, and its value is clamped to be a valid index. The index is only null if the array is empty.

As the array changes, the index is adjusted to continue pointing to the same element. If the pointed element is deleted, the index is adjusted to after the deletion point.

The returned observable has an additional .setLive(bool) method. While set to false, the observable will not be adjusted as the array changes, except to keep it valid.

### MaybeObsArray {#MaybeObsArray}
```ts refs=BaseObservable=grainjs!BaseObservable:class
type MaybeObsArray<T> = BaseObservable<T[]> | T[];
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Either an observable or a plain array of T. This is useful for functions like dom.forEach() which are convenient to have available for both.

### MutableObsArray {#MutableObsArray}
```ts refs=ObsArray=grainjs!ObsArray:class
class MutableObsArray<T> extends ObsArray<T>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

`MutableObsArray<T>` adds array-like mutation methods which emit events with splice info, to allow more efficient processing of such changes. It is created with `obsArray<T>()`.

### MutableObsArray#pop {#MutableObsArray#pop}
```ts refs=
pop(): T | undefined;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Removes and returns the last element (like `Array#pop`).

### MutableObsArray#push {#MutableObsArray#push}
```ts refs=
push(...args: T[]): number;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Appends elements to the end and returns the new length (like `Array#push`).

### MutableObsArray#shift {#MutableObsArray#shift}
```ts refs=
shift(): T | undefined;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Removes and returns the first element (like `Array#shift`).

### MutableObsArray#splice {#MutableObsArray#splice}
```ts refs=
splice(start: number, deleteCount?: number, ...newValues: T[]): T[];
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Removes and/or inserts elements at a given index and returns the removed elements (like `Array#splice`).

### MutableObsArray#unshift {#MutableObsArray#unshift}
```ts refs=
unshift(...args: T[]): number;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Prepends elements to the start and returns the new length (like `Array#unshift`).

### ObsArray {#ObsArray}
```ts refs=BaseObservable=grainjs!BaseObservable:class
class ObsArray<T> extends BaseObservable<T[]>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

`ObsArray<T>` is essentially an array-valued observable. It extends a plain Observable to allow for more efficient observation of array changes. It also may be used as an owner for disposable array elements.

As for any array-valued `Observable`, when the contents of the observed array changes, the listeners get called with new and previous values which are the same array. For simple changes, such as those made with `.push()` and `.splice()` methods, `ObsArray` allows for more efficient handling of the change by calling listeners with splice info in the third argument.

`ObsArray` may be used with disposable elements as their owner. E.g.
```ts
const arr = obsArray<D>();
arr.push(D.create(arr, "x"), D.create(arr, "y"));
arr.pop();      // Element "y" gets disposed.
arr.dispose();  // Element "x" gets disposed.
```

Note that only the pattern above works: `obsArray` may only be used to take ownership of those disposables that are added to it as array elements.

### ObsArray#addListener {#ObsArray#addListener}
```ts refs=ISpliceListener=grainjs!ISpliceListener:type|Listener=grainjs!Listener:class|ISpliceListener=grainjs!ISpliceListener:type|Listener=grainjs!Listener:class
addListener(callback: ISpliceListener<T, void>): Listener;
addListener<C>(callback: ISpliceListener<T, C>, context: C): Listener;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Adds a callback to listen to changes in the observable. In case of `ObsArray`, the listener gets additional information.

### ObsArray#autoDispose {#ObsArray#autoDispose}
```ts refs=IDisposable=grainjs!IDisposable:interface|IDisposable=grainjs!IDisposable:interface
autoDispose(value: T & IDisposable): T & IDisposable;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Take ownership of an item added to this array. This should _only_ be used for array elements, not any unrelated items.

### obsArray {#obsArray}
```ts refs=MutableObsArray=grainjs!MutableObsArray:class
obsArray<T>(value?: T[]): MutableObsArray<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Creates a new MutableObsArray with an optional initial value, defaulting to the empty array. It is essentially the same as `observable<T[]>`, but with array-like mutation methods.

### Observable {#Observable}
```ts refs=BaseObservable=grainjs!BaseObservable:class|IDisposableOwnerT=grainjs!IDisposableOwnerT:interface|IDisposable=grainjs!IDisposable:interface
class Observable<T> extends BaseObservable<T> implements IDisposableOwnerT<T & IDisposable>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

An Observable holds a value and allows subscribing to changes.

### Observable.create {#Observable.create}
```ts refs=IDisposableOwnerT=grainjs!IDisposableOwnerT:interface|Observable=grainjs!Observable:class|Observable=grainjs!Observable:class
static create<T>(owner: IDisposableOwnerT<Observable<T>> | null, value: T): Observable<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

Creates a new Observable with the given initial value, and owned by owner.

### Observable#autoDispose {#Observable#autoDispose}
```ts refs=IDisposable=grainjs!IDisposable:interface|IDisposable=grainjs!IDisposable:interface
autoDispose(value: T & IDisposable): T & IDisposable;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

The use an observable for a disposable object, use it a DisposableOwner:

D.create(obs, ...args) // Preferred obs.autoDispose(D.create(null, ...args)) // Equivalent

Either of these usages will set the observable to the newly created value. The observable will dispose the owned value when it's set to another value, or when it itself is disposed.

### observable {#observable}
```ts refs=Observable=grainjs!Observable:class
observable<T>(value: T): Observable<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

Creates a new Observable with the initial value of optValue if given or undefined if omitted.

| Parameter | Description |
| --- | --- |
| `optValue` | The initial value to set. |


::: info Returns

 The newly created observable.

:::

### obsHolder {#obsHolder}
```ts refs=IDisposable=grainjs!IDisposable:interface|Observable=grainjs!Observable:class
obsHolder<T>(value: T & IDisposable): Observable<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

Creates a new Observable with an initial disposable value owned by this observable, e.g.
```
   const obs = obsHolder<D>(D.create(null, ...args));
```

This is needed because using simply `observable<D>(value)` would not cause the observable to take ownership of value (i.e. to dispose it later). This function is a less hacky equivalent to:
```
   const obs = observable<D>(null as any);
   D.create(obs, ...args);
```

To allow nulls, use `observable<D|null>(null)`; then the obsHolder() constructor is not needed.

### PureComputed {#PureComputed}
```ts refs=Observable=grainjs!Observable:class
class PureComputed<T> extends Observable<T>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/pureComputed.ts" target="_blank">Defined in pureComputed.ts</a></div>

`PureComputed` is a variant of `Computed` suitable for use with a pure read function (free of side-effects). A `PureComputed` is only subscribed to its dependencies when something is subscribed to it. At other times, it is not subscribed to anything, and calls to `get()` will recompute its value each time by calling its `read()` function.

Its syntax and usage are otherwise exactly as for a `Computed`.

In addition to being cheaper when unused, a `PureComputed` also avoids leaking memory when unused (since it's not registered with dependencies), so it is not necessary to dispose it.

### PureComputed#dispose {#PureComputed#dispose}
```ts refs=
dispose(): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/pureComputed.ts" target="_blank">Defined in pureComputed.ts</a></div>

Disposes the pureComputed, unsubscribing it from all observables it depends on.

### PureComputed#onWrite {#PureComputed#onWrite}
```ts refs=PureComputed=grainjs!PureComputed:class
onWrite(writeFunc: (value: T) => void): PureComputed<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/pureComputed.ts" target="_blank">Defined in pureComputed.ts</a></div>

Set callback to call when this.set(value) is called, to make it a writable computed. If not set, attempting to write to this computed will throw an exception.

### PureComputed#set {#PureComputed#set}
```ts refs=
set(value: T): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/pureComputed.ts" target="_blank">Defined in pureComputed.ts</a></div>

"Sets" the value of the pure computed by calling the write() callback if one was provided in the constructor. Throws an error if there was no such callback (not a "writable" computed).

| Parameter | Description |
| --- | --- |
| `value` | The value to pass to the write() callback. |


### pureComputed {#pureComputed}
```ts refs=UseCB=grainjs!UseCB:type|PureComputed=grainjs!PureComputed:class|Observable=grainjs!Observable:class|UseCB=grainjs!UseCB:type|PureComputed=grainjs!PureComputed:class|Observable=grainjs!Observable:class|Observable=grainjs!Observable:class|UseCB=grainjs!UseCB:type|PureComputed=grainjs!PureComputed:class|Observable=grainjs!Observable:class|Observable=grainjs!Observable:class|Observable=grainjs!Observable:class|UseCB=grainjs!UseCB:type|PureComputed=grainjs!PureComputed:class|Observable=grainjs!Observable:class|Observable=grainjs!Observable:class|Observable=grainjs!Observable:class|Observable=grainjs!Observable:class|UseCB=grainjs!UseCB:type|PureComputed=grainjs!PureComputed:class|Observable=grainjs!Observable:class|Observable=grainjs!Observable:class|Observable=grainjs!Observable:class|Observable=grainjs!Observable:class|Observable=grainjs!Observable:class|UseCB=grainjs!UseCB:type|PureComputed=grainjs!PureComputed:class
pureComputed<T>(cb: (use: UseCB) => T): PureComputed<T>;
pureComputed<A, T>(a: Observable<A>, cb: (use: UseCB, a: A) => T): PureComputed<T>;
pureComputed<A, B, T>(a: Observable<A>, b: Observable<B>, cb: (use: UseCB, a: A, b: B) => T): PureComputed<T>;
pureComputed<A, B, C, T>(a: Observable<A>, b: Observable<B>, c: Observable<C>, cb: (use: UseCB, a: A, b: B, c: C) => T): PureComputed<T>;
pureComputed<A, B, C, D, T>(a: Observable<A>, b: Observable<B>, c: Observable<C>, d: Observable<D>, cb: (use: UseCB, a: A, b: B, c: C, d: D) => T): PureComputed<T>;
pureComputed<A, B, C, D, E, T>(a: Observable<A>, b: Observable<B>, c: Observable<C>, d: Observable<D>, e: Observable<E>, cb: (use: UseCB, a: A, b: B, c: C, d: D, e: E) => T): PureComputed<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/pureComputed.ts" target="_blank">Defined in pureComputed.ts</a></div>

Creates and returns a new PureComputed. The interface is identical to that of a Computed.

### subscribe {#subscribe}
```ts refs=UseCB=grainjs!UseCB:type|Subscription=grainjs!Subscription:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCB:type|Subscription=grainjs!Subscription:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCB:type|Subscription=grainjs!Subscription:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCB:type|Subscription=grainjs!Subscription:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCB:type|Subscription=grainjs!Subscription:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCB:type|Subscription=grainjs!Subscription:class
subscribe(cb: (use: UseCB) => void): Subscription;
subscribe<A>(a: Obs<A>, cb: (use: UseCB, a: A) => void): Subscription;
subscribe<A, B>(a: Obs<A>, b: Obs<B>, cb: (use: UseCB, a: A, b: B) => void): Subscription;
subscribe<A, B, C>(a: Obs<A>, b: Obs<B>, c: Obs<C>, cb: (use: UseCB, a: A, b: B, c: C) => void): Subscription;
subscribe<A, B, C, D>(a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>, cb: (use: UseCB, a: A, b: B, c: C, d: D) => void): Subscription;
subscribe<A, B, C, D, E>(a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>, e: Obs<E>, cb: (use: UseCB, a: A, b: B, c: C, d: D, e: E) => void): Subscription;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

Creates a new Subscription.

| Parameter | Description |
| --- | --- |
| `observables` | The initial params, of which there may be zero or more, are observables on which this computed depends. When any of them change, the `callback` will be called with the values of these observables as arguments. |
| `callback` | will be called with arguments `(use, ...values)`, i.e. the `use` function and values for all of the `...observables` that precede this argument. This callback is called immediately, and whenever any dependency changes. |


::: info Returns

 The new `Subscription` which may be disposed to unsubscribe.

:::

### subscribeBindable {#subscribeBindable}
```ts refs=IKnockoutReadObservable=grainjs!IKnockoutReadObservable:interface|InferKoType=grainjs!InferKoType:type|IDisposable=grainjs!IDisposable:interface|BindableValue=grainjs!BindableValue:type|IDisposable=grainjs!IDisposable:interface
subscribeBindable<KObs extends IKnockoutReadObservable<any>>(valueObs: KObs, callback: (val: InferKoType<KObs>) => void): IDisposable | null;
subscribeBindable<T>(valueObs: BindableValue<T>, callback: (val: T) => void): IDisposable | null;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/binding.ts" target="_blank">Defined in binding.ts</a></div>

Subscribes a callback to valueObs, which may be one a plain value, an observable, a knockout observable, or a function. If a function, it's used to create a computed() and will be called with a context function `use`, allowing it to depend on other observable values (see documentation for `computed`).

In all cases, `callback(newValue, oldValue)` is called immediately and whenever the value changes. On the initial call, oldValue is undefined.

Returns an object which should be disposed to remove the created subscriptions, or null.

### subscribeElem {#subscribeElem}
```ts refs=Node=mdn#Node|BindableValue=grainjs!BindableValue:type
subscribeElem<T>(elem: Node, valueObs: BindableValue<T>, callback: (newVal: T, oldVal?: T) => void): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/binding.ts" target="_blank">Defined in binding.ts</a></div>

Subscribes a callback to `valueObs` (which may be a value, observable, or function) using `subscribeBindable()`, and ties the disposal of this subscription to the passed-in element.

### Subscription {#Subscription}
```ts refs=
class Subscription
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

`Subscription` allows subscribing to several observables at once. It's the foundation for a `Computed`, but may also be used directly.

E.g. if we have some existing observables (which may be instances of `Computed`), we can subscribe to them explicitly:
```ts
const obs1 = observable(5), obs2 = observable(12);
subscribe(obs1, obs2, (use, v1, v2) => console.log(v1, v2));
```

or implicitly by using `use(obs)` function, which allows dynamic subscriptions:
```ts
subscribe(use => console.log(use(obs1), use(obs2)));
```

In either case, if `obs1` or `obs2` is changed, the callbacks will get called automatically.

Creating a subscription allows any number of dependencies to be specified explicitly, and their values will be passed to the `callback`. These may be combined with automatic dependencies detected using `use()`. Note that constructor dependencies have less overhead.
```ts
subscribe(...deps, ((use, ...depValues) => READ_CALLBACK));
```


### Subscription#dispose {#Subscription#dispose}
```ts refs=
dispose(): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

Disposes the computed, unsubscribing it from all observables it depends on.

## Other
### bindB {#bindB}
```ts refs=
bindB<R>(func: (...args: any[]) => R, b: any[]): () => R;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/util.ts" target="_blank">Defined in util.ts</a></div>

Returns f such that f() calls func(...boundArgs), i.e. optimizes `() => func(...boundArgs)`. It is faster on node6 by 57-92%.

### bindBU {#bindBU}
```ts refs=
bindBU<R>(func: (...args: any[]) => R, b: any[]): (arg: any) => R;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/util.ts" target="_blank">Defined in util.ts</a></div>

Returns f such that f(unboundArg) calls func(...boundArgs, unboundArg). I.e. optimizes `(arg) => func(...boundArgs, arg)`. It is faster on node6 by 0-92%.

### bindUB {#bindUB}
```ts refs=
bindUB<U, R>(func: (arg: U, ...args: any[]) => R, b: any[]): (arg: U) => R;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/util.ts" target="_blank">Defined in util.ts</a></div>

Returns f such that f(unboundArg) calls func(unboundArg, ...boundArgs). I.e. optimizes `(arg) => func(arg, ...boundArgs)`. It is faster on node6 by 0-92%.

### bundleChanges {#bundleChanges}
```ts refs=
bundleChanges<T>(func: () => T): T;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/_computed_queue.ts" target="_blank">Defined in _computed_queue.ts</a></div>

Defer recomputations of all computed observables and subscriptions until func() returns. This is useful to avoid unnecessary recomputation if you are making several changes to observables together. This function is exposed as `observable.bundleChanges()`.

Note that this intentionally does not wait for promises to be resolved, since that would block all updates to all computeds while waiting.

### ChangeCB {#ChangeCB}
```ts refs=
type ChangeCB = (hasListeners: boolean) => void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/emit.ts" target="_blank">Defined in emit.ts</a></div>

A callback that listens to _changes_ in the Emitter listeners. This is mainly used for internal purposes.

### Emitter {#Emitter}
```ts refs=
class Emitter extends LLink
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/emit.ts" target="_blank">Defined in emit.ts</a></div>

An `Emitter` emits events to a list of listeners. Listeners are simply functions to call, and "emitting an event" just calls those functions.

This is similar to Backbone events, with more focus on efficiency. Both inserting and removing listeners is constant time.

To create an emitter:
```ts
const emitter = new Emitter();
```

To add a listener:
```ts
const listener = fooEmitter.addListener(callback);
```

To remove a listener:
```ts
listener.dispose();
```

The only way to remove a listener is to dispose the `Listener` object returned by `addListener()`. You can often use autoDispose to do this automatically when subscribing in a constructor:
```ts
this.autoDispose(fooEmitter.addListener(this.onFoo, this));
```

To emit an event, call `emit()` with any number of arguments:
```ts
emitter.emit("hello", "world");
```


### Emitter#addListener {#Emitter#addListener}
```ts refs=ListenerCB=grainjs!ListenerCB:type|Listener=grainjs!Listener:class
addListener<T>(callback: ListenerCB<T>, optContext?: T): Listener;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/emit.ts" target="_blank">Defined in emit.ts</a></div>

Adds a listening callback to the list of functions to call on emit().

| Parameter | Description |
| --- | --- |
| `callback` | Function to call. |
| `optContext` | Context for the function. |


::: info Returns

 Listener object. Its dispose() method removes the callback from the list.

:::

### Emitter#dispose {#Emitter#dispose}
```ts refs=
dispose(): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/emit.ts" target="_blank">Defined in emit.ts</a></div>

Disposes the Emitter. It breaks references between the emitter and all the items, allowing for better garbage collection. It effectively disposes all current listeners.

### Emitter#emit {#Emitter#emit}
```ts refs=
emit(...args: any[]): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/emit.ts" target="_blank">Defined in emit.ts</a></div>

Calls all listener callbacks, passing all arguments to each of them.

### Emitter#hasListeners {#Emitter#hasListeners}
```ts refs=
hasListeners(): boolean;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/emit.ts" target="_blank">Defined in emit.ts</a></div>

Returns whether this Emitter has any listeners.

### Emitter#setChangeCB {#Emitter#setChangeCB}
```ts refs=ChangeCB=grainjs!ChangeCB:type
setChangeCB(changeCB: ChangeCB, optContext?: any): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/emit.ts" target="_blank">Defined in emit.ts</a></div>

Sets the single callback that would get called when a listener is added or removed.

| Parameter | Description |
| --- | --- |
| `changeCB` | Function to call after a listener is added or removed. It's called with a boolean indicating whether this Emitter has any listeners. Pass in `null` to unset the callback. Note that it can be called multiple times in a row with hasListeners `true`. |


### fromKo {#fromKo}
```ts refs=IKnockoutObservable=grainjs!IKnockoutObservable:interface|Observable=grainjs!Observable:class|InferKoType=grainjs!InferKoType:type
fromKo<KObs extends IKnockoutObservable<any>>(koObs: KObs): Observable<InferKoType<KObs>>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

Returns a Grain.js observable which mirrors a Knockout observable.

Do not dispose this wrapper, as it is shared by all code using koObs, and its lifetime is tied to the lifetime of koObs. If unused, it consumes minimal resources, and should get garbage collected along with koObs.

### input {#input}
```ts refs=Observable=grainjs!Observable:class|IInputOptions=grainjs!IInputOptions:interface|IDomArgs=grainjs!IDomArgs:interface|HTMLInputElement=mdn#HTMLInputElement|HTMLInputElement=mdn#HTMLInputElement
input(obs: Observable<string>, options: IInputOptions, ...args: IDomArgs<HTMLInputElement>): HTMLInputElement;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/input.ts" target="_blank">Defined in input.ts</a></div>

Creates a input element tied to the given observable. The required options argument allows controlling the behavior, see IInputOptions for details.

This is intended for string input elements, with "type" such as text, email, url, password, number, tel.

Note that every change to the observable will affect the input element, but not every change to the input element will affect the observable. Specifically, unless `{onInput: true}` is set, the visible content may differ from the observable until the element loses focus or Enter is hit.

Example usage:
```
   input(obs, {}, {type: 'text', placeholder: 'Your name...'});
   input(obs, {isValid: isValidObs}, {type: 'email', placeholder: 'Your email...'});
   input(obs, {onInput: true}, {type: 'text'});
```


### KoWrapObs {#KoWrapObs}
```ts refs=Observable=grainjs!Observable:class
class KoWrapObs<T> extends Observable<T>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

An Observable that wraps a Knockout observable, created via `fromKo()`. It keeps minimal overhead when unused by only subscribing to the wrapped observable while it itself has subscriptions.

This way, when unused, the only reference is from the wrapper to the wrapped object. `KoWrapObs` should not be disposed; its lifetime is tied to that of the wrapped object.

### Listener {#Listener}
```ts refs=
class Listener extends LLink
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/emit.ts" target="_blank">Defined in emit.ts</a></div>

The `Listener` object wraps a callback added to an Emitter, allowing for O(1) removal when the listener is disposed. It implements `IDisposable`.

### select {#select}
```ts refs=Observable=grainjs!Observable:class|MaybeObsArray=grainjs!MaybeObsArray:type|IOption=grainjs!IOption:type|HTMLSelectElement=mdn#HTMLSelectElement
select<T>(obs: Observable<T>, optionArray: MaybeObsArray<IOption<T>>, options?: {
    defLabel?: string;
}): HTMLSelectElement;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/select.ts" target="_blank">Defined in select.ts</a></div>

Creates a select dropdown widget. The observable `obs` reflects the value of the selected option, and `optionArray` is an array (regular or observable) of option values and labels. These may be either strings, or `{label, value, disabled}` objects.

The type of value may be any type at all; it is opaque to this widget.

If obs is set to an invalid or disabled value, then defLabel option is used to determine the label that the select box will show, blank by default.

Usage:
```
   const fruit = observable("apple");
   select(fruit, ["apple", "banana", "mango"]);

   const employee = observable(17);
   const employees = obsArray<IOption<number>>([
     {value: 12, label: "Bob", disabled: true},
     {value: 17, label: "Alice"},
     {value: 21, label: "Eve"},
   ]);
   select(employee, employees, {defLabel: "Select employee:"});
```


### setupKoDisposal {#setupKoDisposal}
```ts refs=IKnockoutModule=grainjs!IKnockoutModule:interface
setupKoDisposal(ko: IKnockoutModule): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

Set up integration between grainjs and knockout disposal. Knockout does cleanup using ko.removeNode / ko.cleanNode (it also takes care of JQuery cleanup if needed). GrainJS does cleanup using dom.domDispose(). By default these don't know about each other.

If you mix the two libraries, however, disposing an element may need to trigger disposers registered by either library.

This method ensures that this happens.

Note: grainjs disposes text nodes too, but nothing relies on it. When disposal is triggered via knockout, we are forced to rely on knockout's node traversal which ignores text nodes.

### toKo {#toKo}
```ts refs=IKnockoutModule=grainjs!IKnockoutModule:interface|Observable=grainjs!Observable:class|IKnockoutObservable=grainjs!IKnockoutObservable:interface
toKo<T>(knockout: IKnockoutModule, grainObs: Observable<T>): IKnockoutObservable<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

Returns a Knockout observable which mirrors a Grain.js observable.

## Misc types
### ComputedCallback {#ComputedCallback .hidden-heading}
```ts refs=UseCBOwner=grainjs!UseCBOwner:interface
type ComputedCallback<T> = (use: UseCBOwner, ...args: any[]) => T;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/binding.ts" target="_blank">Defined in binding.ts</a></div>

### DomArg {#DomArg .hidden-heading}
```ts refs=Node=mdn#Node|Node=mdn#Node|IDomArgs=grainjs!IDomArgs:interface|DomMethod=grainjs!DomMethod:type|Element=mdn#Element|IAttrObj=grainjs!IAttrObj:interface
type DomArg<T = Node> = Node | string | void | null | undefined | IDomArgs<T> | DomMethod<T> | (T extends Element ? IAttrObj : never);
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

### DomComponentReturn {#DomComponentReturn .hidden-heading}
```ts refs=DomContents=grainjs!DomContents:type|IDomComponent=grainjs!IDomComponent:interface
type DomComponentReturn = DomContents | IDomComponent;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domComponent.ts" target="_blank">Defined in domComponent.ts</a></div>

### DomComputed {#DomComputed .hidden-heading}
```ts refs=Node=mdn#Node|Node=mdn#Node|DomMethod=grainjs!DomMethod:type
type DomComputed = [Node, Node, DomMethod];
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

### DomContents {#DomContents .hidden-heading}
```ts refs=Node=mdn#Node|DomComputed=grainjs!DomComputed:type|IDomContentsArray=grainjs!IDomContentsArray:interface
type DomContents = Node | string | DomComputed | void | null | undefined | IDomContentsArray;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

### DomCreateFunc {#DomCreateFunc .hidden-heading}
```ts refs=IDomArgs=grainjs!IDomArgs:interface|IDomArgs=grainjs!IDomArgs:interface
type DomCreateFunc<R, Args extends IDomArgs<R> = IDomArgs<R>> = (...args: Args) => R;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/styled.ts" target="_blank">Defined in styled.ts</a></div>

### DomCreatorArgs {#DomCreatorArgs .hidden-heading}
```ts refs=MultiHolder=grainjs!MultiHolder:class
type DomCreatorArgs<T> = T extends (owner: MultiHolder, ...args: infer P) => any ? P : (T extends new (...args: infer P) => any ? P : never);
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domComponent.ts" target="_blank">Defined in domComponent.ts</a></div>

### DomElementArg {#DomElementArg .hidden-heading}
```ts refs=DomArg=grainjs!DomArg:type|HTMLElement=mdn#HTMLElement
type DomElementArg = DomArg<HTMLElement>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

### DomElementMethod {#DomElementMethod .hidden-heading}
```ts refs=DomMethod=grainjs!DomMethod:type|HTMLElement=mdn#HTMLElement
type DomElementMethod = DomMethod<HTMLElement>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

### DomMethod {#DomMethod .hidden-heading}
```ts refs=Node=mdn#Node|DomArg=grainjs!DomArg:type
type DomMethod<T = Node> = (elem: T) => DomArg<T> | void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

### EventCB {#EventCB .hidden-heading}
```ts refs=Event=mdn#Event|Event=mdn#Event|EventTarget=mdn#EventTarget|EventTarget=mdn#EventTarget
type EventCB<E extends Event = Event, T extends EventTarget = EventTarget> = (this: void, event: E, elem: T) => void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

### EventName {#EventName .hidden-heading}
```ts refs=
type EventName = keyof HTMLElementEventMap;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

### EventType {#EventType .hidden-heading}
```ts refs=EventName=grainjs!EventName:type|EventName=grainjs!EventName:type|Event=mdn#Event
type EventType<E extends EventName | string> = E extends EventName ? HTMLElementEventMap[E] : Event;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

### IClsName {#IClsName .hidden-heading}
```ts refs=cls=grainjs!cls:function
interface IClsName {
  className: string;
  cls: typeof cls;
}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/styled.ts" target="_blank">Defined in styled.ts</a></div>

### IDomArgs {#IDomArgs .hidden-heading}
```ts refs=Node=mdn#Node|DomArg=grainjs!DomArg:type
interface IDomArgs<T = Node> extends Array<DomArg<T>> {}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

### IDomComponent {#IDomComponent .hidden-heading}
```ts refs=DomContents=grainjs!DomContents:type
interface IDomComponent {
  buildDom(): DomContents;
}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domComponent.ts" target="_blank">Defined in domComponent.ts</a></div>

### IDomContentsArray {#IDomContentsArray .hidden-heading}
```ts refs=DomContents=grainjs!DomContents:type
interface IDomContentsArray extends Array<DomContents> {}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

### IDomCreateClass {#IDomCreateClass .hidden-heading}
```ts refs=DomComponentReturn=grainjs!DomComponentReturn:type|IDomCreateFunc=grainjs!IDomCreateFunc:type
interface IDomCreateClass<Args extends any[]> {
  new (...args: Args): DomComponentReturn;
  create: IDomCreateFunc<Args>;
}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domComponent.ts" target="_blank">Defined in domComponent.ts</a></div>

### IDomCreateFunc {#IDomCreateFunc .hidden-heading}
```ts refs=MultiHolder=grainjs!MultiHolder:class|DomComponentReturn=grainjs!DomComponentReturn:type
type IDomCreateFunc<Args extends any[]> = (owner: MultiHolder, ...args: Args) => DomComponentReturn;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domComponent.ts" target="_blank">Defined in domComponent.ts</a></div>

### IDomCreator {#IDomCreator .hidden-heading}
```ts refs=IDomCreateFunc=grainjs!IDomCreateFunc:type|IDomCreateClass=grainjs!IDomCreateClass:interface
type IDomCreator<Args extends any[]> = IDomCreateFunc<Args> | IDomCreateClass<Args>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domComponent.ts" target="_blank">Defined in domComponent.ts</a></div>

### IDomDisposeHooks {#IDomDisposeHooks .hidden-heading}
```ts refs=Node=mdn#Node|Node=mdn#Node
interface IDomDisposeHooks {
  disposeNode: (node: Node) => void;
  disposeRecursive: (node: Node) => void;
}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

### IInputOptions {#IInputOptions .hidden-heading}
```ts refs=Observable=grainjs!Observable:class
interface IInputOptions {
  isValid?: Observable<boolean>;
  onInput?: boolean;
}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/input.ts" target="_blank">Defined in input.ts</a></div>

### IKeyHandlers {#IKeyHandlers .hidden-heading}
```ts refs=HTMLElement=mdn#HTMLElement|HTMLElement=mdn#HTMLElement|KeyboardEvent=!KeyboardEvent:interface
interface IKeyHandlers<T extends HTMLElement = HTMLElement> {
  [key: string]: (this: void, ev: KeyboardEvent, elem: T) => void;
}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

### IKnockoutModule {#IKnockoutModule .hidden-heading}
```ts refs=Node=mdn#Node|IKnockoutObservable=grainjs!IKnockoutObservable:interface
interface IKnockoutModule {
  cleanNode(node: Node): void;
  observable<T>(value: T): IKnockoutObservable<T>;
}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

### IKnockoutObservable {#IKnockoutObservable .hidden-heading}
```ts refs=IKnockoutReadObservable=grainjs!IKnockoutReadObservable:interface
interface IKnockoutObservable<T> extends IKnockoutReadObservable<T> {
  (val: T): void;
}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

### IKnockoutReadObservable {#IKnockoutReadObservable .hidden-heading}
```ts refs=
interface IKnockoutReadObservable<T> {
  (): T;
  getSubscriptionsCount(): number;
  peek(): T;
  subscribe(callback: (newValue: T) => void, target?: any, event?: "change"): any;
}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

### InferKoType {#InferKoType .hidden-heading}
```ts refs=IKnockoutReadObservable=grainjs!IKnockoutReadObservable:interface
type InferKoType<KObs extends IKnockoutReadObservable<any>> = KObs extends {
    peek(): infer T;
} ? T : never;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

### InferUseType {#InferUseType .hidden-heading}
```ts refs=Obs=grainjs!BaseObservable:class|IKnockoutReadObservable=grainjs!IKnockoutReadObservable:interface|Obs=grainjs!BaseObservable:class
type InferUseType<TObs extends Obs<any> | IKnockoutReadObservable<any>> = TObs extends Obs<infer T> ? T : TObs extends {
    peek(): infer U;
} ? U : never;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

### INodeFunc {#INodeFunc .hidden-heading}
```ts refs=Node=mdn#Node
type INodeFunc = (node: Node) => void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

### IOption {#IOption .hidden-heading}
```ts refs=IOptionFull=grainjs!IOptionFull:interface
type IOption<T> = (T & string) | IOptionFull<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/select.ts" target="_blank">Defined in select.ts</a></div>

### IOptionFull {#IOptionFull .hidden-heading}
```ts refs=
interface IOptionFull<T> {
  disabled?: boolean;
  label: string;
  value: T;
}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/select.ts" target="_blank">Defined in select.ts</a></div>

### ISpliceListener {#ISpliceListener .hidden-heading}
```ts refs=IObsArraySplice=grainjs!IObsArraySplice:interface
type ISpliceListener<T, C> = (this: C, val: T[], prev: T[], change?: IObsArraySplice<T>) => void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

### ISubscribable {#ISubscribable .hidden-heading}
```ts refs=ISubscribableObs=grainjs!ISubscribableObs:interface|IKnockoutReadObservable=grainjs!IKnockoutReadObservable:interface
type ISubscribable = ISubscribableObs | IKnockoutReadObservable<any>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

### ISubscribableObs {#ISubscribableObs .hidden-heading}
```ts refs=Listener=grainjs!Listener:class
interface ISubscribableObs {
  addListener(callback: (val: any, prev: any) => void, optContext?: object): Listener;
  get(): any;
}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

### KeyEventType {#KeyEventType .hidden-heading}
```ts refs=
type KeyEventType = 'keypress' | 'keyup' | 'keydown';
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

### ListenerCB {#ListenerCB .hidden-heading}
```ts refs=
type ListenerCB<T> = (this: T, ...args: any[]) => void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/emit.ts" target="_blank">Defined in emit.ts</a></div>

### TagElem {#TagElem .hidden-heading}
```ts refs=TagName=grainjs!TagName:type|HTMLElement=mdn#HTMLElement
type TagElem<T extends TagName> = T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

### TagName {#TagName .hidden-heading}
```ts refs=
type TagName = keyof HTMLElementTagNameMap | string;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

### UseCB {#UseCB .hidden-heading}
```ts refs=Obs=grainjs!BaseObservable:class|IKnockoutReadObservable=grainjs!IKnockoutReadObservable:interface|InferUseType=grainjs!InferUseType:type
type UseCB = <TObs extends Obs<any> | IKnockoutReadObservable<any>>(obs: TObs) => InferUseType<TObs>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

### UseCBOwner {#UseCBOwner .hidden-heading}
```ts refs=UseCB=grainjs!UseCB:type|IDisposableOwner=grainjs!IDisposableOwner:interface
interface UseCBOwner extends UseCB {
  owner: IDisposableOwner;
}
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/main/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>
