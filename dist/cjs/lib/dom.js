"use strict";
/**
 * dom.js provides a way to build a DOM tree easily.
 *
 * E.g.
 *  import {dom} from 'grainjs';
 *  dom('a#link.c1.c2', {'href': url}, 'Hello ', dom('span', 'world'));
 *    creates Node <a id="link" class="c1 c2" href={{url}}Hello <span>world</span></a>.
 *
 *  dom.frag(dom('span', 'Hello'), ['blah', dom('div', 'world')])
 *    creates document fragment with <span>Hello</span>blah<div>world</div>.
 *
 * DOM can also be created and modified inline during creation:
 *  dom('a#id.c1',
 *      dom.cssClass('c2'), dom.attr('href', url),
 *      dom.text('Hello '), dom('span', dom.text('world')))
 *    creates Node <a id="link" class="c1 c2" href={{url}}Hello <span>world</span></a>,
 *    identical to the first example above.
 */
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
// We keep various dom-related functions organized in private modules, but they are exposed here.
var _domImpl_1 = require("./_domImpl");
exports.svg = _domImpl_1.svg;
exports.update = _domImpl_1.update;
exports.frag = _domImpl_1.frag;
exports.find = _domImpl_1.find;
exports.findAll = _domImpl_1.findAll;
__export(require("./_domComponent"));
__export(require("./_domDispose"));
__export(require("./_domMethods"));
__export(require("./domevent"));
const _domComponent = require("./_domComponent");
const _domDispose = require("./_domDispose");
const _domImpl = require("./_domImpl");
const _domMethods = require("./_domMethods");
const domevent = require("./domevent");
// We just want to re-export _domImpl.dom, but to allow adding methods to it in a typesafe way,
// TypeScript wants us to declare a real function in the same file.
function dom(tagString, ...args) {
    return _domImpl.dom(tagString, ...args);
}
exports.dom = dom;
// Additionally export all methods as properties of dom() function.
(function (dom) {
    dom.svg = _domImpl.svg;
    dom.frag = _domImpl.frag;
    dom.update = _domImpl.update;
    dom.find = _domImpl.find;
    dom.findAll = _domImpl.findAll;
    dom.domDispose = _domDispose.domDispose;
    dom.onDisposeElem = _domDispose.onDisposeElem;
    dom.onDispose = _domDispose.onDispose;
    dom.autoDisposeElem = _domDispose.autoDisposeElem;
    dom.autoDispose = _domDispose.autoDispose;
    dom.attrsElem = _domMethods.attrsElem;
    dom.attrs = _domMethods.attrs;
    dom.attrElem = _domMethods.attrElem;
    dom.attr = _domMethods.attr;
    dom.boolAttrElem = _domMethods.boolAttrElem;
    dom.boolAttr = _domMethods.boolAttr;
    dom.textElem = _domMethods.textElem;
    dom.text = _domMethods.text;
    dom.styleElem = _domMethods.styleElem;
    dom.style = _domMethods.style;
    dom.propElem = _domMethods.propElem;
    dom.prop = _domMethods.prop;
    dom.showElem = _domMethods.showElem;
    dom.show = _domMethods.show;
    dom.hideElem = _domMethods.hideElem;
    dom.hide = _domMethods.hide;
    dom.toggleClassElem = _domMethods.toggleClassElem;
    dom.toggleClass = _domMethods.toggleClass;
    dom.cssClassElem = _domMethods.cssClassElem;
    dom.cssClass = _domMethods.cssClass;
    dom.dataElem = _domMethods.dataElem;
    dom.data = _domMethods.data;
    dom.getData = _domMethods.getData;
    dom.domComputed = _domMethods.domComputed;
    dom.maybe = _domMethods.maybe;
    dom.Component = _domComponent.Component;
    dom.createElem = _domComponent.createElem;
    dom.create = _domComponent.create;
    dom.createInit = _domComponent.createInit;
    dom.onElem = domevent.onElem;
    dom.on = domevent.on;
    dom.onMatchElem = domevent.onMatchElem;
    dom.onMatch = domevent.onMatch;
})(dom = exports.dom || (exports.dom = {}));
