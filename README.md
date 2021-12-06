# GrainJS

[![npm version](https://badge.fury.io/js/grainjs.svg)](https://badge.fury.io/js/grainjs)
[![Build status](https://github.com/gristlabs/grainjs/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/gristlabs/grainjs/actions/workflows/build-and-test.yml)
[![codecov](https://codecov.io/gh/gristlabs/grainjs/branch/master/graph/badge.svg?token=1OIMMBLI6N)](https://codecov.io/gh/gristlabs/grainjs)

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

- [DOM & Observables](docs/basics.md)
  - [DOM Construction](docs/basics.md#dom-construction)
  - [Observables](docs/basics.md#observables)
    - [Computed Observables](docs/basics.md#computed-observables)
  - [DOM Bindings](docs/basics.md#dom-bindings)
    - [Conditional DOM](docs/basics.md#conditional-dom)
    - [Repeating DOM](docs/basics.md#repeating-dom)
    - [DOM Events](docs/basics.md#dom-events)
  - [Styling DOM](docs/basics.md#styling-dom)

- [Disposables](docs/dispose.md)
  - [Class Disposable](docs/dispose.md#class-disposable)
  - [Taking Ownership](docs/dispose.md#taking-ownership)
  - [Holders](docs/dispose.md#holders)
  - [Further Notes](docs/dispose.md#further-notes)

- [More on Observables](docs/more-observables.md)
  - [Subscribe](docs/more-observables.md#subscribe)
  - [Disposable Values](docs/more-observables.md#disposable-values)
  - [ObsArray](docs/more-observables.md#obsarray)
  - [PureComputed](docs/more-observables.md#purecomputed)
  - [Order of Evaluation](docs/more-observables.md#order-of-evaluation)

- [Miscellaneous](docs/misc.md)
  - [Event Emitters](docs/misc.md#event-emitters)
  - [Disposing DOM](docs/misc.md#disposing-dom)
  - [DOM Components](docs/misc.md#dom-components)
    - [Functional Components](docs/misc.md#functional-components)
  - [Knockout Integration](docs/misc.md#knockout-integration)

- [Reference](docs/reference.md)
  - [DOM Reference](docs/reference.md#dom-reference)
  - [Disposables Reference](docs/reference.md#disposables-reference)
  - [Observables Reference](docs/reference.md#observables-reference)
