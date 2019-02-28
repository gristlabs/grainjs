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
 *      dom.cls('c2'), dom.attr('href', url),
 *      dom.text('Hello '), dom('span', dom.text('world')))
 *    creates Node <a id="link" class="c1 c2" href={{url}}Hello <span>world</span></a>,
 *    identical to the first example above.
 */

// We keep various dom-related functions organized in private modules, but they are exposed here.
export {DomMethod, DomElementMethod, DomArg, DomElementArg, svg, update, frag, find, findAll} from './_domImpl';
export * from './_domComponent';
export * from './_domDispose';
export * from './_domForEach';
export * from './_domMethods';
export * from './domevent';

import * as _domComponent from './_domComponent';
import * as _domDispose from './_domDispose';
import * as _domForEach from './_domForEach';
import * as _domImpl from './_domImpl';
import * as _domMethods from './_domMethods';
import * as domevent from './domevent';

// We just want to re-export _domImpl.dom, but to allow adding methods to it in a typesafe way,
// TypeScript wants us to declare a real function in the same file.
export function dom(tagString: string, ...args: _domImpl.DomElementArg[]): HTMLElement {
  return _domImpl.dom(tagString, ...args);
}

// Additionally export all methods as properties of dom() function.
export namespace dom {      // tslint:disable-line:no-namespace
  export const svg             = _domImpl.svg;
  export const frag            = _domImpl.frag;
  export const update          = _domImpl.update;
  export const find            = _domImpl.find;
  export const findAll         = _domImpl.findAll;

  export const domDispose      = _domDispose.domDispose;
  export const onDisposeElem   = _domDispose.onDisposeElem;
  export const onDispose       = _domDispose.onDispose;
  export const autoDisposeElem = _domDispose.autoDisposeElem;
  export const autoDispose     = _domDispose.autoDispose;

  export const attrsElem       = _domMethods.attrsElem;
  export const attrs           = _domMethods.attrs;
  export const attrElem        = _domMethods.attrElem;
  export const attr            = _domMethods.attr;
  export const boolAttrElem    = _domMethods.boolAttrElem;
  export const boolAttr        = _domMethods.boolAttr;
  export const textElem        = _domMethods.textElem;
  export const text            = _domMethods.text;
  export const styleElem       = _domMethods.styleElem;
  export const style           = _domMethods.style;
  export const propElem        = _domMethods.propElem;
  export const prop            = _domMethods.prop;
  export const showElem        = _domMethods.showElem;
  export const show            = _domMethods.show;
  export const hideElem        = _domMethods.hideElem;
  export const hide            = _domMethods.hide;
  export const clsElem         = _domMethods.clsElem;
  export const cls             = _domMethods.cls;
  export const clsPrefix       = _domMethods.clsPrefix;
  export const dataElem        = _domMethods.dataElem;
  export const data            = _domMethods.data;
  export const getData         = _domMethods.getData;
  export const replaceContent  = _domMethods.replaceContent;
  export const domComputed     = _domMethods.domComputed;
  export const maybe           = _domMethods.maybe;

  export const forEach         = _domForEach.forEach;

  export const Component       = _domComponent.Component;
  export const create          = _domComponent.create;
  export const createInit      = _domComponent.createInit;

  export const onElem          = domevent.onElem;
  export const on              = domevent.on;
  export const onMatchElem     = domevent.onMatchElem;
  export const onMatch         = domevent.onMatch;
  export const onKeyPressElem  = domevent.onKeyElem;
  export const onKeyPress      = domevent.onKeyPress;
  export const onKeyDown       = domevent.onKeyDown;
}
