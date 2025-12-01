# Getting started with GrainJS

GrainJS is just a library. There is no server-side rendering, or hydration, or scaffolding.
All you need is a way to use JavaScript or TypeScript modules.

## Using NPM

If you use `npm` to manage your frontend code:

```sh
npm install grainjs
```

Then you can use it in TypeScript or JavaScript:

```js
import {dom} from 'grainjs';
dom('div', dom.on('click', (ev) => { ... }));
```

## Using CDN

Pre-built versions of GrainJS are available on some CDNs:

```html
<script src="https://unpkg.com/grainjs@1/dist/grain-full.min.js" defer></script>
```

```html
<script src="https://cdn.jsdelivr.net/npm/grainjs@1/dist/grain-full.min.js" defer></script>
```

These create a global `grainjs` objects, which you can use like so:

```js
const {dom} = grainjs;
dom('div', dom.on('click', (ev) => { ... }));
```

## Hello world!

Here's a minimal complete example showing GrainJS in action. With this in `index.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/grainjs@1/dist/grain-full.min.js" defer></script>
    <script src="./index.js" defer></script>
  </head>
  <body>
  </body>
</html>
```

this content of `index.js` will produce the output shown:

```js
const {dom} = grainjs;

dom.update(document.body,
  dom('h1', 'Hello world!')
);
```
<GrainJsExample heightRem=4 />

This only does two things:
1. `dom('h1', ...)` creates an `H1` (heading) element. Additional
argument specify its content or properties.
2. The call `dom.update(document.body, ...)` updates the
existing `BODY` element: additional arguments again specify its content or properties. So in
this case, it's equivalent to `document.body.appendChild`: it simply appends an `H1`
element to `BODY`.


