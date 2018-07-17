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

The focus is on performance and conciseness. The library has no dependencies and is only 25K
minified.

## Installation

```
npm install --save grainjs
```

## Usage

Until proper documentation pages are created, see documentation in individual code files under the
`lib` directory.

Example:

```typescript
const name = observable("");

dom.update(document.body,
  input(name, {onInput: true}, {type: "text", placeholder: "Your name..."),
  dom("div.name-class", "Hello, ", dom.text(name), "!"),
);
```
