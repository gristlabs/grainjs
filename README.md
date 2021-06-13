# GrainJS

[![npm version](https://badge.fury.io/js/grainjs.svg)](https://badge.fury.io/js/grainjs)
[![Build Status](https://travis-ci.org/gristlabs/grainjs.svg?branch=master)](https://travis-ci.org/gristlabs/grainjs)

GrainJS is a Javascript (and TypeScript) library for building highly performant dynamic
applications.

GrainJS provides convenient pure-JS interfaces for building DOM. It has observables inspired by
[Knockout](http://knockoutjs.com/documentation/introduction.html) to create declarative data
models and tie them to UI. It includes light-weight event dispatching, DOM event subscriptions,
disposable components, and in-code CSS styling.

GrainJS is in part inspired by [React](https://reactjs.org/), but based on observables instead of
virtual dom, and with a convenient way to build DOM without JSX. It is lighter weight, and has
less magic happening under the covers.

The focus is on performance and conciseness. The library has no dependencies and is only 31K.
minified.

## Installation

```
npm install --save grainjs
```

## Basic Example

```typescript
const name = observable("");

dom.update(document.body,
  dom('input', {type: 'text', placeholder: 'Enter your name'},
    dom.on('input', (ev, elem) => name.set(elem.value)),
  ),
  dom('div', 'Hello, ',
    dom.text((use) => use(name).toUpperCase() || 'Stranger'),
    '!',
  ),
);
```

# Documentation

At a basic level, GrainJS allows you to describe DOM structure in one place, using Javascript (or
TypeScript), and to keep the dynamic aspects of it separated into variables called "observables".
These observables serve as the model of the UI; other code can update them to cause UI to update,
without knowing the details of the DOM construction.

In addition, the library provides approaches to create and dispose resources (important for
long-lived single-page applications), and an assortment of other related tools.

- [DOM & Observables](docs/basics.md#dom--observables)
  - [DOM Construction](docs/basics.md#dom-construction)
  - [Observables](docs/basics.md#observables)
    - [Computed Observables](docs/basics.md#computed-observables)
  - [DOM Bindings](docs/basics.md#dom-bindings)
    - [Conditional DOM](docs/basics.md#conditional-dom)
    - [Repeating DOM](docs/basics.md#repeating-dom)
    - [DOM Events](docs/basics.md#dom-events)
  - [Styling DOM](docs/basics.md#styling-dom)

- [Disposables](dispose.html#disposables)
  - [Class Disposable](dispose.html#class-disposable)
  - [Taking Ownership](dispose.html#taking-ownership)
  - [Holders](dispose.html#holders)
  - [Further Notes](dispose.html#further-notes)

- [More on Observables](more-observables.html)
  - [Subscribe](more-observables.html#subscribe)
  - [ObsArray](more-observables.html#obsarray)
  - [Disposable Values](more-observables.html#disposable-values)
  - [PureComputed](more-observables.html#purecomputed)
  - [Order of Evaluation](more-observables.html#order-of-evaluation)

- [Miscellaneous](misc.html)
  - [Event Emitters](misc.html#event-emitters)
  - [Disposing DOM](misc.html#disposing-dom)
  - [DOM Components](misc.html#dom-components)

- [Reference](reference.html)
  - [DOM Reference](reference.html#dom-reference)
  - [Disposables Reference](reference.html#disposables-reference)
  - [Observables Reference](reference.html#observables-reference)
