"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _domDispose_1 = require("./_domDispose");
const _domImpl_1 = require("./_domImpl");
const binding_1 = require("./binding");
// Use the browser globals in a way that allows replacing them with mocks in tests.
const browserGlobals_1 = require("./browserGlobals");
/**
 * Private global map for associating arbitrary data with DOM. It's a WeakMap, so does not prevent
 * values from being garbage collected when the owning DOM elements are no longer used.
 */
const _dataMap = new WeakMap();
/**
 * Internal helper that binds the callback to valueObs, which may be a value, observble, or
 * function, and attaches a disposal callback to the passed-in element.
 */
function _subscribe(elem, valueObs, callback) {
    _domDispose_1.autoDisposeElem(elem, binding_1.subscribe(valueObs, callback));
}
/**
 * Sets multiple attributes of a DOM element. The `attrs()` variant takes no `elem` argument.
 * @param {Object} attrsObj: Object mapping attribute names to attribute values.
 */
function attrsElem(elem, attrsObj) {
    for (const key of Object.keys(attrsObj)) {
        elem.setAttribute(key, attrsObj[key]);
    }
}
exports.attrsElem = attrsElem;
function attrs(attrsObj) {
    return (elem) => attrsElem(elem, attrsObj);
}
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
    if (attrValue === null || attrValue === undefined) {
        elem.removeAttribute(attrName);
    }
    else {
        elem.setAttribute(attrName, attrValue);
    }
}
exports.attrElem = attrElem;
function attr(attrName, attrValueObs) {
    return (elem) => _subscribe(elem, attrValueObs, (val) => attrElem(elem, attrName, val));
}
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
exports.boolAttrElem = boolAttrElem;
function boolAttr(attrName, boolValueObs) {
    return (elem) => _subscribe(elem, boolValueObs, (val) => boolAttrElem(elem, attrName, val));
}
exports.boolAttr = boolAttr;
/**
 * Adds a text node to the element. The `text()` variant takes no `elem`, and `value` may be an
 * observable or function.
 * @param {Element} elem: The element to update.
 * @param {String} value: The text value to add.
 */
function textElem(elem, value) {
    elem.appendChild(browserGlobals_1.G.document.createTextNode(value));
}
exports.textElem = textElem;
function text(valueObs) {
    return (elem) => {
        const textNode = browserGlobals_1.G.document.createTextNode('');
        _subscribe(elem, valueObs, (val) => { textNode.nodeValue = val; });
        elem.appendChild(textNode);
    };
}
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
exports.styleElem = styleElem;
function style(property, valueObs) {
    return (elem) => _subscribe(elem, valueObs, (val) => styleElem(elem, property, val));
}
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
exports.propElem = propElem;
function prop(property, valueObs) {
    return (elem) => _subscribe(elem, valueObs, (val) => propElem(elem, property, val));
}
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
exports.showElem = showElem;
function show(boolValueObs) {
    return (elem) => _subscribe(elem, boolValueObs, (val) => showElem(elem, val));
}
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
exports.hideElem = hideElem;
function hide(boolValueObs) {
    return (elem) => _subscribe(elem, boolValueObs, (val) => hideElem(elem, val));
}
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
exports.toggleClassElem = toggleClassElem;
function toggleClass(className, boolValueObs) {
    return (elem) => _subscribe(elem, boolValueObs, (val) => toggleClassElem(elem, className, val));
}
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
exports.cssClassElem = cssClassElem;
function cssClass(classNameObs) {
    return (elem) => {
        let prevClass = null;
        _subscribe(elem, classNameObs, (name) => {
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
exports.cssClass = cssClass;
/**
 * Associate arbitrary data with a DOM element. The `data()` variant takes no `elem`, and `value`
 * may be an observable or function.
 * @param {Element} elem: The element with which to associate data.
 * @param {String} key: Key to identify this piece of data among others attached to elem.
 * @param {Object} value: Arbitrary value to associate with elem.
 */
function dataElem(elem, key, value) {
    const obj = _dataMap.get(elem);
    if (obj) {
        obj[key] = value;
    }
    else {
        _domDispose_1.onDisposeElem(elem, () => _dataMap.delete(elem));
        _dataMap.set(elem, { [key]: value });
    }
}
exports.dataElem = dataElem;
function data(key, valueObs) {
    return (elem) => _subscribe(elem, valueObs, (val) => dataElem(elem, key, val));
}
exports.data = data;
function getData(elem, key) {
    const obj = _dataMap.get(elem);
    return obj && obj[key];
}
exports.getData = getData;
// Helper for domComputed(); replace content between markerPre and markerPost with the given DOM
// content, running disposers if any on the removed content.
function _replaceContent(elem, markerPre, markerPost, content) {
    if (markerPre.parentNode === elem) {
        let next;
        for (let n = markerPre.nextSibling; n && n !== markerPost; n = next) {
            next = n.nextSibling;
            _domDispose_1.domDispose(n);
            elem.removeChild(n);
        }
        elem.insertBefore(_domImpl_1.frag(content), markerPost);
    }
}
function domComputed(valueObs, contentFunc) {
    const _contentFunc = contentFunc || identity;
    return (elem) => {
        const markerPre = browserGlobals_1.G.document.createComment('a');
        const markerPost = browserGlobals_1.G.document.createComment('b');
        elem.appendChild(markerPre);
        elem.appendChild(markerPost);
        _subscribe(elem, valueObs, (value) => _replaceContent(elem, markerPre, markerPost, _contentFunc(value)));
    };
}
exports.domComputed = domComputed;
function identity(arg) { return arg; }
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
 * As with domComputed(), dom.maybe() may but should not be used when the argument is not an
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
function maybe(boolValueObs, contentFunc) {
    return domComputed(boolValueObs, (value) => value ? contentFunc(value) : null);
}
exports.maybe = maybe;
