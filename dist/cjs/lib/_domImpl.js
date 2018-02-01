"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _domDispose_1 = require("./_domDispose");
const _domMethods_1 = require("./_domMethods");
// Use the browser globals in a way that allows replacing them with mocks in tests.
const browserGlobals_1 = require("./browserGlobals");
// The goal of the above declarations is to get help from TypeScript in detecting incorrect usage:
//  import {text, hide} from './_domMethods';
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
function dom(tagString, ...args) {
    return _updateWithArgsOrDispose(_createFromTagString(_createElementHtml, tagString), args);
}
exports.dom = dom;
/**
 * svg('tag#id.class1.class2', ...args)
 *  Same as dom(...), but creates an SVG element.
 */
function svg(tagString, ...args) {
    return _updateWithArgsOrDispose(_createFromTagString(_createElementSvg, tagString), args);
}
exports.svg = svg;
// Internal helper used to create HTML elements.
function _createElementHtml(tag) {
    return browserGlobals_1.G.document.createElement(tag);
}
// Internal helper used to create SVG elements.
function _createElementSvg(tag) {
    return browserGlobals_1.G.document.createElementNS("http://www.w3.org/2000/svg", tag);
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
    let tag;
    let id;
    let classes;
    let dotPos = tagString.indexOf(".");
    const hashPos = tagString.indexOf('#');
    if (dotPos === -1) {
        dotPos = tagString.length;
    }
    else {
        classes = tagString.substring(dotPos + 1).replace(/\./g, ' ');
    }
    if (hashPos === -1) {
        tag = tagString.substring(0, dotPos);
    }
    else if (hashPos > dotPos) {
        throw new Error(`ID must come before classes in dom("${tagString}")`);
    }
    else {
        tag = tagString.substring(0, hashPos);
        id = tagString.substring(hashPos + 1, dotPos);
    }
    const elem = createFunc(tag);
    if (id) {
        elem.setAttribute('id', id);
    }
    if (classes) {
        elem.setAttribute('class', classes);
    }
    return elem;
}
function update(elem, ...args) {
    return _updateWithArgs(elem, args);
}
exports.update = update;
function _updateWithArgs(elem, args) {
    for (const arg of args) {
        _updateWithArg(elem, arg);
    }
    return elem;
}
function _updateWithArgsOrDispose(elem, args) {
    try {
        return _updateWithArgs(elem, args);
    }
    catch (e) {
        _domDispose_1.domDispose(elem);
        throw e;
    }
}
function _updateWithArg(elem, arg) {
    if (typeof arg === 'function') {
        const value = arg(elem);
        // Skip the recursive call in the common case when the function returns nothing.
        if (value !== undefined && value !== null) {
            _updateWithArg(elem, value);
        }
    }
    else if (Array.isArray(arg)) {
        _updateWithArgs(elem, arg);
    }
    else if (arg === undefined || arg === null) {
        // Nothing to do.
    }
    else if (arg instanceof browserGlobals_1.G.Node) {
        elem.appendChild(arg);
    }
    else if (typeof arg === 'object') {
        _domMethods_1.attrsElem(elem, arg);
    }
    else {
        elem.appendChild(browserGlobals_1.G.document.createTextNode(arg));
    }
}
/**
 * Creates a DocumentFragment processing arguments the same way as the dom() function.
 */
function frag(...args) {
    const elem = browserGlobals_1.G.document.createDocumentFragment();
    return _updateWithArgsOrDispose(elem, args);
}
exports.frag = frag;
/**
 * Find the first element matching a selector; just an abbreviation for document.querySelector().
 */
function find(selector) { return browserGlobals_1.G.document.querySelector(selector); }
exports.find = find;
/**
 * Find all elements matching a selector; just an abbreviation for document.querySelectorAll().
 */
function findAll(selector) { return browserGlobals_1.G.document.querySelectorAll(selector); }
exports.findAll = findAll;
