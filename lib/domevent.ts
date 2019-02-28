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
 * Disposing the listener returned by .onElem() is the only way to stop listening to an event. You
 * can use autoDispose to stop listening automatically when subscribing in a Disposable object:
 *
 *    this.autoDispose(domevent.onElem(document, 'mouseup', callback));
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

import {DomElementMethod} from './_domImpl';
import {IDisposable} from './dispose';

export type EventCB = (this: void, event: Event, elem: Element) => void;

function _findMatch(inner: Element, outer: Element, selector: string): Element|null {
  for (let el: Element|null = inner; el && el !== outer; el = el.parentElement) {
    if (el.matches(selector)) {
      return el;
    }
  }
  return null;
}

class DomEventListener implements EventListenerObject, IDisposable {
  constructor(protected elem: EventTarget,
              protected eventType: string,
              protected callback: EventCB,
              protected useCapture: boolean,
              protected selector?: string) {
    this.elem.addEventListener(this.eventType, this, this.useCapture);
  }

  public handleEvent(event: Event) {
    const cb = this.callback;
    cb(event, this.elem as Element);
  }

  public dispose() {
    this.elem.removeEventListener(this.eventType, this, this.useCapture);
  }
}

class DomEventMatchListener extends DomEventListener {
  public handleEvent(event: Event) {
    const elem = _findMatch(event.target as Element, this.elem as Element, this.selector!);
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
export function onElem(elem: EventTarget, eventType: string, callback: EventCB,
                       {useCapture = false} = {}): IDisposable {
  return new DomEventListener(elem, eventType, callback, useCapture);
}
export function on(eventType: string, callback: EventCB, {useCapture = false} = {}): DomElementMethod {
  // tslint:disable-next-line:no-unused-expression
  return (elem) => { new DomEventListener(elem, eventType, callback, useCapture); };
}

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
export function onMatchElem(elem: EventTarget, selector: string, eventType: string,
                            callback: EventCB, {useCapture = false} = {}): IDisposable {
  return new DomEventMatchListener(elem, eventType, callback, useCapture, selector);
}
export function onMatch(selector: string, eventType: string, callback: EventCB,
                        {useCapture = false} = {}): DomElementMethod {
  // tslint:disable-next-line:no-unused-expression
  return (elem) => { new DomEventMatchListener(elem, eventType, callback, useCapture, selector); };
}

export type KeyEventType = 'keypress' | 'keyup' | 'keydown';

export interface IKeyHandlers {
  [key: string]: (this: void, ev: KeyboardEvent, elem: Element) => void;
}

/**
 * Listen to key events (typically 'keydown' or 'keypress'), with specified per-key callbacks.
 * Key names are listed at https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
 *
 * Methods onKeyPress() and onKeyDown() are intended to be used as arguments to dom().
 *
 * By default, handled events are stopped from bubbling with stopPropagation() and
 * preventDefault(). If, however, you register a key with a "$" suffix (i.e. "Enter$" instead of
 * "Enter"), then the event is allowed to bubble normally.
 *
 * When this handler is set on an element, we automatically ensure that tabindex attribute is set,
 * to allow this element to receive keyboard events.
 *
 * For example:
 *
 *    dom('input', ...
 *      dom.onKeyDown({
 *        Enter: (e, elem) => console.log("Enter pressed"),
 *        Escape: (e, elem) => console.log("Escape pressed"),
 *        Delete$: (e, elem) => console.log("Delete pressed, will bubble"),
 *      })
 *    )
 */
export function onKeyElem(elem: Element, evType: KeyEventType, keyHandlers: IKeyHandlers): IDisposable {
  if (!((elem as HTMLElement).tabIndex >= 0)) {   // If tabIndex property is undefined or -1,
    elem.setAttribute('tabindex', '-1');          // Set tabIndex attribute to make the element focusable.
  }
  return onElem(elem, evType, (_ev, _elem) => {
    const ev = _ev as KeyboardEvent;
    const plainHandler = keyHandlers[ev.key];
    const handler = plainHandler || keyHandlers[ev.key + '$'];
    if (handler) {
      if (plainHandler) {
        ev.stopPropagation();
        ev.preventDefault();
      }
      handler(ev, _elem);
    }
  });
}

export function onKeyPress(keyHandlers: IKeyHandlers): DomElementMethod {
  return (elem) => { onKeyElem(elem, 'keypress', keyHandlers); };
}

export function onKeyDown(keyHandlers: IKeyHandlers): DomElementMethod {
  return (elem) => { onKeyElem(elem, 'keydown', keyHandlers); };
}
