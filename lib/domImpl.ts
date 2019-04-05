import {domDispose} from './domDispose';
import {attrsElem} from './domMethods';

// Use the browser globals in a way that allows replacing them with mocks in tests.
import {G} from './browserGlobals';

// For inline modifications, some other options were considered:
// (1) Chainable methods (to use e.g. `dom('div').attr('href', url).value()`). This approach is
//     criticized here:
//     https://medium.com/making-internets/why-using-chain-is-a-mistake-9bc1f80d51ba
// (2) Adding methods to DOM (to use e.g. `dom('div').attr('href', url)`. This is criticized here:
//     http://perfectionkills.com/whats-wrong-with-extending-the-dom/
// The approach chosen (inline modifications using functions that are typically bound on the fly)
// is more flexible and robust, and only suffers from slightly more verbosity. E.g.
// `dom('div', dom.attr('href', url))`.

export type DomMethod = (elem: Node) => DomArg|void;
export type DomElementMethod = (elem: Element) => DomElementArg|void;

export interface IAttrObj {
  [attrName: string]: string|boolean|null|undefined;
}

// Type of argument to dom-building functions, that work for any Node.
export type DomArg = Node | string | IDomArgArray | DomMethod | void | null | undefined;
export interface IDomArgArray extends Array<DomArg> {}

// More options are allowed when dom-building functions are used on an Element.
export type DomElementArg = DomArg | IAttrObj | IDomElementArgArray | DomElementMethod;
export interface IDomElementArgArray extends Array<DomElementArg> {}

// The goal of the above declarations is to get help from TypeScript in detecting incorrect usage:
// (See test/types/dom.ts for a test of this.)
//  import {text, hide} from './domMethods';
//  dom('div', text('hello'));        // OK
//  dom('div', hide(true));           // OK
//  dom('div', {title: 'hello'});     // OK
//  frag(text('hello'));              // OK
//  frag(hide(true));                 // Bad: DocumentFragment is not an Element
//  frag({title: 'hello'});           // Bad: DocumentFragment is not an Element

/**
 * dom('tag#id.class1.class2', ...args)
 *   The first argument is a string consisting of a tag name, with optional #foo suffix
 *   to add the ID 'foo', and zero or more .bar suffixes to add a CSS class 'bar'.
 *
 * The rest of the arguments are optional and may be:
 *
 *   Nodes - which become children of the created element;
 *   strings - which become text node children;
 *   objects - of the form {attr: val} to set additional attributes on the element;
 *   Arrays - which are flattened with each item processed recursively;
 *   functions - which are called with elem as the argument, for a chance to modify the
 *       element as it's being created. Return values are processed recursively.
 *   "dom methods" - expressions such as `dom.attr('href', url)` or `dom.hide(obs)`, which
 *       are actually special cases of the "functions" category.
 */
export function dom(tagString: string, ...args: DomElementArg[]): HTMLElement {
  return _updateWithArgsOrDispose(_createFromTagString(_createElementHtml, tagString), args);
}

/**
 * svg('tag#id.class1.class2', ...args)
 *  Same as dom(...), but creates an SVG element.
 */
export function svg(tagString: string, ...args: DomElementArg[]): SVGElement {
  return _updateWithArgsOrDispose(_createFromTagString(_createElementSvg, tagString), args);
}

// Internal helper used to create HTML elements.
function _createElementHtml(tag: string): HTMLElement {
  return G.document.createElement(tag);
}

// Internal helper used to create SVG elements.
function _createElementSvg(tag: string): SVGElement {
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
function _createFromTagString<E extends Element>(createFunc: (tag: string) => E, tagString: string): E {
  // We do careful hand-written parsing rather than use a regexp for speed. Using a regexp is
  // significantly more expensive.
  let tag: string;
  let id: string|undefined;
  let classes: string|undefined;
  let dotPos: number = tagString.indexOf(".");
  const hashPos: number = tagString.indexOf('#');
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

  const elem: E = createFunc(tag);
  if (id) { elem.setAttribute('id', id); }
  if (classes) { elem.setAttribute('class', classes); }
  return elem;
}

/**
 * Update an element with any number of arguments, as documented in dom().
 */
export function update<E extends Element>(elem: E, ...args: DomElementArg[]): E;
export function update<E extends Node>(elem: E, ...args: DomArg[]): E;
export function update(elem: any, ...args: DomElementArg[]): Node {
  return _updateWithArgs(elem, args);
}

/**
 * Update an element with an array of arguments.
 */
function _updateWithArgs<E extends Element>(elem: E, args: DomElementArg[]): E;
function _updateWithArgs<E extends Node>(elem: E, args: DomArg[]): E;
function _updateWithArgs(elem: any, args: DomElementArg[]): Node {
  for (const arg of args) {
    _updateWithArg(elem, arg);
  }
  return elem;
}

/**
 * Update an element with an array of arguments, calling disposers in case of an exception. It is
 * an internal helper to be used whenever elem is a newly-created element. If elem is an existing
 * element which the user already knows about, then _updateWithArgs should be called.
 */
function _updateWithArgsOrDispose<E extends Element>(elem: E, args: DomElementArg[]): E;
function _updateWithArgsOrDispose<E extends Node>(elem: E, args: DomArg[]): E;
function _updateWithArgsOrDispose(elem: any, args: DomElementArg[]): Node {
  try {
    return _updateWithArgs(elem, args);
  } catch (e) {
    domDispose(elem);
    throw e;
  }
}

function _updateWithArg(elem: Element, arg: DomElementArg): void;
function _updateWithArg(elem: Node, arg: DomArg): void;
function _updateWithArg(elem: any, arg: DomElementArg): void {
  if (typeof arg === 'function') {
    const value: DomArg = (arg as DomMethod)(elem);
    // Skip the recursive call in the common case when the function returns nothing.
    if (value !== undefined && value !== null) {
      _updateWithArg(elem, value);
    }
  } else if (Array.isArray(arg)) {
    _updateWithArgs(elem, arg);
  } else if (arg === undefined || arg === null) {
    // Nothing to do.
  } else if (arg instanceof G.Node) {
    elem.appendChild(arg);
  } else if (typeof arg === 'object') {
    attrsElem(elem, arg);
  } else {
    elem.appendChild(G.document.createTextNode(arg));
  }
}

/**
 * Creates a DocumentFragment processing arguments the same way as the dom() function.
 */
export function frag(...args: DomArg[]): DocumentFragment {
  const elem = G.document.createDocumentFragment();
  return _updateWithArgsOrDispose(elem, args);
}

/**
 * Find the first element matching a selector; just an abbreviation for document.querySelector().
 */
export function find(selector: string) { return G.document.querySelector(selector); }

/**
 * Find all elements matching a selector; just an abbreviation for document.querySelectorAll().
 */
export function findAll(selector: string) { return G.document.querySelectorAll(selector); }
