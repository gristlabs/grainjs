# API Reference
## DOM reference

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

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dom.ts" target="_blank">Defined in dom.ts</a></div>

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

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets an attribute of a DOM element to the given value. Removes the attribute when the value is null or undefined.

::: info Example

```ts
dom('a', dom.attr('href', urlObs))
```


:::

### dom.attrElem {#attrElem}
```ts refs=Element=!Element:interface
attrElem(elem: Element, attrName: string, attrValue: string | null | undefined): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets an attribute of a DOM element to the given value. Removes the attribute when the value is null or undefined. The `attr()` variant takes no `elem` argument, and `attrValue` may be an observable or function.

| Parameter | Description |
| --- | --- |
| `elem` | The element to update. |
| `attrName` | The name of the attribute to bind, e.g. 'href'. |
| `attrValue` | The string value, or null or undefined to remove the attribute. |


### dom.attrsElem {#attrsElem}
```ts refs=Element=!Element:interface|IAttrObj=grainjs!IAttrObj:interface
attrsElem(elem: Element, attrsObj: IAttrObj): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets multiple attributes of a DOM element. The `attrs()` variant takes no `elem` argument. Null and undefined values are omitted, and booleans are either omitted or set to empty string.

| Parameter | Description |
| --- | --- |
| `attrsObj` | Object mapping attribute names to attribute values. |


### dom.boolAttr {#boolAttr}
```ts refs=BindableValue=grainjs!BindableValue:type|DomElementMethod=grainjs!DomElementMethod:type
boolAttr(attrName: string, boolValueObs: BindableValue<boolean>): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Dom-method that sets or removes a boolean attribute of a DOM element.

| Parameter | Description |
| --- | --- |
| `attrName` | The name of the attribute to bind, e.g. 'checked'. |
| `boolValueObs` | Value, observable, or function for a whether to set or unset the attribute. |


### dom.boolAttrElem {#boolAttrElem}
```ts refs=Element=!Element:interface
boolAttrElem(elem: Element, attrName: string, boolValue: boolean): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

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

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets or toggles a css class className. If className is an observable, it will be replaced when the observable changes. If a plain string, then an optional second boolean observable may be given, which will toggle it.
```ts
dom.cls('foo')                                // Sets className 'foo'
dom.cls('foo', isFoo);                        // Toggles 'foo' className according to observable.
dom.cls('foo', (use) => use(isFoo));          // Toggles 'foo' className according to observable.
dom.cls(fooClass);                            // Sets className to the value of fooClass observable
dom.cls((use) => `prefix-${use(fooClass)}`);  // Sets className to prefix- plus fooClass observable.
```


### dom.clsElem {#clsElem}
```ts refs=Element=!Element:interface
clsElem(elem: Element, className: string, boolValue?: boolean): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets or toggles the given css class className.

### dom.clsPrefix {#clsPrefix}
```ts refs=BindableValue=grainjs!BindableValue:type|DomElementMethod=grainjs!DomElementMethod:type|BindableValue=grainjs!BindableValue:type|DomElementMethod=grainjs!DomElementMethod:type
clsPrefix(prefix: string, className: string, boolValue?: BindableValue<boolean>): DomElementMethod;
clsPrefix(prefix: string, className: BindableValue<string>): DomElementMethod;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Just like cls() but prepends a prefix to className, including when it is an observable.

### dom.dataElem {#dataElem}
```ts refs=Node=!Node:interface
dataElem(elem: Node, key: string, value: any): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Associate arbitrary data with a DOM element. The `data()` variant takes no `elem`, and `value` may be an observable or function.

| Parameter | Description |
| --- | --- |
| `elem` | The element with which to associate data. |
| `key` | Key to identify this piece of data among others attached to elem. |
| `value` | Arbitrary value to associate with elem. |


### dom.domComputed {#domComputed}
```ts refs=BindableValue=grainjs!BindableValue:type|Exclude=!Exclude:type|DomArg=grainjs!DomArg:type|DomMethod=grainjs!DomMethod:type|DomComputed=grainjs!DomComputed:type|BindableValue=grainjs!BindableValue:type|DomContents=grainjs!DomContents:type|DomComputed=grainjs!DomComputed:type
domComputed(valueObs: BindableValue<Exclude<DomArg, DomMethod>>): DomComputed;
domComputed<T>(valueObs: BindableValue<T>, contentFunc: (val: T) => DomContents): DomComputed;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

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

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

Like domComputed(), but the callback gets an additional first argument, owner, which may be used to take ownership of objects created by the callback. These will be disposed before each new call to the callback, and when the containing DOM is disposed.

`domComputedOwned(valueObs, (owner, value) => Editor.create(owner, value).renderSomething())`

### dom.find {#find}
```ts refs=Element=!Element:interface
find(selector: string): Element | null;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

Find the first element matching a selector; just an abbreviation for document.querySelector().

### dom.findAll {#findAll}
```ts refs=NodeListOf=!NodeListOf:interface|Element=!Element:interface
findAll(selector: string): NodeListOf<Element>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

Find all elements matching a selector; just an abbreviation for document.querySelectorAll().

### dom.forEach {#forEach}
```ts refs=MaybeObsArray=grainjs!MaybeObsArray:type|Node=!Node:interface|DomContents=grainjs!DomContents:type
forEach<T>(obsArray: MaybeObsArray<T>, itemCreateFunc: (item: T) => Node | null): DomContents;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domForEach.ts" target="_blank">Defined in domForEach.ts</a></div>

Creates DOM elements for each element of an observable array. As the array is changed, children are added or removed. This works for any array-valued observable, and for obsArray() and computedArray() it works more efficiently for simple changes.

The given itemCreateFunc() should return a single DOM node for each item, or null to skip that item. It is called for new items whenever they are spliced in, or the array replaced. The forEach() owns the created nodes, and runs domDispose() on them when they are spliced out.

If the created nodes are removed from their parent externally, forEach() will cope with it, but will consider these elements as no longer owned, and will not run domDispose() on them.

Note that itemCreateFunc() does not receive an index: an index would only be correct at the time the item is created, and would not reflect further changes to the array.

If you'd like to map the DOM node back to its source item, use dom.data() and dom.getData() in itemCreateFunc().

### dom.frag {#frag}
```ts refs=IDomArgs=grainjs!IDomArgs:interface|DocumentFragment=!DocumentFragment:interface|DocumentFragment=!DocumentFragment:interface
frag(...args: IDomArgs<DocumentFragment>): DocumentFragment;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

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

### dom.hideElem {#hideElem}
```ts refs=HTMLElement=!HTMLElement:interface
hideElem(elem: HTMLElement, boolValue: boolean): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

The opposite of show, hiding the element when boolValue is true. The `hide()` variant takes no `elem`, and `boolValue` may be an observable or function.

| Parameter | Description |
| --- | --- |
| `elem` | The element to update. |
| `boolValue` | True to hide the element, false to show it. |


### dom.maybe {#maybe}
```ts refs=BindableValue=grainjs!BindableValue:type|NonNullable=!NonNullable:type|DomContents=grainjs!DomContents:type|DomComputed=grainjs!DomComputed:type
maybe<T>(boolValueObs: BindableValue<T>, contentFunc: (val: NonNullable<T>) => DomContents): DomComputed;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

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
```ts refs=BindableValue=grainjs!BindableValue:type|MultiHolder=grainjs!MultiHolder:class|NonNullable=!NonNullable:type|DomContents=grainjs!DomContents:type|DomComputed=grainjs!DomComputed:type
maybeOwned<T>(boolValueObs: BindableValue<T>, contentFunc: (owner: MultiHolder, val: NonNullable<T>) => DomContents): DomComputed;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

Like maybe(), but the callback gets an additional first argument, owner, which may be used to take ownership of objects created by the callback. These will be disposed before each new call to the callback, and when the condition becomes false or the containing DOM gets disposed.
```ts
   maybeOwned(showEditor, (owner) => Editor.create(owner).renderSomething())
```


### dom.onElem {#onElem}
```ts refs=EventName=grainjs!EventName:type|EventTarget=!EventTarget:interface|EventCB=grainjs!EventCB:type|EventType=grainjs!EventType:type|IDisposable=grainjs!IDisposable:interface
onElem<E extends EventName | string, T extends EventTarget>(elem: T, eventType: E, callback: EventCB<EventType<E>, T>, { useCapture }?: {
    useCapture?: boolean | undefined;
}): IDisposable;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

Listen to a DOM event. The `on()` variant takes no `elem` argument, and may be used as an argument to dom() function.

| Parameter | Description |
| --- | --- |
| `elem` | DOM Element to listen to. |
| `eventType` | Event type to listen for (e.g. 'click'). |
| `callback` | Callback to call as `callback(event, elem)`, where elem is `elem`. |
| `options` | .useCapture: Add the listener in the capture phase. This should very rarely be useful (e.g. JQuery doesn't even offer it as an option). |


::: info Returns

 Listener object whose .dispose() method will remove the event listener.

:::

### dom.onKeyElem {#onKeyElem}
```ts refs=HTMLElement=!HTMLElement:interface|KeyEventType=grainjs!KeyEventType:type|IKeyHandlers=grainjs!IKeyHandlers:interface|IDisposable=grainjs!IDisposable:interface
onKeyElem<T extends HTMLElement>(elem: T, evType: KeyEventType, keyHandlers: IKeyHandlers<T>): IDisposable;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

Listen to key events (typically 'keydown' or 'keypress'), with specified per-key callbacks. Key names are listed at https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values

Methods onKeyPress() and onKeyDown() are intended to be used as arguments to dom().

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


### dom.onMatchElem {#onMatchElem}
```ts refs=EventTarget=!EventTarget:interface|EventCB=grainjs!EventCB:type|IDisposable=grainjs!IDisposable:interface
onMatchElem(elem: EventTarget, selector: string, eventType: string, callback: EventCB, { useCapture }?: {
    useCapture?: boolean | undefined;
}): IDisposable;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domevent.ts" target="_blank">Defined in domevent.ts</a></div>

Listen to a DOM event on descendants of the given elem matching the given selector. The `onMatch()` variant takes no `elem` argument, and may be used as an argument to dom().

| Parameter | Description |
| --- | --- |
| `elem` | DOM Element to whose descendants to listen. |
| `selector` | CSS selector string to filter elements that trigger this event. JQuery calls it "delegated events" (http://api.jquery.com/on/). The callback will only be called when the event occurs for an element matching the given selector. If there are multiple elements matching the selector, the callback is only called for the innermost one. |
| `eventType` | Event type to listen for (e.g. 'click'). |
| `callback` | Callback to call as `callback(event, elem)`, where elem is a descendent of `elem` which matches `selector`. |
| `options` | .useCapture: Add the listener in the capture phase. This should very rarely be useful (e.g. JQuery doesn't even offer it as an option). |


::: info Returns

 Listener object whose .dispose() method will remove the event listener.

:::

### dom.propElem {#propElem}
```ts refs=Node=!Node:interface
propElem<T>(elem: Node, property: string, value: T): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets the property of a DOM element to the given value. The `prop()` variant takes no `elem`, and `value` may be an observable or function.

| Parameter | Description |
| --- | --- |
| `elem` | The element to update. |
| `property` | The name of the property to update, e.g. 'disabled'. |
| `value` | The value for the property. |


### dom.replaceContent {#replaceContent}
```ts refs=Node=!Node:interface|Node=!Node:interface|DomContents=grainjs!DomContents:type
replaceContent(nodeBefore: Node, nodeAfter: Node, content: DomContents): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domComputed.ts" target="_blank">Defined in domComputed.ts</a></div>

Replaces the content between nodeBefore and nodeAfter, which should be two siblings within the same parent node. New content may be anything allowed as an argument to dom(), including null to insert nothing. Runs disposers, if any, on all removed content.

### dom.showElem {#showElem}
```ts refs=HTMLElement=!HTMLElement:interface
showElem(elem: HTMLElement, boolValue: boolean): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Shows or hides the element depending on a boolean value. Note that the element must be visible initially (i.e. unsetting style.display should show it). The `show()` variant takes no `elem`, and `boolValue` may be an observable or function.

| Parameter | Description |
| --- | --- |
| `elem` | The element to update. |
| `boolValue` | True to show the element, false to hide it. |


### dom.styleElem {#styleElem}
```ts refs=Element=!Element:interface
styleElem(elem: Element, property: string, value: string): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Sets a style property of a DOM element to the given value. The `style()` variant takes no `elem`, and `value` may be an observable or function.

| Parameter | Description |
| --- | --- |
| `elem` | The element to update. |
| `property` | The name of the style property to update, e.g. 'fontWeight'. |
| `value` | The value for the property. |


### dom.svg {#svg}
```ts refs=IDomArgs=grainjs!IDomArgs:interface|SVGElement=!SVGElement:interface|SVGElement=!SVGElement:interface
svg(tagString: string, ...args: IDomArgs<SVGElement>): SVGElement;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

svg('tag#id.class1.class2', ...args) Same as dom(...), but creates an SVG element.

### dom.textElem {#textElem}
```ts refs=Node=!Node:interface
textElem(elem: Node, value: string): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

Adds a text node to the element. The `text()` variant takes no `elem`, and `value` may be an observable or function.

| Parameter | Description |
| --- | --- |
| `elem` | The element to update. |
| `value` | The text value to add. |


### dom.update {#update}
```ts refs=Node=!Node:interface|IDomArgs=grainjs!IDomArgs:interface
update<T extends Node, Args extends IDomArgs<T>>(elem: T, ...args: Args): T;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domImpl.ts" target="_blank">Defined in domImpl.ts</a></div>

Update an element with any number of arguments, as documented in dom().

### keyframes {#keyframes}
```ts refs=
keyframes(styles: string): string;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/styled.ts" target="_blank">Defined in styled.ts</a></div>

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

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

See documentation for TestId above.

### noTestId {#noTestId}
```ts refs=TestId=grainjs!TestId:type
noTestId: TestId
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

See documentation for TestId above.

### styled {#styled}
```ts refs=TagName=grainjs!TagName:type|DomCreateFunc=grainjs!DomCreateFunc:type|TagElem=grainjs!TagElem:type|IClsName=grainjs!IClsName:interface|Element=!Element:interface|creator=grainjs!~creator:var|IClsName=grainjs!IClsName:interface
styled<Tag extends TagName>(tag: Tag, styles: string): DomCreateFunc<TagElem<Tag>> & IClsName;
styled<Args extends any[], R extends Element>(creator: (...args: Args) => R, styles: string): typeof creator & IClsName;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/styled.ts" target="_blank">Defined in styled.ts</a></div>

In-code styling for DOM components, inspired by Reacts Styled Components.

Usage:
```ts
const title = styled('h1', `
  font-size: 1.5em;
  text-align: center;
  color: palevioletred;
`);

const wrapper = styled('section', `
  padding: 4em;
  background: papayawhip;
`);

wrapper(title('Hello world'))
```

This generates class names for title and wrapper, adds the styles to the document on first use, and the result is equivalent to:
```ts
dom(`section.${wrapper.className}`, dom(`h1.${title.className}`, 'Hello world'));
```

Calls to styled() should happen at the top level, at import time, in order to register all styles upfront. Actual work happens the first time a style is needed to create an element. Calling styled() elsewhere than at top level is wasteful and bad for performance.

You may create a style that modifies an existing styled() or other component, e.g.
```ts
const title2 = styled(title, `font-size: 1rem; color: red;`);
```

Calling title2('Foo') becomes equivalent to dom(`h1.${title.className}.${title2.className}`).

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

The resulting styled component provides a .cls() helper to simplify using prefixed classes. It behaves as dom.cls(), but prefixes the class names with the generated className of the main element. E.g. for the example above,
```ts
myButton(myButton.cls('-small'), 'Test')
```

creates a button with both the myButton style above, and the style specified under "&-small".

### TestId {#TestId}
```ts refs=DomElementMethod=grainjs!DomElementMethod:type
type TestId = (name: string) => DomElementMethod | null;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domMethods.ts" target="_blank">Defined in domMethods.ts</a></div>

A very simple setup to identify DOM elements for testing purposes. Here's the recommended usage.
```
  // In the component to be tested.
  import {noTestId, TestId} from 'grainjs';

  function myComponent(myArgs, testId: TestId = noTestId) {
    return dom(..., testId("some-name"),
      dom(..., testId("another-name"), ...),
    );
  }
```

In the fixture code using this component:
```
  import {makeTestId} from 'grainjs';

  dom(..., myComponent(myArgs, makeTestId('test-mycomp-'), ...)
```

In the webdriver test code:
```
  driver.find('.test-my-comp-some-name')
  driver.find('.test-my-comp-another-name')
```

When myComponent() is created with testId argument omitted, the testId() calls are no-ops. When makeTestId('test-foo-') is passed in, testId() calls simply add a css class with that prefix.

## Disposable reference

See [Disposables](dispose) for background.

### Disposable {#Disposable}
```ts refs=IDisposable=grainjs!IDisposable:interface|IDisposableOwner=grainjs!IDisposableOwner:interface
abstract class Disposable implements IDisposable, IDisposableOwner
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Base class for disposable objects that can own other objects. See the module documentation.

### Disposable#autoDispose {#Disposable#autoDispose}
```ts refs=IDisposable=grainjs!IDisposable:interface
autoDispose<T extends IDisposable>(obj: T): T;
```
Take ownership of obj, and dispose it when this.dispose() is called.

### Disposable.create {#Disposable.create}
```ts refs=IDisposableOwnerT=grainjs!IDisposableOwnerT:interface|InstanceType=!InstanceType:type|ConstructorParameters=!ConstructorParameters:type|InstanceType=!InstanceType:type
static create<T extends new (...args: any[]) => any>(this: T, owner: IDisposableOwnerT<InstanceType<T>> | null, ...args: ConstructorParameters<T>): InstanceType<T>;
```
Create Disposable instances using `Class.create(owner, ...)` rather than `new Class(...)`.

This reminds you to provide an owner, and ensures that if the constructor throws an exception, dispose() gets called to clean up the partially-constructed object.

Owner may be null if intend to ensure disposal some other way.

### Disposable#dispose {#Disposable#dispose}
```ts refs=
dispose(): void;
```
Clean up `this` by disposing all owned objects, and calling onDispose() callbacks, in reverse order to that in which they were added.

### Disposable#isDisposed {#Disposable#isDisposed}
```ts refs=
isDisposed(): boolean;
```
Returns whether this object has already been disposed.

### Disposable#onDispose {#Disposable#onDispose}
```ts refs=DisposeListener=grainjs!~DisposeListener:class
onDispose<T>(callback: (this: T) => void, context?: T): DisposeListener;
```
Call the given callback when this.dispose() is called.

### Disposable#wipeOnDispose {#Disposable#wipeOnDispose}
```ts refs=
wipeOnDispose(): void;
```
Wipe out this object when it is disposed, i.e. set all its properties to null. It is recommended to call this early in the constructor.

This makes disposal more costly, but has certain benefits: - If anything still refers to the object and uses it, we'll get an early error, rather than silently keep going, potentially doing useless work (or worse) and wasting resources. - If anything still refers to the object (even without using it), the fields of the object can still be garbage-collected. - If there are circular references involving this object, they get broken, making the job easier for the garbage collector.

The recommendation is to use it for complex, longer-lived objects, but to skip for objects which are numerous and short-lived (and less likely to be referenced from unexpected places).

### dom.autoDisposeElem {#autoDisposeElem}
```ts refs=Node=!Node:interface|IDisposable=grainjs!IDisposable:interface
autoDisposeElem(elem: Node, disposable: IDisposable | null): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

Make the given element own the disposable, and call its dispose method when domDispose() is called on the element or any of its parents.

| Parameter | Description |
| --- | --- |
| `elem` | The element to own the disposable. |
| `disposable` | Anything with a .dispose() method. |


### dom.domDispose {#domDispose}
```ts refs=Node=!Node:interface
domDispose(node: Node): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

Run disposers associated with any descendant of elem or with elem itself. Disposers get associated with elements using dom.onDispose(). Descendants are processed first.

It is automatically called if one of the function arguments to dom() throws an exception during element creation. This way any onDispose() handlers set on the unfinished element get called.

| Parameter | Description |
| --- | --- |
| `node` | The element to run disposers on. |


### dom.onDisposeElem {#onDisposeElem}
```ts refs=Node=!Node:interface|INodeFunc=grainjs!INodeFunc:type
onDisposeElem(elem: Node, disposerFunc: INodeFunc): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

Associate a disposerFunc with a DOM element. It will be called when the element is disposed using domDispose() on it or any of its parents. If onDispose is called multiple times, all disposerFuncs will be called in reverse order.

| Parameter | Description |
| --- | --- |
| `elem` | The element to associate the disposer with. |
| `disposerFunc` | Will be called when domDispose() is called on the element or its ancestor. Note that it is not necessary usually to dispose event listeners attached to an element (e.g. with dom.on()) since their lifetime is naturally limited to the lifetime of the element. |


### domDisposeHooks {#domDisposeHooks}
```ts refs=IDomDisposeHooks=grainjs!IDomDisposeHooks:interface
domDisposeHooks: IDomDisposeHooks
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/domDispose.ts" target="_blank">Defined in domDispose.ts</a></div>

Support for extending dom disposal. This is very low-level, and needs utmost care. Any disposers set should take care of calling the original versions of the disposers.

### Holder {#Holder}
```ts refs=IDisposable=grainjs!IDisposable:interface|IDisposable=grainjs!IDisposable:interface|IDisposableOwner=grainjs!IDisposableOwner:interface
class Holder<T extends IDisposable> implements IDisposable, IDisposableOwner
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Holder keeps a single disposable object. If given responsibility for another object using holder.autoDispose() or Foo.create(holder, ...), it automatically disposes the currently held object. It also disposes it when the holder itself is disposed.

If the object is an instance of Disposable, the holder will also notice when the object gets disposed from outside of it, in which case the holder will become empty again.

### Holder#autoDispose {#Holder#autoDispose}
```ts refs=
autoDispose(obj: T): T;
```
Take ownership of a new object, disposing the previously held one.

### Holder#clear {#Holder#clear}
```ts refs=
clear(): void;
```
Disposes the held object and empties the holder.

### Holder#dispose {#Holder#dispose}
```ts refs=
dispose(): void;
```
When the holder is disposed, it disposes the held object if any.

### Holder#get {#Holder#get}
```ts refs=
get(): T | null;
```
Returns the held object, or null if the Holder is empty.

### Holder#isEmpty {#Holder#isEmpty}
```ts refs=
isEmpty(): boolean;
```
Returns whether the Holder is empty.

### Holder#release {#Holder#release}
```ts refs=IDisposable=grainjs!IDisposable:interface
release(): IDisposable | null;
```
Releases the held object without disposing it, emptying the holder.

### IDisposable {#IDisposable}
```ts refs=
interface IDisposable
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Anything with a .dispose() method is a disposable object, and implements the IDisposable interface.

### IDisposableCtor {#IDisposableCtor}
```ts refs=
interface IDisposableCtor<Derived, CtorArgs extends any[]>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

The static portion of class Disposable.

### IDisposableOwner {#IDisposableOwner}
```ts refs=
interface IDisposableOwner
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Type that can own an object of any disposable type.

### IDisposableOwnerT {#IDisposableOwnerT}
```ts refs=IDisposable=grainjs!IDisposable:interface
interface IDisposableOwnerT<T extends IDisposable>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Anything with .autoDispose() can be the owner of a disposable object. This is a type-specific class that can only own a disposable object of type T.

### MultiHolder {#MultiHolder}
```ts refs=Disposable=grainjs!Disposable:class
class MultiHolder extends Disposable
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

MultiHolder keeps multiple disposable object. It disposes all held object when the holder itself is disposed. It's actually nothing more than the Disposable base class itself, just exposed with a clearer name that describes its purpose.

### setDisposeOwner {#setDisposeOwner}
```ts refs=IDisposable=grainjs!IDisposable:interface|IDisposableOwnerT=grainjs!IDisposableOwnerT:interface
setDisposeOwner<T extends IDisposable>(owner: IDisposableOwnerT<T> | null, obj: T): T;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/dispose.ts" target="_blank">Defined in dispose.ts</a></div>

Sets owner of obj (i.e. calls owner.autoDispose(obj)) unless owner is null. Returns obj.

## Observables reference
### BaseObservable {#BaseObservable}
```ts refs=
class BaseObservable<T>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

Base class for several variants of observable values.

### BaseObservable#addListener {#BaseObservable#addListener}
```ts refs=Listener=grainjs!Listener:class
addListener(callback: (val: T, prev: T) => void, optContext?: object): Listener;
```
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
Disposes the observable.

### BaseObservable#get {#BaseObservable#get}
```ts refs=
get(): T;
```
Returns the value of the observable. It is fast and does not create a subscription. (It is similar to knockout's peek()).

::: info Returns

 The current value of the observable.

:::

### BaseObservable#hasListeners {#BaseObservable#hasListeners}
```ts refs=
hasListeners(): boolean;
```
Returns whether this observable has any listeners.

### BaseObservable#isDisposed {#BaseObservable#isDisposed}
```ts refs=
isDisposed(): boolean;
```
Returns whether this observable is disposed.

### BaseObservable#set {#BaseObservable#set}
```ts refs=
set(value: T): void;
```
Sets the value of the observable. If the value differs from the previously set one, then listeners to this observable will get called with (newValue, oldValue) as arguments.

| Parameter | Description |
| --- | --- |
| `value` | The new value to set. |


### BaseObservable#setAndTrigger {#BaseObservable#setAndTrigger}
```ts refs=
setAndTrigger(value: T): void;
```
Sets the value of the observable AND calls listeners even if the value is unchanged.

### BaseObservable#setListenerChangeCB {#BaseObservable#setListenerChangeCB}
```ts refs=
setListenerChangeCB(changeCB: (hasListeners: boolean) => void, optContext?: any): void;
```
Sets a single callback to be called when a listener is added or removed. It overwrites any previously-set such callback.

| Parameter | Description |
| --- | --- |
| `changeCB` | Function to call after a listener is added or removed. It's called with a boolean indicating whether this observable has any listeners. Pass in `null` to unset the callback. Note that it can be called multiple times in a row with hasListeners `true`. |


### BindableValue {#BindableValue}
```ts refs=BaseObservable=grainjs!BaseObservable:class|ComputedCallback=grainjs!ComputedCallback:type|IKnockoutReadObservable=grainjs!IKnockoutReadObservable:interface
type BindableValue<T> = BaseObservable<T> | ComputedCallback<T> | T | IKnockoutReadObservable<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/binding.ts" target="_blank">Defined in binding.ts</a></div>

Any of the value types that DOM methods know how to subscribe to: a plain value (like a string); an Observable (including a Computed); a knockout observable; a function.

If a function, it's used to create a `Computed`, and will be called with a context function `use`, allowing it to depend on other observable values (see documentation for `Computed`).

### Computed#dispose {#Computed#dispose}
```ts refs=
dispose(): void;
```
Disposes the computed, unsubscribing it from all observables it depends on.

### Computed#onWrite {#Computed#onWrite}
```ts refs=Computed=grainjs!Computed:class
onWrite(writeFunc: (value: T) => void): Computed<T>;
```
Set callback to call when this.set(value) is called, to make it a writable computed. If not set, attempting to write to this computed will throw an exception.

### Computed#set {#Computed#set}
```ts refs=
set(value: T): void;
```
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

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/computed.ts" target="_blank">Defined in computed.ts</a></div>

This is the type-checking interface for computed(), which allows TypeScript to do helpful type-checking when using it. We can only support a fixed number of argumnets (explicit dependencies), but 5 should almost always be enough.

### ComputedArray {#ComputedArray}
```ts refs=ObsArray=grainjs!ObsArray:class
class ComputedArray<T, U> extends ObsArray<U>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

See computedArray() below for documentation.

### computedArray {#computedArray}
```ts refs=BaseObservable=grainjs!BaseObservable:class|Observable=grainjs!Observable:class|BaseObservable=grainjs!BaseObservable:class|ComputedArray=grainjs!ComputedArray:class|ObsArray=grainjs!ObsArray:class
computedArray<T, U>(obsArr: BaseObservable<T[]> | Observable<BaseObservable<T[]>>, mapper: (item: T, index: number, arr: ComputedArray<T, U>) => U): ObsArray<U>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Returns an ObsArray that maps all elements of the passed-in ObsArray through a mapper function. Also accepts an observable (e.g. a computed) whose value is an ObsArray. Usage:
```
   computedArray(obsArray, mapper)
```

The result is entirely analogous to:
```
    computed((use) => use(obsArray).map(mapper))       // for ObsArray
    computed((use) => use(use(obsArray)).map(mapper))  // for Observable<ObsArray>
```

The benefit of computedArray() is that a small change to the source array (e.g. one item added or removed), causes a small change to the mapped array, rather than a full rebuild.

This is useful with an ObsArray or with an observable whose value is an ObsArray, and also when the computed array owns its disposable items.

Note that the mapper function is called with (item, index, array) as for a standard array.map(), but that the index is only accurate at the time of the call, and will stop reflecting the true index if more items are inserted into the array later.

### IObsArraySplice {#IObsArraySplice}
```ts refs=
interface IObsArraySplice<T>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Info about a modification to ObsArray contents. It is included as a third argument to change listeners when available. When not available, listeners should assume that the array changed completely.

### makeLiveIndex {#makeLiveIndex}
```ts refs=IDisposableOwnerT=grainjs!IDisposableOwnerT:interface|LiveIndex=grainjs!LiveIndex:class|ObsArray=grainjs!ObsArray:class|LiveIndex=grainjs!LiveIndex:class
makeLiveIndex<T>(owner: IDisposableOwnerT<LiveIndex> | null, obsArr: ObsArray<T>, initialIndex?: number): LiveIndex;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Returns a new observable representing an index into this array. It can be read and written, and its value is clamped to be a valid index. The index is only null if the array is empty.

As the array changes, the index is adjusted to continue pointing to the same element. If the pointed element is deleted, the index is adjusted to after the deletion point.

The returned observable has an additional .setLive(bool) method. While set to false, the observable will not be adjusted as the array changes, except to keep it valid.

### MaybeObsArray {#MaybeObsArray}
```ts refs=BaseObservable=grainjs!BaseObservable:class
type MaybeObsArray<T> = BaseObservable<T[]> | T[];
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Either an observable or a plain array of T. This is useful for functions like dom.forEach() which are convenient to have available for both.

### MutableObsArray {#MutableObsArray}
```ts refs=ObsArray=grainjs!ObsArray:class
class MutableObsArray<T> extends ObsArray<T>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

`MutableObsArray<T>` adds array-like mutation methods which emit events with splice info, to allow more efficient processing of such changes. It is created with `obsArray<T>()`.

### ObsArray {#ObsArray}
```ts refs=BaseObservable=grainjs!BaseObservable:class
class ObsArray<T> extends BaseObservable<T[]>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

`ObsArray<T>` is essentially an array-valued observable. The main difference is that it may be used as an owner for disposable array elements.

### obsArray {#obsArray}
```ts refs=MutableObsArray=grainjs!MutableObsArray:class
obsArray<T>(value?: T[]): MutableObsArray<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/obsArray.ts" target="_blank">Defined in obsArray.ts</a></div>

Creates a new MutableObsArray with an optional initial value, defaulting to the empty array. It is essentially the same as `observable<T[]>`, but with array-like mutation methods.

### Observable {#Observable}
```ts refs=BaseObservable=grainjs!BaseObservable:class|IDisposableOwnerT=grainjs!IDisposableOwnerT:interface|IDisposable=grainjs!IDisposable:interface
class Observable<T> extends BaseObservable<T> implements IDisposableOwnerT<T & IDisposable>
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

An Observable holds a value and allows subscribing to changes.

### Observable#autoDispose {#Observable#autoDispose}
```ts refs=IDisposable=grainjs!IDisposable:interface|IDisposable=grainjs!IDisposable:interface
autoDispose(value: T & IDisposable): T & IDisposable;
```
The use an observable for a disposable object, use it a DisposableOwner:

D.create(obs, ...args) // Preferred obs.autoDispose(D.create(null, ...args)) // Equivalent

Either of these usages will set the observable to the newly created value. The observable will dispose the owned value when it's set to another value, or when it itself is disposed.

### Observable.create {#Observable.create}
```ts refs=IDisposableOwnerT=grainjs!IDisposableOwnerT:interface|Observable=grainjs!Observable:class|Observable=grainjs!Observable:class
static create<T>(owner: IDisposableOwnerT<Observable<T>> | null, value: T): Observable<T>;
```
Creates a new Observable with the given initial value, and owned by owner.

### observable {#observable}
```ts refs=Observable=grainjs!Observable:class
observable<T>(value: T): Observable<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

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

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/observable.ts" target="_blank">Defined in observable.ts</a></div>

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

### PureComputed#dispose {#PureComputed#dispose}
```ts refs=
dispose(): void;
```
Disposes the pureComputed, unsubscribing it from all observables it depends on.

### PureComputed#onWrite {#PureComputed#onWrite}
```ts refs=PureComputed=grainjs!PureComputed:class
onWrite(writeFunc: (value: T) => void): PureComputed<T>;
```
Set callback to call when this.set(value) is called, to make it a writable computed. If not set, attempting to write to this computed will throw an exception.

### PureComputed#set {#PureComputed#set}
```ts refs=
set(value: T): void;
```
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

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/pureComputed.ts" target="_blank">Defined in pureComputed.ts</a></div>

This is the type-checking interface for pureComputed(), which allows TypeScript to do helpful type-checking when using it. We can only support a fixed number of argumnets (explicit dependencies), but 5 should almost always be enough.

### subscribe {#subscribe}
```ts refs=UseCB=grainjs!UseCB:type|Subscription=grainjs!Subscription:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCB:type|Subscription=grainjs!Subscription:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCB:type|Subscription=grainjs!Subscription:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCB:type|Subscription=grainjs!Subscription:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCB:type|Subscription=grainjs!Subscription:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|Obs=grainjs!BaseObservable:class|UseCB=grainjs!UseCB:type|Subscription=grainjs!Subscription:class
subscribe(cb: (use: UseCB) => void): Subscription;
subscribe<A>(a: Obs<A>, cb: (use: UseCB, a: A) => void): Subscription;
subscribe<A, B>(a: Obs<A>, b: Obs<B>, cb: (use: UseCB, a: A, b: B) => void): Subscription;
subscribe<A, B, C>(a: Obs<A>, b: Obs<B>, c: Obs<C>, cb: (use: UseCB, a: A, b: B, c: C) => void): Subscription;
subscribe<A, B, C, D>(a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>, cb: (use: UseCB, a: A, b: B, c: C, d: D) => void): Subscription;
subscribe<A, B, C, D, E>(a: Obs<A>, b: Obs<B>, c: Obs<C>, d: Obs<D>, e: Obs<E>, cb: (use: UseCB, a: A, b: B, c: C, d: D, e: E) => void): Subscription;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/subscribe.ts" target="_blank">Defined in subscribe.ts</a></div>

This is the type-checking interface for subscribe(), which allows TypeScript to do helpful type-checking when using it. We can only support a fixed number of argumnets (explicit dependencies), but 5 should almost always be enough.

### subscribeBindable {#subscribeBindable}
```ts refs=IKnockoutReadObservable=grainjs!IKnockoutReadObservable:interface|InferKoType=grainjs!InferKoType:type|IDisposable=grainjs!IDisposable:interface|BindableValue=grainjs!BindableValue:type|IDisposable=grainjs!IDisposable:interface
subscribeBindable<KObs extends IKnockoutReadObservable<any>>(valueObs: KObs, callback: (val: InferKoType<KObs>) => void): IDisposable | null;
subscribeBindable<T>(valueObs: BindableValue<T>, callback: (val: T) => void): IDisposable | null;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/binding.ts" target="_blank">Defined in binding.ts</a></div>

Subscribes a callback to valueObs, which may be one a plain value, an observable, a knockout observable, or a function. If a function, it's used to create a computed() and will be called with a context function `use`, allowing it to depend on other observable values (see documentation for `computed`).

In all cases, `callback(newValue, oldValue)` is called immediately and whenever the value changes. On the initial call, oldValue is undefined.

Returns an object which should be disposed to remove the created subscriptions, or null.

### subscribeElem {#subscribeElem}
```ts refs=Node=!Node:interface|BindableValue=grainjs!BindableValue:type
subscribeElem<T>(elem: Node, valueObs: BindableValue<T>, callback: (newVal: T, oldVal?: T) => void): void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/binding.ts" target="_blank">Defined in binding.ts</a></div>

Subscribes a callback to valueObs (which may be a value, observable, or function) using subscribe(), and disposes the subscription with the passed-in element.

### Subscription#dispose {#Subscription#dispose}
```ts refs=
dispose(): void;
```
Disposes the computed, unsubscribing it from all observables it depends on.

## Other
### bindB {#bindB}
```ts refs=
bindB<R>(func: (...args: any[]) => R, b: any[]): () => R;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/util.ts" target="_blank">Defined in util.ts</a></div>

Returns f such that f() calls func(...boundArgs), i.e. optimizes `() => func(...boundArgs)`. It is faster on node6 by 57-92%.

### bindBU {#bindBU}
```ts refs=
bindBU<R>(func: (...args: any[]) => R, b: any[]): (arg: any) => R;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/util.ts" target="_blank">Defined in util.ts</a></div>

Returns f such that f(unboundArg) calls func(...boundArgs, unboundArg). I.e. optimizes `(arg) => func(...boundArgs, arg)`. It is faster on node6 by 0-92%.

### bindUB {#bindUB}
```ts refs=
bindUB<U, R>(func: (arg: U, ...args: any[]) => R, b: any[]): (arg: U) => R;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/util.ts" target="_blank">Defined in util.ts</a></div>

Returns f such that f(unboundArg) calls func(unboundArg, ...boundArgs). I.e. optimizes `(arg) => func(arg, ...boundArgs)`. It is faster on node6 by 0-92%.

### bundleChanges {#bundleChanges}
```ts refs=
bundleChanges<T>(func: () => T): T;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/_computed_queue.ts" target="_blank">Defined in _computed_queue.ts</a></div>

Defer recomputations of all computed observables and subscriptions until func() returns. This is useful to avoid unnecessary recomputation if you are making several changes to observables together. This function is exposed as `observable.bundleChanges()`.

Note that this intentionally does not wait for promises to be resolved, since that would block all updates to all computeds while waiting.

### Emitter#addListener {#Emitter#addListener}
```ts refs=ListenerCB=grainjs!ListenerCB:type|Listener=grainjs!Listener:class
addListener<T>(callback: ListenerCB<T>, optContext?: T): Listener;
```
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
Disposes the Emitter. It breaks references between the emitter and all the items, allowing for better garbage collection. It effectively disposes all current listeners.

### Emitter#emit {#Emitter#emit}
```ts refs=
emit(...args: any[]): void;
```
Calls all listener callbacks, passing all arguments to each of them.

### Emitter#hasListeners {#Emitter#hasListeners}
```ts refs=
hasListeners(): boolean;
```
Returns whether this Emitter has any listeners.

### Emitter#setChangeCB {#Emitter#setChangeCB}
```ts refs=ChangeCB=grainjs!ChangeCB:type
setChangeCB(changeCB: ChangeCB, optContext?: any): void;
```
Sets the single callback that would get called when a listener is added or removed.

| Parameter | Description |
| --- | --- |
| `changeCB` | Function to call after a listener is added or removed. It's called with a boolean indicating whether this Emitter has any listeners. Pass in `null` to unset the callback. Note that it can be called multiple times in a row with hasListeners `true`. |


### fromKo {#fromKo}
```ts refs=IKnockoutObservable=grainjs!IKnockoutObservable:interface|Observable=grainjs!Observable:class|InferKoType=grainjs!InferKoType:type
fromKo<KObs extends IKnockoutObservable<any>>(koObs: KObs): Observable<InferKoType<KObs>>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

Returns a Grain.js observable which mirrors a Knockout observable.

Do not dispose this wrapper, as it is shared by all code using koObs, and its lifetime is tied to the lifetime of koObs. If unused, it consumes minimal resources, and should get garbage collected along with koObs.

### input {#input}
```ts refs=Observable=grainjs!Observable:class|IInputOptions=grainjs!IInputOptions:interface|IDomArgs=grainjs!IDomArgs:interface|HTMLInputElement=!HTMLInputElement:interface|HTMLInputElement=!HTMLInputElement:interface
input(obs: Observable<string>, options: IInputOptions, ...args: IDomArgs<HTMLInputElement>): HTMLInputElement;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/input.ts" target="_blank">Defined in input.ts</a></div>

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

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

An Observable that wraps a Knockout observable, created via fromKo(). It keeps minimal overhead when unused by only subscribing to the wrapped observable while it itself has subscriptions.

This way, when unused, the only reference is from the wrapper to the wrapped object. KoWrapObs should not be disposed; its lifetime is tied to that of the wrapped object.

### Listener {#Listener}
```ts refs=LLink=grainjs!LLink:class
class Listener extends LLink
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/emit.ts" target="_blank">Defined in emit.ts</a></div>

Listener object wraps a callback added to an Emitter, allowing for O(1) removal when the listener is disposed.

### ListenerCB {#ListenerCB}
```ts refs=
type ListenerCB<T> = (this: T, ...args: any[]) => void;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/emit.ts" target="_blank">Defined in emit.ts</a></div>

emit.js implements an Emitter class which emits events to a list of listeners. Listeners are simply functions to call, and "emitting an event" just calls those functions.

This is similar to Backbone events, with more focus on efficiency. Both inserting and removing listeners is constant time.

To create an emitter: let emitter = new Emitter();

To add a listener: let listener = fooEmitter.addListener(callback); To remove a listener: listener.dispose();

The only way to remove a listener is to dispose the Listener object returned by addListener(). You can often use autoDispose to do this automatically when subscribing in a constructor: this.autoDispose(fooEmitter.addListener(this.onFoo, this));

To emit an event, call emit() with any number of arguments: emitter.emit("hello", "world");

### LLink {#LLink}
```ts refs=
class LLink
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/emit.ts" target="_blank">Defined in emit.ts</a></div>

This is an implementation of a doubly-linked list, with just the minimal functionality we need.

### select {#select}
```ts refs=Observable=grainjs!Observable:class|MaybeObsArray=grainjs!MaybeObsArray:type|IOption=grainjs!IOption:type|HTMLSelectElement=!HTMLSelectElement:interface
select<T>(obs: Observable<T>, optionArray: MaybeObsArray<IOption<T>>, options?: {
    defLabel?: string;
}): HTMLSelectElement;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/select.ts" target="_blank">Defined in select.ts</a></div>

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

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

Set up integration between grainjs and knockout disposal. Knockout does cleanup using ko.removeNode / ko.cleanNode (it also takes care of JQuery cleanup if needed). GrainJS does cleanup using dom.domDispose(). By default these don't know about each other.

If you mix the two libraries, however, disposing an element may need to trigger disposers registered by either library.

This method ensures that this happens.

Note: grainjs disposes text nodes too, but nothing relies on it. When disposal is triggered via knockout, we are forced to rely on knockout's node traversal which ignores text nodes.

### toKo {#toKo}
```ts refs=IKnockoutModule=grainjs!IKnockoutModule:interface|Observable=grainjs!Observable:class|IKnockoutObservable=grainjs!IKnockoutObservable:interface
toKo<T>(knockout: IKnockoutModule, grainObs: Observable<T>): IKnockoutObservable<T>;
```

<div class="source-link"><a href="https://github.com/gristlabs/grainjs/blob/master/lib/kowrap.ts" target="_blank">Defined in kowrap.ts</a></div>

Returns a Knockout observable which mirrors a Grain.js observable.
