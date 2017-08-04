/**
 * dom.js provides a way to build a DOM tree easily.
 *
 * E.g.
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

"use strict";

const _domImpl = require('./_domImpl.js');
const _domDispose = require('./_domDispose.js');
const _domMethods = require('./_domMethods.js');

// We keep various dom-related functions organized in private modules, but they are exposed here.

let dom             = _domImpl.dom;
dom.svg             = _domImpl.svg;
dom.frag            = _domImpl.frag;
dom.update          = _domImpl.update;

dom.dispose         = _domDispose.dispose;
dom.onDisposeElem   = _domDispose.onDisposeElem;
dom.onDispose       = _domDispose.onDispose;
dom.autoDisposeElem = _domDispose.autoDisposeElem;
dom.autoDispose     = _domDispose.autoDispose;

dom.attrsElem       = _domMethods.attrsElem;
dom.attrs           = _domMethods.attrs;
dom.attrElem        = _domMethods.attrElem;
dom.attr            = _domMethods.attr;
dom.boolAttrElem    = _domMethods.boolAttrElem;
dom.boolAttr        = _domMethods.boolAttr;
dom.textElem        = _domMethods.textElem;
dom.text            = _domMethods.text;
dom.styleElem       = _domMethods.styleElem;
dom.style           = _domMethods.style;
dom.propElem        = _domMethods.propElem;
dom.prop            = _domMethods.prop;
dom.showElem        = _domMethods.showElem;
dom.show            = _domMethods.show;
dom.hideElem        = _domMethods.hideElem;
dom.hide            = _domMethods.hide;
dom.toggleClassElem = _domMethods.toggleClassElem;
dom.toggleClass     = _domMethods.toggleClass;
dom.cssClassElem    = _domMethods.cssClassElem;
dom.cssClass        = _domMethods.cssClass;
dom.dataElem        = _domMethods.dataElem;
dom.data            = _domMethods.data;
dom.getData         = _domMethods.getData;

module.exports = dom;
