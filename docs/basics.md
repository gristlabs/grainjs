# DOM & Observables

In this page, we describe how to build DOM in GrainJS and how to tie it to observables.

## DOM Construction

Here’s an example of DOM construction using GrainJS:

```typescript
import {dom} from 'grainjs';

dom('a', {href: 'https://github.com/gristlabs/grainjs'},
  dom.cls('biglink'),
  'Hello ', dom('span', 'world')
);
```

This constructs an element equivalent to the following HTML:

```html
<a href="https://github.com/gristlabs/grainjs" class="biglink">
  Hello <span>world</span>
</a>
```

The workhorse of DOM construction is the function `dom()`. Various helpers useful with it are
available as its properties, e.g. `dom.cls()`, `dom.attr()`, etc. The function has the following
usage:

```typescript
dom(tag, ...args)
```

where `args` are optional, and may be:

* Nodes - which become children of the created element (e.g. `dom('span', 'world')` above).
* strings - which become text node children (e.g. `'Hello '` above).
* objects - of the form `{attr: val}` to set additional attributes on the element (e.g. `{href: ...}` above).
* Arrays - which are flattened with each item processed recursively.
* functions - which are called with the element being constructed as the argument, for a chance to
  modify it. Return values are processed recursively. E.g. `(elem) => elem.classList.add('myclass')`
  is a valid argument.
* "dom methods" - expressions such as `dom.cls('biglink')` above, or `dom.hide(obs)`, which are
  actually special cases of the "functions" category. More on this later, as this is where
  observables come in.

The first `tag` argument is the tag name of the element to create, e.g. `"div"`.

The tag may contain optional `#foo` suffix to add the ID `"foo"` to the element, and zero or more
`.bar` suffixes to add a CSS class `"bar"` (for example, `dom('div#foo.bar')`), but these optional
suffixes interfere with accurate typings, and are neither recommended nor useful.
- The `id` attributes are almost never needed when using GrainJS (the element constructed
is always available as a variable). If you were to need it, pass `{id: 'foo'}` instead.
- CSS classes are usually better auto-assigned by using the `styled()` function. If you need a class
  with a particular name, use `{className: 'bar'}` or `dom.cls('bar')`.

One benefit of GrainJS is that by avoiding direct use of DOM IDs and classes, we
avoid worrying about name collisions. Javascript does a better job of modularizing code, so it’s
better to identify things using variables.

## Observables

Observables are merely variables that allow listening to changes in them. In GrainJS, the
recommended way to create an observable is:

```ts
const showBoxObs = Observable.create(owner, false);
```

The first argument to `Observable.create` is the owner of the resulting object -- more on that
later. You may pass in null in its place, as in `Observable.create(null, value)`.

Once you have an observable, you can get or set its value:

```typescript
showBoxObs.set(true);
if (!showBoxObs.get()) { ... }
```

And, importantly, you can subscribe to changes to its value:

```typescript
const listener = showBoxObs.addListener(val => console.log("Value:", val));
```

### Computed Observables

A "Computed" or a "Computed Observable" is an observable whose value depends on other observables
and gets recalculated automatically when they change.

For example, let's say we have some existing observables (which may themselves be instances of
`Computed`). We can create a computed whose value is equal to their sum:

```typescript
const obs1 = Observable.create(owner, 5);
const obs2 = Observable.create(owner, 12);
const computed1 = Computed.create(owner, use => use(obs1) + use(obs2));
```

Here, the value of `computed1`, i.e. `computed1.get()`, will be 17.

The call `use(obs1)` returns the same value as `obs1.get()`, but also tells the computed to depend
on this observable. So if you call `obs1.set(10)`, then `computed1` will get recomputed, and
`computed1.get()` will evaluate to 22.

The `use()` function, made available to the callback supplied to the Computed, is one significant
difference to Knockout.js (which inspired this feature). Knockout creates a dependency on any
observable used while the callback is executing; GrainJS intentionally makes dependency-creation
explicit -- it only happens when the `use` function is, well, used.

There is another, even more explicit way to make a computed depend on another observable: pass in
the dependencies into the constructor:

```typescript
const computed2 = Computed.create(owner, obs1, obs2,
    (use, value1, value2) => value1 + value2);
```

Here, `computed2` will depend on `obs1` and `obs2`, and any time either of those is updated, the
callback will get called with their explicit values. This way is slightly more efficient.
Otherwise, the two ways of creating computed observables are equivalent, and you may mix and match
explicit dependencies, and dependencies created with the `use()` function.


## DOM Bindings

The DOM construction approach and the observables are made to work together. Let’s take the DOM
example we started with, and make it more dynamic:

```typescript
const isBigObs = Observable.create(null, true);
const hrefObs = Observable.create(null, 'https://github.com/gristlabs/grainjs');
const nameObs = Observable.create(null, 'world');

dom('a',
  dom.cls('biglink', isBigObs),
  dom.attr('href', hrefObs),
  'Hello ', dom('span', dom.text(nameObs))
);
```

So far, this builds the exact same DOM as the [original example](#dom-construction). But now,
changing any of the observables will immediately update the DOM. For instance:

```typescript
isBigObs.set(false);          // Turns off `biglink` CSS class
hrefObs.set('about:blank');   // Changes the 'href' attribute
nameObs.set('Bart');          // Changes the text of the SPAN to "Bart"
```

Note that to get this dynamic behavior, we had to use methods that support observables, e.g.
replace `{href: value}` with `dom.attr('href', value)`, and use `dom.text(contentString)` rather
than pass in a plain string as an argument.

Let’s say that instead of adding the `'biglink'` CSS class whenever `isBigObs` is true, you want
to add the `'small-link'` CSS class whenever `isBigObs` is false. One way is to create a suitable
computed for the inverted condition:

```typescript
const isSmallObs = Computed.create(null, use => !use(isBigObs));
dom('a',
  dom.cls('small-link', isSmallObs),
  ...
);
```

Such manipulations are common enough that there is a shortcut. You can replace
an observable argument with a callback which will be used to create a computed automatically:

```ts
dom('a',
  dom.cls('small-link', use => !use(isBigObs)),
  ...
);
```

Notice also a difference here with React-like DOM construction. GrainJS is very direct. The use of
an observable creates a subscription, so that whenever the observable value changes, the
corresponding property gets updated directly. There is no constructing of virtual DOM and
figuring out differences. This can be a plus or a minus, depending on the situation.

Notice also that the goal here is to allow you to describe DOM declaratively once. Anything
dynamic is controlled by observables. You don’t need to tweak DOM directly; to update what the user
sees, you only set the observables. In other words, the observables are the model of your
application state, and the DOM with bindings is the view.

### Conditional DOM

Sometimes you want to include an element if some observable is set, and to omit it otherwise. The
method for that is `dom.maybe`. For example:

```typescript
dom('div',
  dom.maybe(isChangedObs, () =>
    dom('button', 'Save')
  )
);
```

Whenever `isChangedObs` is true, a BUTTON element will be created and attached to the DIV;
whenever it’s false, the BUTTON will be removed. Note that it’s OK for `dom.maybe()` to be present
among other child nodes of the DIV; it will be inserted into the right spot.

Sometimes, depending on the observable, you’ll want to insert different DOM elements. For that,
use `dom.domComputed`:

```typescript
dom('div',
  dom.domComputed(isChangedObs, (isChanged) =>
    isChanged ?
      [dom('button', 'Save'), dom('button', 'Revert')] :
      dom('button', 'Close')
   )
);
```

In this case, when `isChangedObs` is true, two elements will be inserted — “Save” and “Revert”
buttons (yes, you may return an array of elements). When it’s false, those
two buttons will be removed, and a single “Close” button will be inserted instead.

### Repeating DOM

If you want to insert multiple DOM elements, remember that you can simply include an array of them
as an argument to the `dom()` function:

```typescript
const items = ['Apples', 'Pears', 'Peaches'];
dom('ul',
  items.map(item => dom('li', item))
);
```

But what if the list of items may change? If so, make it an observable, and use `dom.forEach()`:

```typescript
const items = Observable.create(null, ['Apples', 'Pears', 'Peaches']);
dom('ul',
  dom.forEach(items, item => dom('li', item))
);
```

If you now set `items.set(['Bananas'])`, the three LI elements created initially will get removed,
and a single LI element for the new item will be inserted.

For array-valued observables that are likely to change in small increments, GrainJS provides
`obsArray`:

```typescript
const items = obsArray(['Apples', 'Pears']);
dom('ul',
  dom.forEach(items, item => dom('li', item))
);
items.push('Peaches');          // One more LI element will be appended
items.splice(1, 1, 'Bananas');  // Replace LI element for Pears with one for Bananas
```

The purpose of `obsArray` is to allow observing small changes like those above, and so to update
relevant DOM elements without rebuilding them all.

When using `dom.forEach`, the per-item callback may not return an array of DOM elements — it may
only return a single DOM element or null (to omit that item from DOM).

### DOM Events

GrainJS provides some convenient methods for listening to DOM events:

```typescript
dom('button', 'Click Me',
  dom.on('click', (event, elem) => ...),
  dom.on('focus', (event, elem) => ...),
);
```

The callback receives the event, as well as the element that the handler is attached to (the
BUTTON in this example). The passed-in element may be different from `event.target` if the
target is some child or descendant of `elem`.

You may pass in a third argument of `{useCapture: true}` for the (rare) situations when you want
to pass true for the `useCapture` parameter of the native `addEventListener` method.

For keyboard events, there are some extra helpers: `dom.onKeyPress()` and `dom.onKeyDown()`:

```typescript
dom('input', {type: 'text'},
  dom.onKeyDown({
    Enter: (ev, elem) => ...,
    Escape: (ev, elem) => ...,
    ArrowLeft$: (ev, elem) => ...,
  })
);
```

The keys of the passed-in object are the KeyboardEvent's
[Key Values](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values).
By default, registered keyboard events are stopped from bubbling with `stopPropagation()` and
`preventDefault()`. If, however, you register a key with a `"$"` suffix (i.e. `Enter$` instead of
`Enter`), then the event is allowed to bubble normally.

For completeness, we should mention `dom.onMatch()`:

```typescript
dom.onMatch('.some-selector', 'click', (event, elem) => ...)
```

It is analogous to JQuery's delegated event handlers. It turns out to be rarely useful. When
attached to an element, it listens to DOM events on the descendants of that element which match
`'.some-selector'`. In practice, it listens to the events that bubble up to the element that it’s
attached to, but only calls the callback when there is an ancestor of `event.target` that matches
the selector. The matching elememt is then provided as the `elem` argument to the callback.


## Styling DOM

GrainJS offers a TypeScript-based approach to styling DOM elements, inspired by React's Styled
Components. All it does is automate generating and assigning a unique CSS class to
an element. The main benefit here is in module-based naming and the various help from TypeScript
with names, and with knowing the types of created elements.

You can defined a “styled” element like so:

```js
const {dom, styled} = grainjs;

const cssTitle = styled('h1', `
  font-size: 1.5em;
  text-align: center;
  color: palevioletred;
`);

const cssWrapper = styled('section', `
  padding: 0.5em 4em;
  background: papayawhip;
`);

dom.update(document.body,
  cssWrapper(cssTitle('Hello world'))
);
```
<GrainJsExample heightRem=5 />

This generates unique class names for `cssTitle` and `cssWrapper`, adding the styles to the
document on first use. The result is equivalent to:

```typescript
dom('section', {className: cssWrapper.className},
  dom('h1', {className: cssTitle.className},
    'Hello world'));
```

Calls to `styled()` should happen at the top level, at import time, in order to register all
styles upfront. Actual work to attach styles to the doc happens the first time a style is needed
to create an element. Calling `styled()` elsewhere than at the top level is wasteful and bad for
performance.

By convention, styled elements are named with `css` prefix, and are placed at the bottom of the
module in which they are used.

You may create a style that modifies an existing `styled()` or other component, or any
Element-returning function, e.g.

```typescript
const cssTitle2 = styled(cssTitle, `font-size: 1rem; color: red;`);
```

Calling `cssTitle2('Foo')` becomes equivalent to `dom('h1')` with both `cssTitle.className` and
`cssTitle2.className` classes turned on.

Styles may incorporate other related styles, or related media queries, by nesting them under the
main one as follows:

```typescript
const cssButton = styled('button', `
    border-radius: 0.5rem;
    border: 1px solid grey;
    font-size: 1rem;

    &:active {
        background: lightblue;
    }
    &-small {
        font-size: 0.6rem;
    }
    @media print {
      & {
        display: none;
      }
    }
`);
```

In nested styles, ampersand (&) gets replaced with the generated `.className` of the main element.
Blocks of related styles must appear after all the styles that apply to the
main element.

The resulting styled component provides a `.cls()` helper to simplify using prefixed classes. It
behaves as `dom.cls()`, but prefixes the class names with the generated `className` of the main
element. E.g. for the example above,

```typescript
cssButton(cssButton.cls('-small'), 'Test')
```

creates a button with both the `cssButton` style above, and the style specified under `&-small`.
This can also be used with an observable, e.g. `cssButton.cls('-small', useSmallButtonsObs)`.

### Animations

In a similar approach to creating CSS classes from Javascript, you can create `@keyframes`
animations by using the `keyframes()` helper. It returns the generated unique name:

```typescript
const rotate360 = keyframes(`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`);

const Rotate = styled('div', `
  display: inline-block;
  animation: ${rotate360} 2s linear infinite;
`);
```
