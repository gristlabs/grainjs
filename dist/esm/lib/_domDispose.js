/**
 * Private global disposal map. It maintains the association between DOM nodes and cleanup
 * functions added with dom.onDispose(). To support multiple disposers on one element, we use a
 * WeakMap-based linked list:
 *
 *    _disposeMap[elem] = disposer2;
 *    _disposeMap[disposer2] = disposer1;
 *    etc.
 *
 * This avoids allocating arrays or using undeclared properties for a different linked list.
 */
const _disposeMap = new WeakMap();
// Internal helper to walk the DOM tree, calling visitFunc(elem) on all descendants of elem.
// Descendants are processed first.
function _walkDom(elem, visitFunc) {
    let c = elem.firstChild;
    while (c) {
        // Note: this might be better done using an explicit stack, but in practice DOM trees aren't
        // so deep as to cause problems.
        _walkDom(c, visitFunc);
        c = c.nextSibling;
    }
    visitFunc(elem);
}
// Internal helper to run all disposers for a single element.
function _disposeElem(elem) {
    let disposer = _disposeMap.get(elem);
    if (disposer) {
        let key = elem;
        do {
            _disposeMap.delete(key);
            disposer(elem);
            // Find the next disposer; these are chained when there are multiple.
            key = disposer;
            disposer = _disposeMap.get(key);
        } while (disposer);
    }
}
/**
 * Run disposers associated with any descendant of elem or with elem itself. Disposers get
 * associated with elements using dom.onDispose(). Descendants are processed first.
 *
 * It is automatically called if one of the function arguments to dom() throws an exception during
 * element creation. This way any onDispose() handlers set on the unfinished element get called.
 *
 * @param {Element} elem: The element to run disposers on.
 */
export function domDispose(elem) {
    _walkDom(elem, _disposeElem);
}
/**
 * Associate a disposerFunc with a DOM element. It will be called when the element is disposed
 * using domDispose() on it or any of its parents. If onDispose is called multiple times, all
 * disposerFuncs will be called in reverse order.
 * @param {Element} elem: The element to associate the disposer with.
 * @param {Function} disposerFunc(elem): Will be called when domDispose() is called on the
 *    element or its ancestor.
 * Note that it is not necessary usually to dispose event listeners attached to an element (e.g.
 * with dom.on()) since their lifetime is naturally limited to the lifetime of the element.
 */
export function onDisposeElem(elem, disposerFunc) {
    const prevDisposer = _disposeMap.get(elem);
    _disposeMap.set(elem, disposerFunc);
    if (prevDisposer) {
        _disposeMap.set(disposerFunc, prevDisposer);
    }
}
export function onDispose(disposerFunc) {
    return (elem) => onDisposeElem(elem, disposerFunc);
}
/**
 * Make the given element own the disposable, and call its dispose method when domDispose() is
 * called on the element or any of its parents.
 * @param {Element} elem: The element to own the disposable.
 * @param {Disposable} disposable: Anything with a .dispose() method.
 */
export function autoDisposeElem(elem, disposable) {
    if (disposable) {
        onDisposeElem(elem, () => disposable.dispose());
    }
}
export function autoDispose(disposable) {
    if (disposable) {
        return (elem) => autoDisposeElem(elem, disposable);
    }
}
