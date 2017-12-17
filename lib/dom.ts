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
export {DomMethod, DomElementMethod, DomArg, DomElementArg, svg, update, frag, find, findAll} from './_domImpl';
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
const domMethods = {
  svg             : _domImpl.svg,
  frag            : _domImpl.frag,
  update          : _domImpl.update,
  find            : _domImpl.find,
  findAll         : _domImpl.findAll,

  domDispose      : _domDispose.domDispose,
  onDisposeElem   : _domDispose.onDisposeElem,
  onDispose       : _domDispose.onDispose,
  autoDisposeElem : _domDispose.autoDisposeElem,
  autoDispose     : _domDispose.autoDispose,

  attrsElem       : _domMethods.attrsElem,
  attrs           : _domMethods.attrs,
  attrElem        : _domMethods.attrElem,
  attr            : _domMethods.attr,
  boolAttrElem    : _domMethods.boolAttrElem,
  boolAttr        : _domMethods.boolAttr,
  textElem        : _domMethods.textElem,
  text            : _domMethods.text,
  styleElem       : _domMethods.styleElem,
  style           : _domMethods.style,
  propElem        : _domMethods.propElem,
  prop            : _domMethods.prop,
  showElem        : _domMethods.showElem,
  show            : _domMethods.show,
  hideElem        : _domMethods.hideElem,
  hide            : _domMethods.hide,
  toggleClassElem : _domMethods.toggleClassElem,
  toggleClass     : _domMethods.toggleClass,
  cssClassElem    : _domMethods.cssClassElem,
  cssClass        : _domMethods.cssClass,
  dataElem        : _domMethods.dataElem,
  data            : _domMethods.data,
  getData         : _domMethods.getData,
  domComputed     : _domMethods.domComputed,
  maybe           : _domMethods.maybe,

  Component       : _domComponent.Component,
  createElem      : _domComponent.createElem,
  create          : _domComponent.create,
  createInit      : _domComponent.createInit,

  onElem          : domevent.onElem,
  on              : domevent.on,
  onMatchElem     : domevent.onMatchElem,
  onMatch         : domevent.onMatch,
};

// Rather than re-export dom() from _domImpl, we define it here to be that function with all DOM
// methods available as its properties.
export const dom: typeof _domImpl.dom & typeof domMethods = Object.assign(_domImpl.dom, domMethods);
