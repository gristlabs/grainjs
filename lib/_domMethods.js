"use strict";

const isNil = require('lodash/isNil');
const binding = require('./binding.js');
const _domDispose = require('./_domDispose.js');

// Use the browser globals in a way that allows replacing them with mocks in tests.
const G = require('./browserGlobals.js').use('document');


/**
 * Private global map for associating arbitrary data with DOM. It's a WeakMap, so does not prevent
 * values from being garbage collected when the owning DOM elements are no longer used.
 */
let _dataMap = new WeakMap();


/**
 * Internal helper that binds the callback to valueObs, which may be a value, observble, or
 * function, and attaches a disposal callback to the passed-in element.
 */
function _subscribe(elem, valueObs, callback) {
  _domDispose.autoDisposeElem(elem, binding.subscribe(valueObs, callback));
}


/**
 * Sets multiple attributes of a DOM element. The `attrs()` variant takes no `elem` argument.
 * @param {Element} elem: The element to update.
 * @param {Object} attrsObj: Object mapping attribute names to attribute values.
 */
function attrsElem(elem, attrsObj) {
  for (let key of Object.keys(attrsObj)) {
    elem.setAttribute(key, attrsObj[key]);
  }
}
function attrs(attrsObj) {
  return elem => attrsElem(elem, attrsObj);
}
exports.attrsElem = attrsElem;
exports.attrs = attrs;


/**
 * Sets an attribute of a DOM element to the given value. Removes the attribute when the value is
 * null or undefined. The `attr()` variant takes no `elem` argument, and `attrValue` may be an
 * observable or function.
 * @param {Element} elem: The element to update.
 * @param {String} attrName: The name of the attribute to bind, e.g. 'href'.
 * @param {String|null} attrValue: The string value or null to remove the attribute.
 */
function attrElem(elem, attrName, attrValue) {
  if (isNil(attrValue)) {
    elem.removeAttribute(attrName);
  } else {
    elem.setAttribute(attrName, attrValue);
  }
}
function attr(attrName, attrValueObs) {
  return elem => _subscribe(elem, attrValueObs, val => attrElem(elem, attrName, val));
}
exports.attrElem = attrElem;
exports.attr = attr;


/**
 * Sets or removes a boolean attribute of a DOM element. According to the spec, empty string is a
 * valid true value for the attribute, and the false value is indicated by the attribute's absence.
 * The `boolAttr()` variant takes no `elem`, and `boolValue` may be an observable or function.
 * @param {Element} elem: The element to update.
 * @param {String} attrName: The name of the attribute to bind, e.g. 'checked'.
 * @param {Boolean} boolValue: Boolean value whether to set or unset the attribute.
 */
function boolAttrElem(elem, attrName, boolValue) {
  attrElem(elem, attrName, boolValue ? '' : null);
}
function boolAttr(attrName, boolValueObs) {
  return elem => _subscribe(elem, boolValueObs, val => boolAttrElem(elem, attrName, val));
}
exports.boolAttrElem = boolAttrElem;
exports.boolAttr = boolAttr;


/**
 * Adds a text node to the element. The `text()` variant takes no `elem`, and `value` may be an
 * observable or function.
 * @param {Element} elem: The element to update.
 * @param {String} value: The text value to add.
 */
function textElem(elem, value) {
  elem.appendChild(G.document.createTextNode(value));
}
function text(valueObs) {
  return elem => {
    let textNode = G.document.createTextNode('');
    _subscribe(elem, valueObs, val => { textNode.nodeValue = val; });
    elem.appendChild(textNode);
  };
}
exports.textElem = textElem;
exports.text = text;


/**
 * Sets a style property of a DOM element to the given value. The `style()` variant takes no
 * `elem`, and `value` may be an observable or function.
 * @param {Element} elem: The element to update.
 * @param {String} property: The name of the style property to update, e.g. 'fontWeight'.
 * @param {String} value: The value for the property.
 */
function styleElem(elem, property, value) {
  elem.style[property] = value;
}
function style(property, valueObs) {
  return elem => _subscribe(elem, valueObs, val => styleElem(elem, property, val));
}
exports.styleElem = styleElem;
exports.style = style;


/**
 * Sets the property of a DOM element to the given value.
 * The `prop()` variant takes no `elem`, and `value` may be an observable or function.
 * @param {Element} elem: The element to update.
 * @param {String} property: The name of the property to update, e.g. 'disabled'.
 * @param {Object} value: The value for the property.
 */
function propElem(elem, property, value) {
  elem[property] = value;
}
function prop(property, valueObs) {
  return elem => _subscribe(elem, valueObs, val => propElem(elem, property, val));
}
exports.propElem = propElem;
exports.prop = prop;


/**
 * Shows or hides the element depending on a boolean value. Note that the element must be visible
 * initially (i.e. unsetting style.display should show it).
 * The `show()` variant takes no `elem`, and `boolValue` may be an observable or function.
 * @param {Element} elem: The element to update.
 * @param {Boolean} boolValue: True to show the element, false to hide it.
 */
function showElem(elem, boolValue) {
  elem.style.display = boolValue ? '' : 'none';
}
function show(boolValueObs) {
  return elem => _subscribe(elem, boolValueObs, val => showElem(elem, val));
}
exports.showElem = showElem;
exports.show = show;


/**
 * The opposite of show, hiding the element when boolValue is true.
 * The `hide()` variant takes no `elem`, and `boolValue` may be an observable or function.
 * @param {Element} elem: The element to update.
 * @param {Boolean} boolValue: True to hide the element, false to show it.
 */
function hideElem(elem, boolValue) {
  elem.style.display = boolValue ? 'none' : '';
}
function hide(boolValueObs) {
  return elem => _subscribe(elem, boolValueObs, val => hideElem(elem, val));
}
exports.hideElem = hideElem;
exports.hide = hide;


/**
 * Toggles a css class `className` according to a boolean value.
 * The `toggleClass()` variant takes no `elem`, and `boolValue` may be an observable or function.
 * @param {Element} elem: The element to update.
 * @param {String} className: The name of the class to toggle.
 * @param {Boolean} boolValue: Whether to add or remove the class.
 */
function toggleClassElem(elem, className, boolValue) {
  elem.classList.toggle(className, Boolean(boolValue));
}
function toggleClass(className, boolValueObs) {
  return elem => _subscribe(elem, boolValueObs, val => toggleClassElem(elem, className, val));
}
exports.toggleClassElem = toggleClassElem;
exports.toggleClass = toggleClass;


/**
 * Adds a css class of the given name. A falsy name does not add any class. The `cssClass()`
 * variant takes no `elem`, and `className` may be an observable or function. In this case, when
 * the class name changes, the previously-set class name is removed.
 * @param {Element} elem: The element to update.
 * @param {String} className: The name of the class to add.
 */
function cssClassElem(elem, className) {
  if (className) {
    elem.classList.add(className);
  }
}
function cssClass(classNameObs) {
  return elem => {
    let prevClass;
    _subscribe(elem, classNameObs, name => {
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
exports.cssClassElem = cssClassElem;
exports.cssClass = cssClass;


/**
 * Associate arbitrary data with a DOM element. The `data()` variant takes no `elem`, and `value`
 * may be an observable or function.
 * @param {Element} elem: The element with which to associate data.
 * @param {String} key: Key to identify this piece of data among others attached to elem.
 * @param {Object} value: Arbitrary value to associate with elem.
 */
function dataElem(elem, key, value) {
  let obj = _dataMap.get(elem);
  if (obj) {
    obj[key] = value;
  } else {
    _domDispose.onDisposeElem(elem, () => _dataMap.delete(elem));
    _dataMap.set(elem, {[key]: value});
  }
}
function data(key, valueObs) {
  return elem => _subscribe(elem, valueObs, val => dataElem(elem, key, val));
}
function getData(elem, key) {
  let obj = _dataMap.get(elem);
  return obj && obj[key];
}
exports.dataElem = dataElem;
exports.data = data;
exports.getData = getData;
