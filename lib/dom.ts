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

// We keep various dom-related functions organized in private modules, but they are exposed here.
export * from './_domImpl';
export * from './_domComponent';
export * from './_domDispose';
export * from './_domMethods';
export * from './domevent';

import * as _domComponent from './_domComponent';
import * as _domDispose from './_domDispose';
import * as _domImpl from './_domImpl';
import * as _domMethods from './_domMethods';
import * as domevent from './domevent';

// Additionally export all methods as properties of dom() function.
const dom: any = _domImpl.dom;
dom.svg             = _domImpl.svg;
dom.frag            = _domImpl.frag;
dom.update          = _domImpl.update;
dom.find            = _domImpl.find;
dom.findAll         = _domImpl.findAll;

dom.domDispose      = _domDispose.domDispose;
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
dom.domComputed     = _domMethods.domComputed;
dom.maybe           = _domMethods.maybe;

dom.Component       = _domComponent.Component;
dom.createElem      = _domComponent.createElem;
dom.create          = _domComponent.create;
dom.createInit      = _domComponent.createInit;

dom.onElem          = domevent.onElem;
dom.on              = domevent.on;
dom.onMatchElem     = domevent.onMatchElem;
dom.onMatch         = domevent.onMatch;
