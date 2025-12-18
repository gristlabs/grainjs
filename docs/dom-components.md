# DOM components

You'll often want to package a component's state, logic, and DOM. There are two ways of doing
that: as a class component or a functional component.

## Class components

Here's a simple temperature-converting example:

```typescript
const {dom, Disposable, Observable, Computed} = grainjs;

class TempCalculator extends Disposable {
  _initialValue = 25;
  _celsius = Observable.create(this, this._initialValue);
  _fahrenheit = Computed.create(this, use => (use(this._celsius) * 9 / 5) + 32);

  buildDom() {
    return dom('div',
      dom('p',
        'Enter temperature in Celsius: ',
        dom('input', {type: 'text', value: this._initialValue},
          dom.on('input', (ev, elem) => this._celsius.set(parseFloat(elem.value)))
        ),
      ),
      dom('p', 'Result in Fahrenheit: ',
        dom.text(use => String(use(this._fahrenheit)))
      ),
    );
  }
}

dom.update(document.body, dom('div', dom.create(TempCalculator)));
```
<GrainJsExample heightRem=6 />

Such a class, which extends `Disposable`, and provides a `buildDom()` method, is called a
**"DOM component"**. We instantiate such a component and insert its DOM into another element by
using `dom.create(ClassName, ...args)`, as in the last line above:

```ts
dom('div', dom.create(TempCalculator)));
```

This is similar to `dom('div', (new TempCalculator()).buildDom())`, except for
disposal. Using `dom.create()` ensures that the created DOM component will
get disposed when the DIV is cleaned up (i.e. [disposed](dispose#disposing-dom)),
as well as in case of any exceptions that may occur
during DOM construction.

The real benefit may be more obvious in code like this:
```ts
const show = Observable.create(null, true);

dom.update(document.body,
  dom('button', 'Toggle', dom.on('click', () => show.set(!show.get()))),
  dom.maybe(show, () => dom.create(TempCalculator)),
);
```
Here, every time you toggle the converter _on_, a new `TempCalculator` gets created. When you
toggle it _off_, `dom.maybe` takes care of disposing the created DOM, and `dom.create` takes care
of disposing the `TempCalculator` object.

The `.buildDom()` method of a DOM component is called exactly once, right after the constructor,
and may return a Node, an array, or any content which may be added to the `dom()` function. All
the returned DOM will be disposed when the containing element is disposed, followed by the
component instance itself.

## Functional components

In an analogy to the distinction between React's "class components" and "functional components",
`dom.create()` may be used with a function. Its purpose, again, is to help with taking
responsibility for resources (i.e. disposing them when appropriate), and really there is not much
else to it.

Here's a tweaked example from [Disposing DOM](dispose#disposing-dom), turned into a functional
component:

```typescript
function buildLink(owner: IDisposableOwner, isBigObs: Observable<boolean>) {
  const isSmallObs = Computed.create(owner, use => !use(isBigObs));
  return dom('a',
    dom.cls('small-link', isSmallObs),
  );
}
dom('div', dom.create(buildLink, isBigObs))
```

Note how we get an `owner` to take ownership of our `Computed`, and we don't have to worry about
attaching its disposal to DOM.

The presence of the `owner` argument is the difference between `dom.create(buildLink, ...)` and
`buildLink(...)`. As with class-based DOM components, `dom.create()` takes the responsibility of
cleanup by creating a `MultiHolder` (see [Holders](dispose#holders)) which it promises to
dispose, and calling the passed-in function with it as the first argument.

With both classes and functions, `dom.create()` arranges for the DOM element to which the
component is attached to be the logical owner of the component. When the DOM element is disposed,
so is the component.


Here is the temperature-conversion example as a functional component:

```ts
const {dom, Disposable, Observable, Computed} = grainjs;

function tempCalculator(owner, initialValue) {
  const celsius = Observable.create(owner, initialValue);
  const fahrenheit = Computed.create(owner, use => (use(celsius) * 9 / 5) + 32);

  return dom('div',
    dom('p',
      'Enter temperature in Celsius: ',
      dom('input', {type: 'text', value: initialValue},
        dom.on('input', (ev, elem) => celsius.set(parseFloat(elem.value)))
      ),
    ),
    dom('p', 'Result in Fahrenheit: ',
      dom.text(use => String(use(fahrenheit)))
    ),
  );
}

dom.update(document.body, dom('div', dom.create(tempCalculator, 30)));
```
<GrainJsExample heightRem=6 />
