"use strict";

import * as _domDispose from './_domDispose';
import {DomArg, DomElementMethod, DomMethod, frag} from './_domImpl';
import {BindableValue, subscribe as subscribeBinding} from './binding';

// Use the browser globals in a way that allows replacing them with mocks in tests.
import {G} from './browserGlobals';

/**
 * Private global map for associating arbitrary data with DOM. It's a WeakMap, so does not prevent
 * values from being garbage collected when the owning DOM elements are no longer used.
 */
const _dataMap: WeakMap<Node, {[key: string]: any}> = new WeakMap();

/**
 * Internal helper that binds the callback to valueObs, which may be a value, observble, or
 * function, and attaches a disposal callback to the passed-in element.
 */
function _subscribe<T>(elem: Node, valueObs: BindableValue<T>,
                       callback: (newVal: T, oldVal?: T) => void): void {
  _domDispose.autoDisposeElem(elem, subscribeBinding(valueObs, callback));
}

/**
 * Sets multiple attributes of a DOM element. The `attrs()` variant takes no `elem` argument.
 * @param {Object} attrsObj: Object mapping attribute names to attribute values.
 */
export function attrsElem(elem: Element, attrsObj: {[name: string]: string}): void {
  for (const key of Object.keys(attrsObj)) {
    elem.setAttribute(key, attrsObj[key]);
  }
}
export function attrs(attrsObj: {[name: string]: string}): DomElementMethod {
  return (elem) => attrsElem(elem, attrsObj);
}

/**
 * Sets an attribute of a DOM element to the given value. Removes the attribute when the value is
 * null or undefined. The `attr()` variant takes no `elem` argument, and `attrValue` may be an
 * observable or function.
 * @param {Element} elem: The element to update.
 * @param {String} attrName: The name of the attribute to bind, e.g. 'href'.
 * @param {String|null} attrValue: The string value or null to remove the attribute.
 */
export function attrElem(elem: Element, attrName: string, attrValue: string|null): void {
  if (attrValue === null || attrValue === undefined) {
    elem.removeAttribute(attrName);
  } else {
    elem.setAttribute(attrName, attrValue);
  }
}
export function attr(attrName: string, attrValueObs: BindableValue<string>): DomElementMethod {
  return (elem) => _subscribe(elem, attrValueObs, (val) => attrElem(elem, attrName, val));
}

/**
 * Sets or removes a boolean attribute of a DOM element. According to the spec, empty string is a
 * valid true value for the attribute, and the false value is indicated by the attribute's absence.
 * The `boolAttr()` variant takes no `elem`, and `boolValue` may be an observable or function.
 * @param {Element} elem: The element to update.
 * @param {String} attrName: The name of the attribute to bind, e.g. 'checked'.
 * @param {Boolean} boolValue: Boolean value whether to set or unset the attribute.
 */
export function boolAttrElem(elem: Element, attrName: string, boolValue: boolean): void {
  attrElem(elem, attrName, boolValue ? '' : null);
}
export function boolAttr(attrName: string, boolValueObs: BindableValue<boolean>): DomElementMethod {
  return (elem) => _subscribe(elem, boolValueObs, (val) => boolAttrElem(elem, attrName, val));
}

/**
 * Adds a text node to the element. The `text()` variant takes no `elem`, and `value` may be an
 * observable or function.
 * @param {Element} elem: The element to update.
 * @param {String} value: The text value to add.
 */
export function textElem(elem: Node, value: string): void {
  elem.appendChild(G.document.createTextNode(value));
}
export function text(valueObs: BindableValue<string>): DomMethod {
  return (elem) => {
    const textNode = G.document.createTextNode('');
    _subscribe(elem, valueObs, (val) => { textNode.nodeValue = val; });
    elem.appendChild(textNode);
  };
}

/**
 * Sets a style property of a DOM element to the given value. The `style()` variant takes no
 * `elem`, and `value` may be an observable or function.
 * @param {Element} elem: The element to update.
 * @param {String} property: The name of the style property to update, e.g. 'fontWeight'.
 * @param {String} value: The value for the property.
 */
export function styleElem(elem: Element, property: string, value: string): void {
  (elem as any).style[property] = value;
}
export function style(property: string, valueObs: BindableValue<string>): DomElementMethod {
  return (elem) =>
    _subscribe(elem, valueObs, (val) => styleElem(elem, property, val));
}

/**
 * Sets the property of a DOM element to the given value.
 * The `prop()` variant takes no `elem`, and `value` may be an observable or function.
 * @param {Element} elem: The element to update.
 * @param {String} property: The name of the property to update, e.g. 'disabled'.
 * @param {Object} value: The value for the property.
 */
export function propElem(elem: Node, property: string, value: any): void {
  (elem as any)[property] = value;
}
export function prop(property: string, valueObs: BindableValue<any>): DomMethod {
  return (elem) => _subscribe(elem, valueObs, (val) => propElem(elem, property, val));
}

/**
 * Shows or hides the element depending on a boolean value. Note that the element must be visible
 * initially (i.e. unsetting style.display should show it).
 * The `show()` variant takes no `elem`, and `boolValue` may be an observable or function.
 * @param {Element} elem: The element to update.
 * @param {Boolean} boolValue: True to show the element, false to hide it.
 */
export function showElem(elem: Element, boolValue: boolean): void {
  (elem as HTMLElement).style.display = boolValue ? '' : 'none';
}
export function show(boolValueObs: BindableValue<boolean>): DomElementMethod {
  return (elem) =>
    _subscribe(elem, boolValueObs, (val) => showElem(elem, val));
}

/**
 * The opposite of show, hiding the element when boolValue is true.
 * The `hide()` variant takes no `elem`, and `boolValue` may be an observable or function.
 * @param {Element} elem: The element to update.
 * @param {Boolean} boolValue: True to hide the element, false to show it.
 */
export function hideElem(elem: Element, boolValue: boolean): void {
  (elem as HTMLElement).style.display = boolValue ? 'none' : '';
}
export function hide(boolValueObs: BindableValue<boolean>): DomElementMethod {
  return (elem) =>
    _subscribe(elem, boolValueObs, (val) => hideElem(elem, val));
}

/**
 * Toggles a css class `className` according to a boolean value.
 * The `toggleClass()` variant takes no `elem`, and `boolValue` may be an observable or function.
 * @param {Element} elem: The element to update.
 * @param {String} className: The name of the class to toggle.
 * @param {Boolean} boolValue: Whether to add or remove the class.
 */
export function toggleClassElem(elem: Element, className: string, boolValue: boolean): void {
  elem.classList.toggle(className, Boolean(boolValue));
}
export function toggleClass(className: string, boolValueObs: BindableValue<boolean>): DomElementMethod {
  return (elem) => _subscribe(elem, boolValueObs, (val) => toggleClassElem(elem, className, val));
}

/**
 * Adds a css class of the given name. A falsy name does not add any class. The `cssClass()`
 * variant takes no `elem`, and `className` may be an observable or function. In this case, when
 * the class name changes, the previously-set class name is removed.
 * @param {Element} elem: The element to update.
 * @param {String} className: The name of the class to add.
 */
export function cssClassElem(elem: Element, className: string): void {
  if (className) {
    elem.classList.add(className);
  }
}
export function cssClass(classNameObs: BindableValue<string>): DomElementMethod {
  return (elem) => {
    let prevClass: string|null = null;
    _subscribe(elem, classNameObs, (name: string) => {
      if (prevClass) {
        elem.classList.remove(prevClass);
      }
      prevClass = name;
      if (name) {
        elem.classList.add(name);
      }
    });
  };
}

/**
 * Associate arbitrary data with a DOM element. The `data()` variant takes no `elem`, and `value`
 * may be an observable or function.
 * @param {Element} elem: The element with which to associate data.
 * @param {String} key: Key to identify this piece of data among others attached to elem.
 * @param {Object} value: Arbitrary value to associate with elem.
 */
export function dataElem(elem: Node, key: string, value: any): void {
  const obj = _dataMap.get(elem);
  if (obj) {
    obj[key] = value;
  } else {
    _domDispose.onDisposeElem(elem, () => _dataMap.delete(elem));
    _dataMap.set(elem, {[key]: value});
  }
}
export function data(key: string, valueObs: BindableValue<any>): DomMethod {
  return (elem) => _subscribe(elem, valueObs, (val) => dataElem(elem, key, val));
}
export function getData(elem: Node, key: string) {
  const obj = _dataMap.get(elem);
  return obj && obj[key];
}

// Helper for dom.computed(); replace content between markerPre and markerPost with the given DOM
// content, running disposers if any on the removed content.
function _replaceContent(elem: Node, markerPre: Node, markerPost: Node, content: DomArg): void {
  if (markerPre.parentNode === elem) {
    let next;
    for (let n = markerPre.nextSibling; n && n !== markerPost; n = next) {
      next = n.nextSibling;
      _domDispose.dispose(n);
      elem.removeChild(n);
    }
    elem.insertBefore(frag(content), markerPost);
  }
}

/**
 * Appends dynamic DOM content to an element. The value may be an observable or function (from
 * which a computed is created), whose value will be passed to `contentFunc` which should return
 * DOM content. If the contentFunc is omitted, it defaults to identity, i.e. it's OK for the
 * observable or function to return DOM directly.
 *
 * The DOM content returned may be an element, string, array, or null. Whenever the observable
 * changes, previous content is disposed and removed, and new content added in its place.
 *
 * These are roughly equivalent:
 *  (A) dom.computed(nlinesObs, nlines => nlines > 1 ? dom('textarea') : dom('input'));
 *  (B) dom.computed(use => use(nlinesObs) > 1, isTall => isTall ? dom('textarea') : dom('input'));
 *  (C) dom.computed(use => use(nlinesObs) > 1 ? dom('textarea') : dom('input'));
 *
 * Here, (B) is best. It encapsulates meaningful changes in the observable, and separates DOM
 * creation, so that DOM is only recreated when necessary. Between (A) and (C), (A) should be
 * preferred. Both (A) and (C) would rebuild DOM for any change in nlinesObs, but in (C), it's too
 * easy to use `use` more than necessary and cause inadvertent rebuilding of DOM.
 *
 * Syntax (C), without the last argument, may be useful in cases of DOM depending on several
 * observables, e.g.
 *
 *    dom.computed(use => use(readonlyObs) ? dom('div') :
 *                          (use(nlinesObs) > 1 ? dom('textarea') : dom('input')));
 *
 * If the argument is not an observable, dom.computed() may but should not be used. The following
 * are equivalent:
 *
 *    dom(..., dom.computed(listValue, list => list.map(x => dom('div', x))), ...)
 *    dom(..., listValue.map(x => dom('div', x)), ...)
 *
 * In this case, the latter is preferred as the clearly simpler one.
 *
 * @param {Element} elem: The element to which to append the DOM content.
 * @param {Object} valueObs: Observable or function for a computed.
 * @param [Function] contentFunc: Function called with the result of valueObs as the input, and
 *    returning DOM as output. If omitted, defaults to the identity function.
 */
export function computed<T extends DomArg>(valueObs: BindableValue<T>): DomMethod;
export function computed<T>(valueObs: BindableValue<T>, contentFunc: (val: T) => DomArg): DomMethod;
export function computed<T>(valueObs: BindableValue<T>, contentFunc?: (val: T) => DomArg): DomMethod {
  const _contentFunc: (val: T) => DomArg = contentFunc || (identity as any);
  return (elem: Node) => {
    const markerPre = G.document.createComment('a');
    const markerPost = G.document.createComment('b');
    elem.appendChild(markerPre);
    elem.appendChild(markerPost);
    _subscribe(elem, valueObs,
      (value) => _replaceContent(elem, markerPre, markerPost, _contentFunc(value)));
  };
}

function identity<T>(arg: T): T { return arg; }

/**
 * Conditionally appends DOM to an element. The value may be an observable or function (from which
 * a computed is created), whose value -- if truthy -- will be passed to `contentFunc` which
 * should return DOM content. If the value is falsy, DOM content is removed.
 *
 * Note that if the observable changes between different truthy values, contentFunc gets called
 * for each value, and previous content gets destroyed. To consider all truthy values the same,
 * use an observable that returns a proper boolean, e.g.
 *
 *    dom.maybe(use => Boolean(use(fooObs)), () => dom(...));
 *
 * As with dom.computed(), dom.maybe() may but should not be used when the argument is not an
 * observable or function. The following are equivalent:
 *
 *    dom(..., dom.maybe(myValue, () => dom(...)));
 *    dom(..., myValue ? dom(...) : null);
 *
 * The latter is preferred for being simpler.
 *
 * @param {Element} elem: The element to which to append the DOM content.
 * @param {Object} boolValueObs: Observable or function for a computed.
 * @param [Function] contentFunc: Function called with the result of boolValueObs when it is
 *    truthy. Should returning DOM as output.
 */
export function maybe<T>(boolValueObs: BindableValue<T>, contentFunc: (val: T) => DomArg): DomMethod {
  return computed(boolValueObs, (value) => value ? contentFunc(value) : null);
}
