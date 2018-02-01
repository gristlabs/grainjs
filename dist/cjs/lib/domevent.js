"use strict";
/**
 * domevent provides a way to listen to DOM events, similar to JQuery's `on()` function. Its
 * methods are also exposed via the dom.js module, as `dom.on()`, etc.
 *
 * It is typically used as an argument to the dom() function:
 *
 *    dom('div', dom.on('click', (event, elem) => { ... }));
 *
 * When the div is disposed, the listener is automatically removed.
 *
 * The underlying interface to listen to an event is this:
 *
 *    let listener = dom.onElem(elem, 'click', (event, elem) => { ... });
 *
 * The callback is called with the event and the element to which it was attached. Unlike in
 * JQuery, the callback's return value is ignored. Use event.stopPropagation() and
 * event.preventDefault() explicitly if needed.
 *
 * To stop listening:
 *
 *    listener.dispose();
 *
 * Disposing the listener returned by .on() is the only way to stop listening to an event. You can
 * use autoDispose to stop listening automatically when subscribing in a Disposable object:
 *
 *    this.autoDispose(domevent.on(document, 'mouseup', callback));
 *
 * To listen to descendants of an element matching the given selector (what JQuery calls
 * "delegated events", see http://api.jquery.com/on/):
 *
 *    dom('div', dom.onMatch('.selector', 'click', (event, elem) => { ... }));
 * or
 *    let lis = domevent.onMatchElem(elem, '.selector', 'click', (event, el) => { ... });
 *
 * In this usage, the element passed to the callback will be a DOM element matching the given
 * selector. If there are multiple matches, the callback is only called for the innermost one.
 *
 * If you need to remove the callback on first call, here's a useful pattern:
 *    let lis = domevent.onElem(elem, 'mouseup', e => { lis.dispose(); other_work(); });
 */
Object.defineProperty(exports, "__esModule", { value: true });
function _findMatch(inner, outer, selector) {
    for (let el = inner; el && el !== outer; el = el.parentElement) {
        if (el.matches(selector)) {
            return el;
        }
    }
    return null;
}
class DomEventListener {
    constructor(elem, eventType, callback, useCapture, selector) {
        this.elem = elem;
        this.eventType = eventType;
        this.callback = callback;
        this.useCapture = useCapture;
        this.selector = selector;
        this.elem.addEventListener(this.eventType, this, this.useCapture);
    }
    handleEvent(event) {
        const cb = this.callback;
        cb(event, this.elem);
    }
    dispose() {
        this.elem.removeEventListener(this.eventType, this, this.useCapture);
    }
}
class DomEventMatchListener extends DomEventListener {
    handleEvent(event) {
        const elem = _findMatch(event.target, this.elem, this.selector);
        if (elem) {
            const cb = this.callback;
            cb(event, elem);
        }
    }
}
/**
 * Listen to a DOM event. The `on()` variant takes no `elem` argument, and may be used as an
 * argument to dom() function.
 * @param {DOMElement} elem: DOM Element to listen to.
 * @param {String} eventType: Event type to listen for (e.g. 'click').
 * @param {Function} callback: Callback to call as `callback(event, elem)`, where elem is `elem`.
 * @param [Boolean] options.useCapture: Add the listener in the capture phase. This should very
 *    rarely be useful (e.g. JQuery doesn't even offer it as an option).
 * @returns {Object} Listener object whose .dispose() method will remove the event listener.
 */
function onElem(elem, eventType, callback, { useCapture = false } = {}) {
    return new DomEventListener(elem, eventType, callback, useCapture);
}
exports.onElem = onElem;
function on(eventType, callback, { useCapture = false } = {}) {
    return (elem) => new DomEventListener(elem, eventType, callback, useCapture);
}
exports.on = on;
/**
 * Listen to a DOM event on descendants of the given elem matching the given selector. The
 * `onMatch()` variant takes no `elem` argument, and may be used as an argument to dom().
 * @param {DOMElement} elem: DOM Element to whose descendants to listen.
 * @param {String} selector: CSS selector string to filter elements that trigger this event.
 *    JQuery calls it "delegated events" (http://api.jquery.com/on/). The callback will only be
 *    called when the event occurs for an element matching the given selector. If there are
 *    multiple elements matching the selector, the callback is only called for the innermost one.
 * @param {String} eventType: Event type to listen for (e.g. 'click').
 * @param {Function} callback: Callback to call as `callback(event, elem)`, where elem is a
 *    descendent of `elem` which matches `selector`.
 * @param [Boolean] options.useCapture: Add the listener in the capture phase. This should very
 *    rarely be useful (e.g. JQuery doesn't even offer it as an option).
 * @returns {Object} Listener object whose .dispose() method will remove the event listener.
 */
function onMatchElem(elem, selector, eventType, callback, { useCapture = false } = {}) {
    return new DomEventMatchListener(elem, eventType, callback, useCapture, selector);
}
exports.onMatchElem = onMatchElem;
function onMatch(selector, eventType, callback, { useCapture = false } = {}) {
    return (elem) => new DomEventMatchListener(elem, eventType, callback, useCapture, selector);
}
exports.onMatch = onMatch;
