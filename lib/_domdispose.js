"use strict";

/**
 * Private global disposal map. It maintains the association between DOM nodes and cleanup
 * functions added with dom.onDispose().
 */
let _disposeMap = new WeakMap();


// Internal helper to walk the DOM tree, calling visitFunc(elem) on all descendants of elem.
// Descendants are processed first. It support skipping: visitFunc(elem) may return a later
// sibling `c` of `elem`, in which case _walkDom will skip up to and including `c`.
function _walkDom(elem, visitFunc) {
  let c = elem.firstChild;
  while (c) {
    let skipTo = _walkDom(c, visitFunc);
    if (skipTo && skipTo.parentNode === elem) {
      c = skipTo;
    }
    c = c.nextSibling;
  }
  return visitFunc(elem);
}


// Internal helper to run all disposers for a single element.
function _disposeElem(elem) {
  let disposerFunc = _disposeMap.get(elem);
  let ret;
  if (disposerFunc) {
    _disposeMap.delete(elem);
    while (disposerFunc) {
      ret = disposerFunc(elem) || ret;
      disposerFunc = disposerFunc.nextDisposer;
    }
  }
  return ret;
}


/**
 * Run disposers associated with any descendant of elem or with elem itself. Disposers get
 * associated with elements using dom.onDispose(). Descendants are processed first.
 *
 * It is automatically called if one of the function arguments to dom() throws an exception during
 * element creation. This way any onDispose() handlers set on the unfinished element get called.
 *
 * Note that this supports a particular internally-used feature: a disposer associated with an
 * element may return a later sibling that it claims ownership of. In this case, disposal will
 * skip past that later sibling. It is up to such disposer to dispose elements in the skipped
 * range.
 *
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


/**
 * Make the given element own the disposable, and call its dispose method when dom.dispose() is
 * called on the element or any of its parents.
 * @param {Element} elem: The element to own the disposable.
 * @param {Disposable} disposable: Anything with a .dispose() method.
 */
function autoDisposeElem(elem, disposable) {
  onDisposeElem(elem, () => disposable.dispose());
}
function autoDispose(disposable) {
  return elem => autoDisposeElem(elem, disposable);
}
exports.autoDisposeElem = autoDisposeElem;
exports.autoDispose = autoDispose;
