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

const _ = require('lodash');

// Use the browser globals in a way that allows replacing them with mocks in tests.
const G = require('./browserGlobals.js').use('Node', 'document');

// For inline modifications, some other options were considered:
// (1) Chainable methods (to use e.g. `dom('div').attr('href', url).value()`). This approach is
//     criticized here:
//     https://medium.com/making-internets/why-using-chain-is-a-mistake-9bc1f80d51ba
// (2) Adding methods to DOM (to use e.g. `dom('div').attr('href', url)`. This is criticized here:
//     http://perfectionkills.com/whats-wrong-with-extending-the-dom/
// The approach chosen (inline modifications using functions that are typically bound on the fly)
// is more flexible and robust, and only suffers from slightly more verbosity.


/**
 * dom('tag#id.class1.class2', ...args)
 *   The first argument is a string consisting of a tag name, with optional #foo suffix
 *   to add the ID 'foo', and zero or more .bar suffixes to add a css class 'bar'.
 *
 * The rest of the arguments are optional and may be:
 *
 *   Nodes - which become children of the created element;
 *   strings - which become text node children;
 *   objects - of the form {attr: val} to set additional attributes on the element;
 *   Arrays - which are flattened with each item processed recursively;
 *   functions - which are called with elem as the argument, for a chance to modify the
 *       element as it's being created. Return values are processed recursively.
 */
function dom(tagString, ...args) {
  // We do careful hand-written parsing rather than use a regexp for speed. Using a regexp is
  // significantly more expensive.
  let tag, id, classes;
  let dotPos = tagString.indexOf(".");
  let hashPos = tagString.indexOf('#');
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

  let elem = G.document.createElement(tag);
  if (id) { elem.setAttribute('id', id); }
  if (classes) { elem.setAttribute('class', classes); }
  return _updateWithArgs(elem, args);
}


/**
 * Update an element with any number of arguments, as documented in dom().
 */
function update(elem, ...args) {
  return _updateWithArgs(elem, args);
}
dom.update = update;


/**
 * Update an element with an array of arguments.
 */
function _updateWithArgs(elem, args) {
  for (let arg of args) {
    _updateWithArg(elem, arg);
  }
  return elem;
}

/**
 * Update an element with a single argument.
 */
function _updateWithArg(elem, arg) {
  if (typeof arg === 'function') {
    let value = arg(elem);
    // Skip the recursive call in the common case when the function returns nothing.
    if (!_.isNil(value)) {
      _updateWithArg(elem, value);
    }
  } else if (Array.isArray(arg)) {
    _updateWithArgs(elem, arg);
  } else if (_.isNil(arg)) {
    // Nothing to do.
  } else if (arg instanceof G.Node) {
    elem.appendChild(arg);
  } else if (_.isObjectLike(arg)) {
    attrs(elem, arg);
  } else {
    elem.appendChild(G.document.createTextNode(arg));
  }
}


/**
 * Creates a DocumentFragment processing arguments the same way as the dom() function.
 */
function frag(...args) {
  let elem = G.document.createDocumentFragment();
  return _updateWithArgs(elem, args);
}
dom.frag = frag;


function _makeFuncOfOne(f) {
  // The default case is enough, but the individual cases are an order of magnitude faster, at
  // least on Node.js (for no good reason though, so we may well want to simplify it to a
  // one-liner in the future).
  return function(...a) {
    switch (a.length) {
      case 0:  return arg => f(arg);
      case 1:  return arg => f(arg, a[0]);
      case 2:  return arg => f(arg, a[0], a[1]);
      case 3:  return arg => f(arg, a[0], a[1], a[2]);
      case 4:  return arg => f(arg, a[0], a[1], a[2], a[3]);
      default: return arg => f(arg, ...a);
    }
  };
}

/**
 * This exports two versions of each function, with the following being equivalent:
 *    attrE(elem, key, value)
 *    attr(key, value)(elem)
 * This makes `attr(key, value)` usable as an argument to dom().
 */
function _register(name, func) {
  dom[name + 'E'] = func;
  dom[name] = _makeFuncOfOne(func);
}


function attrs(elem, attrsObj) {
  for (let key of Object.keys(attrsObj)) {
    elem.setAttribute(key, attrsObj[key]);
  }
}
_register('attrs', attrs);



/**
 * Sets an attribute of a DOM element to the given value. Removes the attribute when the value is
 * null or undefined.
 * @param {Element} elem: The element to update.
 * @param {String} attrName: The name of the attribute to bind, e.g. 'href'.
 * @param {String|null} attrValue: The string value or null to remove the attribute.
 */
function attr(elem, attrName, attrValue) {
  if (_.isNil(attrValue)) {
    elem.removeAttribute(attrName);
  } else {
    elem.setAttribute(attrName, attrValue);
  }
}
_register('attr', attr);


/**
 * Sets or removes a boolean attribute of a DOM element. According to the spec, empty string is a
 * valid true value for the attribute, and the false value is indicated by the attribute's absence.
 * @param {String} attrName: The name of the attribute to bind, e.g. 'href'.
 * @param {Boolean} boolValue: Boolean value whether to set or unset the attribute.
 */
function boolAttr(elem, attrName, boolValue) {
  attr(elem, attrName, boolValue ? '' : null);
}
_register('boolAttr', boolAttr);


/**
 * Adds a text node to the element.
 * @param {Element} elem: The element to update.
 * @param {String} value: The text value to add.
 */
function text(elem, value) {
  elem.appendChild(G.document.createTextNode(value));
}
_register('text', text);


/**
 * Sets a style property of a DOM element to the given value.
 * @param {Element} elem: The element to update.
 * @param {String} property: The name of the style property to update, e.g. 'fontWeight'.
 * @param {String} value: The value for the property.
 */
function style(elem, property, value) {
  elem.style[property] = value;
}
_register('style', style);


/**
 * Sets the property of a DOM element to the given value.
 * @param {Element} elem: The element to update.
 * @param {String} property: The name of the property to update, e.g. 'disabled'.
 * @param {Object} value: The value for the property.
 */
function prop(elem, property, value) {
  elem[property] = value;
}
_register('prop', prop);


/**
 * Shows or hides the element depending on a boolean value. Note that the element must be visible
 * initially (i.e. unsetting style.display should show it).
 * @param {Element} elem: The element to update.
 * @param {Boolean} boolValue: True to show the element, false to hide it.
 */
function show(elem, boolValue) {
  elem.style.display = boolValue ? '' : 'none';
}
_register('show', show);


/**
 * The opposite of show, hiding the element when boolValue is true.
 * @param {Element} elem: The element to update.
 * @param {Boolean} boolValue: True to hide the element, false to show it.
 */
function hide(elem, boolValue) {
  elem.style.display = boolValue ? 'none' : '';
}
_register('hide', hide);


/**
 * Sets the .value property of a DOM element.
 * @param {Element} elem: The element to update.
 * @param {Object} val: The value to set for the .value property.
 */
function value(elem, val) {
  elem.value = value;
}
_register('value', value);


/**
 * Toggles a css class `className` according to a boolean value.
 * @param {Element} elem: The element to update.
 * @param {String} className: The name of the class to toggle.
 * @param {Boolean} boolValue: Whether to add or remove the class.
 */
function toggleClass(elem, className, boolValue) {
  elem.classList.toggle(className, Boolean(boolValue));
}
_register('toggleClass', toggleClass);


/**
 * Adds a css class named of the given name.
 * @param {Element} elem: The element to update.
 * @param {String} className: The name of the class to add.
 */
function cssClass(elem, className) {
  elem.classList.add(className);
}
_register('cssClass', cssClass);


module.exports = dom;
