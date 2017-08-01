"use strict";

/**
 * Private global disposal map. It maintains the association between DOM nodes and cleanup
 * functions added with dom.onDispose().
 */
let _disposeMap = new WeakMap();


// Internal helper to walk the DOM tree, calling visitFunc(elem) on all descendants of elem.
// Descendants are processed first.
function _walkDom(elem, visitFunc) {
  let c = elem.firstChild;
  while (c) {
    _walkDom(c, visitFunc);
    c = c.nextSibling;
  }
  visitFunc(elem);
}


// Internal helper to run all disposers for a single element.
function _disposeElem(elem) {
  let disposerFunc = _disposeMap.get(elem);
  if (disposerFunc) {
    _disposeMap.delete(elem);
    while (disposerFunc) {
      disposerFunc(elem);
      disposerFunc = disposerFunc.nextDisposer;
    }
  }
}


/**
 * Run disposers associated with any descendant of elem or with elem itself. Disposers get
 * associated with elements using dom.onDispose(). Descendants are processed first.
 * @param {Element} elem: The element to run disposers on.
 */
function dispose(elem) {
  _walkDom(elem, _disposeElem);
}
exports.dispose = dispose;


/**
 * Associate a disposerFunc with a DOM element. It will be called when the element is disposed
 * using dom.dispose() on it or any of its parents. If onDispose is called multiple times, all
 * disposerFuncs will be called in reverse order.
 * @param {Element} elem: The element to associate disposer with.
 * @param {Function} disposerFunc(elem): Will be called when dom.dispose() is called on the
 *    element or its ancestor.
 * Note that it is not necessary usually to dispose event listeners attached to an element (e.g.
 * with domevent.on()) since their lifetime is naturally limited to the lifetime of the element.
 */
function onDisposeElem(elem, disposerFunc) {
  let prevDisposer = _disposeMap.get(elem);
  disposerFunc.nextDisposer = prevDisposer;
  _disposeMap.set(elem, disposerFunc);
}
function onDispose(disposerFunc) {
  return elem => onDisposeElem(elem, disposerFunc);
}
exports.onDisposeElem = onDisposeElem;
exports.onDispose = onDispose;
