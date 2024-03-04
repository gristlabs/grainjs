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
export * from './domImpl';
export * from './domComponent';
export * from './domComputed';
export * from './domDispose';
export * from './domForEach';
export * from './domMethods';
export * from './domevent';

import * as _domComponent from './domComponent';
import * as _domComputed from './domComputed';
import * as _domDispose from './domDispose';
import * as _domForEach from './domForEach';
import * as _domImpl from './domImpl';
import * as _domMethods from './domMethods';

import * as domevent from './domevent';

import {dom as _dom, IDomArgs, TagElem, TagName} from './domImpl';

// We just want to re-export _domImpl.dom, but to allow adding methods to it in a typesafe way,
// TypeScript wants us to declare a real function in the same file.
export function dom<Tag extends TagName>(tagString: Tag, ...args: IDomArgs<TagElem<Tag>>): TagElem<Tag> {
  return _dom(tagString, ...args);
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
  export const replaceContent  = _domComputed.replaceContent;
  export const domComputed     = _domComputed.domComputed;
  export const domComputedOwned = _domComputed.domComputedOwned;
  export const maybe           = _domComputed.maybe;
  export const maybeOwned      = _domComputed.maybeOwned;

  export const forEach         = _domForEach.forEach;

  export const create          = _domComponent.create;

  export const onElem          = domevent.onElem;
  export const on              = domevent.on;
  export const onMatchElem     = domevent.onMatchElem;
  export const onMatch         = domevent.onMatch;
  export const onKeyElem       = domevent.onKeyElem;
  export const onKeyPress      = domevent.onKeyPress;
  export const onKeyDown       = domevent.onKeyDown;
  export const onReady         = domevent.onReady;
}
