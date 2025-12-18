# GrainJS: a light typescript web framework

GrainJS is the framework that powers [Grist](https://github.com/gristlabs/grist-core#grist), a
spreadsheet-database whose frontend is a very featureful single-page web app. In this, it's proven
its ability to handle complex situation despite its minimal footprint.

The modern browser can do a lot without a framework. The available built-in interfaces
have been refined over the years and are excellent. GrainJS embraces those. On top, it builds a
collection of tools for building interactive web-based applications.

A key aspect of GrainJS is that it's nothing more than a library. You can use it with TypeScript
or JavaScript, and aside from that, you don't need special tooling. It has no dependencies, and
delivers all its value in a minified size of about 30kb.

## Quick tour

Here are a few examples to give you a taste. In each example, you can see GrainJS code and what it
produces.

### Building DOM

GrainJS embraces TypeScript/JavaScript for building DOM. It's concise,
type-checked, and convenient. When using GrainJS, you might never write any angle brackets.

```js{3-5}
const {dom} = grainjs;
dom.update(document.body,
  dom('p', 'Simple markup and ',
    dom('a', 'links', {href: '/', target: '_blank'})
  )
);
```
<GrainJsExample heightRem=3 />

### Styling DOM

You can style things right in TypeScript/JavaScript too. No need to worry about
conflicting class names or CSS build tooling.

```js{12}
const {dom, styled} = grainjs;

const cssButton = styled('button', `
  padding: 4px 16px;
  border: none;
  border-radius: 8px;
  background-color: #168a49;
  color: white;
`);

dom.update(document.body,
  cssButton('Styled button')
);
```
<GrainJsExample heightRem=3 />

### Observables

The DOM you build can react to changes in data by using "observable" values, inspired by
[Knockout](https://knockoutjs.com/), and analogous to
[ref](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#ref) in Vue, or observables
in [RxJS](https://rxjs.dev/).

```js{2,5,7}
const {dom, Observable} = grainjs;
const count = Observable.create(null, 0);

dom.update(document.body,
  'Button pressed ', dom.text(count), ' times. ',
  dom('button', 'Press me',
    dom.on('click', () => count.set(count.get() + 1))
  ),
);
```
<GrainJsExample heightRem=3 />

### Computed values

These build on observables, and go beyond their [Knockout](https://knockoutjs.com/) origins, with
explicit dependency tracking and better order of evaluation. They can be created explicitly, or
inline when setting properties or contents of DOM elements.

```js{3,9-10}
const {dom, Computed, Observable} = grainjs;
const name = Observable.create(null, 'Mad Hatter');
const upper = Computed.create(null, use => use(name).toUpperCase());

dom.update(document.body,
  dom('input', {type: 'text', value: name.get()},
    dom.on('input', (ev, elem) => name.set(elem.value))
  ),
  dom('p', 'Uppercase: ', dom.text(upper)),
  dom('p', 'Lowercase: ', dom.text(use => use(name).toLowerCase())),
);
```
<GrainJsExample heightRem=7 />

### Disposables

Everything you create in GrainJS can be disposed. To keep track of it, there is
a system of ownership. This is important to avoid leaks in a long-lived application.

### Other tools

There are a number of other conveniences, like for DOM properties and events, for custom events,
for building lists, building components, and more.
