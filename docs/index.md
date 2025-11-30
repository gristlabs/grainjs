# GrainJS: a lightweight typescript frontend framework

GrainJS is the framework that powers [Grist](https://github.com/gristlabs/grist-core), a
spreadsheet-database and a very featureful single-page app. In this, it's proven its ability to
handle complex situation despite its minimal footprint.

GrainJS is a framework in that it's a collection of libraries that address most of what's
needed to build interactive web-based applications. Here's a quick tour of what it covers, along
with examples.

A key aspect of GrainJS is that it's nothing more than a library. You can use it with TypeScript
or JavaScript, and aside from that, you don't need special tooling. It has no dependencies, and
delivers all its value in a minimized size of about 30kb.

In each example, you can see GrainJS code and its output. Try changing the code, to see how it
affects the output.

## Building DOM

GrainJS embraces TypeScript/JavaScript for building DOM. It's concise,
type-checked, and convenient. When using GrainJS, you might never write any angle brackets.

{.livecodes data-height="400"}
```js
const {dom} = grainjs;

dom.update(document.body,
  dom('h1', 'Hello world!'),
  dom('p', 'Simple markup and ',
    dom('a', 'links', {href: '/', target: '_blank'})
  )
);
```


## Observables

The DOM you build can react to changes in data by using "observable" values, inspired by
[Knockout](https://knockoutjs.com/), and analogous to
[ref](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#ref) in Vue, or observables
in [RxJS](https://rxjs.dev/).

{.livecodes data-height="400"}
```js
const {dom, Observable} = grainjs;
const count = Observable.create(null, 0);

dom.update(document.body,
  dom('p', 'Button pressed ', dom.text(count), ' times.'),
  dom('button', 'Press me',
    dom.on('click', () => { count.set(count.get() + 1); })
  )
);
```


## Computed values

These build on Observables, and step away from their
[Knockout](https://knockoutjs.com/) origins, with explicit dependency tracking and better order
of evaluation.

{.livecodes data-height="500"}
```js
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

## Disposables

Everything you create in GrainJS can be disposed. To keep track of it, there is
a system of ownership. This is important to avoid leaks in a long-lived application.

{.livecodes data-height="500"}
```js
// Hmm....
```

## Styling

There is a simple way to create styled components in TypeScript/JavaScript. It fits
nicely when all your DOM is constructed dynamically, and you won't have to worry about conflicting
class names.

{.livecodes data-height="700"}
```js
const {dom, Observable, styled} = grainjs;
const value = Observable.create(null, '');

const render = () =>
  cssConverter(
    'Convert number to binary',
    cssInput({type: 'number'}, dom.on('input', (ev, elem) => value.set(elem.value))),
    '→',
    cssOutput(dom.text(use => Number(use(value)).toString(2))),
  );

const cssConverter = styled('div', `background-color: #def; border-radius: 16px; padding: 16px`);
const cssInput = styled('input', `width: 100px; border-radius: 8px; border: 1px solid #88a`);
const cssOutput = styled('span', `border-radius: 8px; background-color: #88a`);

dom.update(document.body, render());
```

- [Basics](basics.md)
- [Dispose](dispose.md)
- [Misc](misc.md)
- [More observables](more-observables.md)
- [Reference](reference.md)






<style>
.livecodes + div {
  display: none;
}
</style>
<script setup>
import { createPlayground } from 'livecodes'

// runs after the markdown is rendered
requestAnimationFrame(() => {
  for (const elem of document.querySelectorAll('.livecodes + div')) {
    const host = elem.previousElementSibling;
    const code = elem.querySelector('code');
    if (!host || !code) { continue; }
    createPlayground(host, {
      appUrl: 'http://localhost:5173/livecodes/index.html',
      config: {
        mode: "simple",
        layout: "vertical",
        markup: { hideTitle: true },
        style: { hideTitle: true },
        script: {
          hideTitle: true,
          language: 'javascript',
          hiddenContentUrl: 'https://cdn.jsdelivr.net/npm/grainjs@1.0.2/dist/grain-full.min.js',
          content: code.textContent,
        },
        activeEditor: 'script',
        tools: {
          status: "none"
        },
      },
      loading: 'lazy',
    });
  }
})
</script>
