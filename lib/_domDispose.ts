import {IDisposable} from './dispose';

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
const _disposeMap: WeakMap<Node|INodeFunc, INodeFunc> = new WeakMap();

type INodeFunc = (node: Node) => void;

// Internal helper to walk the DOM tree, calling visitFunc(elem) on all descendants of elem.
// Descendants are processed first.
function _walkDom(elem: Node, visitFunc: INodeFunc): void {
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
function _disposeElem(elem: Node): void {
  let disposer = _disposeMap.get(elem);
  if (disposer) {
    let key: Node|INodeFunc = elem;
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
export function dispose(elem: Node): void {
  _walkDom(elem, _disposeElem);
}

/**
 * Associate a disposerFunc with a DOM element. It will be called when the element is disposed
 * using dom.dispose() on it or any of its parents. If onDispose is called multiple times, all
 * disposerFuncs will be called in reverse order.
 * @param {Element} elem: The element to associate the disposer with.
 * @param {Function} disposerFunc(elem): Will be called when dom.dispose() is called on the
 *    element or its ancestor.
 * Note that it is not necessary usually to dispose event listeners attached to an element (e.g.
 * with dom.on()) since their lifetime is naturally limited to the lifetime of the element.
 */
export function onDisposeElem(elem: Node, disposerFunc: INodeFunc): void {
  const prevDisposer = _disposeMap.get(elem);
  _disposeMap.set(elem, disposerFunc);
  if (prevDisposer) {
    _disposeMap.set(disposerFunc, prevDisposer);
  }
}
export function onDispose(disposerFunc: INodeFunc) {
  return (elem: Node) => onDisposeElem(elem, disposerFunc);
}

/**
 * Make the given element own the disposable, and call its dispose method when dom.dispose() is
 * called on the element or any of its parents.
 * @param {Element} elem: The element to own the disposable.
 * @param {Disposable} disposable: Anything with a .dispose() method.
 */
export function autoDisposeElem(elem: Node, disposable: IDisposable|null) {
  if (disposable) {
    onDisposeElem(elem, () => disposable.dispose());
  }
}
export function autoDispose(disposable: IDisposable|null) {
  if (disposable) {
    return (elem: Node) => autoDisposeElem(elem, disposable);
  }
}
