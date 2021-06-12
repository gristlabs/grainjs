# GrainJS Introduction

In this page, we describe how to build DOM in GrainJS and how to tie it to observables.

## DOM Construction

Here’s an example of DOM construction using GrainJS:

```
import {dom} from 'grainjs';

dom('a', {href: 'https://github.com/gristlabs/grainjs'},
  dom.cls('biglink'),
  'Hello ', dom('span', 'world')
);
```

This constructs an element equivalent to the following HTML:

```
<a class="biglink" href="https://github.com/gristlabs/grainjs">
  Hello <span>world</span>
</a>
```

The workhorse of DOM construction is the function `dom()`. Various helpers useful with it are
available as its properties, e.g. `dom.cls()`, `dom.attr()`, etc. The function has the following
usage:

```
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
suffixes are not actually recommended. They add minimal convenience and prevent accurate typings.
For example:

* `dom('input', {id: 'foo'}, (elem) => ...)` --> elem has type HTMLInputElement (recommended)
* `dom('input#foo',          (elem) => ...)` --> elem has type HTMLElement

Note that DOM `id` attributes are almost never needed when using GrainJS (the element constructed
is always available as a variable), and CSS classes are usually better assigned by using the
`styled()` function of GrainJS. In both cases, by avoiding direct use of DOM IDs and classes, we
avoid worrying about name collisions. Javascript does a better job of modularizing code, so it’s
better to identify things using JS variables (or better yet TypeScript variables).


## Observables

Observables are merely variables that allow listening to changes in them. In GrainJS, the
recommended way to create an observable is:

```
const showPanelObs: Observable<boolean> = Observable.create(owner, false);
```

The first argument to `Observable.create` is the owner of the resulting object -- more on that
later. You may pass in null in its place, as in `Observable.create(null, initialValue)`.

Once you have an observable, you can get or set its value:

```
showPanelObs.set(true);
if (!showPanelObs.get()) { ... }
```

And, importantly, you can subscribe to changes to its value:

```
const listener = showPanelObs.addListener(val => console.log("New value:", val));
```

## Computed Observables

A "Computed" or a "Computed Observable" is an observable whose value depends on other observables
and gets recalculated automatically when they change.

For example, let's say we have some existing observables (which may themselves be instances of
`Computed`). We can create a computed whose value is equal to their sum:

```
const obs1 = Observable.create(owner, 5);
const obs2 = Observable.create(owner, 12);
const computed1 = Computed.create(owner, use => use(obs1) + use(obs2));
```

Here, the value of `computed1`, i.e. `computed1.get()`, will be 17.

The call `use(obs1)` returns the same value as `obs1.get()`, but also tells the computed to depend
on this observable. So if you call `obs1.set(10)`, then `computed1` will get recomputed, and
`computed1.get()` will evaluate to 22.

The `use()` function, made available to the callback supplied to the Computed, is one significant
difference to Knockout.js. Knockout creates a dependency on any observable used while the
callback is executing; GrainJS intentionally makes dependency-creation explicit -- it only happens
when the `use` function is, well, used.

There is another, even more explicit way to create a dependency of a computed: pass in
dependencies into the constructor:

```
const computed2 = Computed.create(owner, obs1, obs2, (use, v1, v2) => v1 + v2);
```

Here, `computed2` will depend on `obs1` and `obs2`, and any time either of those is updated, the
callback will get called with their explicit values. This way is very slightly more efficient.
Otherwise, the two ways of creating computed observables are equivalent, and you may mix and match
explicit dependencies, and dependencies created with the `use()` function.


## DOM Bindings


