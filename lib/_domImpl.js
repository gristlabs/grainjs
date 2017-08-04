"use strict";

const isNil = require('lodash/isNil');
const isObjectLike = require('lodash/isObjectLike');
const _domMethods = require('./_domMethods.js');

// Use the browser globals in a way that allows replacing them with mocks in tests.
const G = require('./browserGlobals.js').use('Node', 'document');

// For inline modifications, some other options were considered:
// (1) Chainable methods (to use e.g. `dom('div').attr('href', url).value()`). This approach is
//     criticized here:
//     https://medium.com/making-internets/why-using-chain-is-a-mistake-9bc1f80d51ba
// (2) Adding methods to DOM (to use e.g. `dom('div').attr('href', url)`. This is criticized here:
//     http://perfectionkills.com/whats-wrong-with-extending-the-dom/
// The approach chosen (inline modifications using functions that are typically bound on the fly)
// is more flexible and robust, and only suffers from slightly more verbosity. E.g.
// `dom('div', dom.attr('href', url))`.


/**
 * dom('tag#id.class1.class2', ...args)
 *   The first argument is a string consisting of a tag name, with optional #foo suffix
 *   to add the ID 'foo', and zero or more .bar suffixes to add a css class 'bar'.
 *
 * The rest of the arguments are optional and may be:
 *
 *   Nodes - which become children of the created element;
 *   strings - which become text node children;
 *   objects - of the form {attr: val} to set additional attributes on the element;
 *   Arrays - which are flattened with each item processed recursively;
 *   functions - which are called with elem as the argument, for a chance to modify the
 *       element as it's being created. Return values are processed recursively.
 *   "dom functions" - expressions such as `dom.attr('href', url)` or `dom.hide(obs)`, which
 *       are actually special cases of the "functions" category.
 */
function dom(tagString, ...args) {
  return _updateWithArgsOrDispose(_createFromTagString(_createElementHtml, tagString), args);
}
exports.dom = dom;

/**
 * dom.svg('tag#id.class1.class2', ...args)
 *  Same as dom(...), but creates and SVG element.
 */
function svg(tagString, ...args) {
  return _updateWithArgsOrDispose(_createFromTagString(_createElementSvg, tagString), args);
}
exports.svg = svg;


// Internal helper used to create HTML elements.
function _createElementHtml(tag) {
  return G.document.createElement(tag);
}

// Internal helper used to create SVG elements.
function _createElementSvg(tag) {
  return G.document.createElementNS("http://www.w3.org/2000/svg", tag);
}

/**
 * Internal helper to parse tagString, create an element using createFunc with the given tag, and
 * set its id and classes from the tagString.
 * @param {Funtion} createFunc(tag): Function that should create an element given a tag name.
 *    It is passed in to allow creating elements in different namespaces (e.g. plain HTML vs SVG).
 * @param {String} tagString: String of the form "tag#id.class1.class2" where id and classes are
 *    optional.
 * @return {Element} The result of createFunc(), possibly with id and class attributes also set.
 */
function _createFromTagString(createFunc, tagString) {
  // We do careful hand-written parsing rather than use a regexp for speed. Using a regexp is
  // significantly more expensive.
  let tag, id, classes;
  let dotPos = tagString.indexOf(".");
  let hashPos = tagString.indexOf('#');
  if (dotPos === -1) {
    dotPos = tagString.length;
  } else {
    classes = tagString.substring(dotPos + 1).replace(/\./g, ' ');
  }
  if (hashPos === -1) {
    tag = tagString.substring(0, dotPos);
  } else if (hashPos > dotPos) {
    throw new Error(`ID must come before classes in dom("${tagString}")`);
  } else {
    tag = tagString.substring(0, hashPos);
    id = tagString.substring(hashPos + 1, dotPos);
  }

  let elem = createFunc(tag);
  if (id) { elem.setAttribute('id', id); }
  if (classes) { elem.setAttribute('class', classes); }
  return elem;
}


/**
 * Update an element with any number of arguments, as documented in dom().
 */
function update(elem, ...args) {
  return _updateWithArgs(elem, args);
}
exports.update = update;


/**
 * Update an element with an array of arguments.
 */
function _updateWithArgs(elem, args) {
  for (let arg of args) {
    _updateWithArg(elem, arg);
  }
  return elem;
}

/**
 * Update an element with an array of arguments, calling disposers in case of an exception. It is
 * an internal helper to be used whenever elem is a newly-created element. If elem is an existing
 * element which the user already knows about, then _updateWithArgs should be called.
 */
function _updateWithArgsOrDispose(elem, args) {
  try {
    return _updateWithArgs(elem, args);
  } catch (e) {
    dom.dispose(elem);
    throw e;
  }
}

/**
 * Update an element with a single argument.
 */
function _updateWithArg(elem, arg) {
  if (typeof arg === 'function') {
    let value = arg(elem);
    // Skip the recursive call in the common case when the function returns nothing.
    if (!isNil(value)) {
      _updateWithArg(elem, value);
    }
  } else if (Array.isArray(arg)) {
    _updateWithArgs(elem, arg);
  } else if (isNil(arg)) {
    // Nothing to do.
  } else if (arg instanceof G.Node) {
    elem.appendChild(arg);
  } else if (isObjectLike(arg)) {
    _domMethods.attrsElem(elem, arg);
  } else {
    elem.appendChild(G.document.createTextNode(arg));
  }
}


/**
 * Creates a DocumentFragment processing arguments the same way as the dom() function.
 */
function frag(...args) {
  let elem = G.document.createDocumentFragment();
  return _updateWithArgsOrDispose(elem, args);
}
exports.frag = frag;
