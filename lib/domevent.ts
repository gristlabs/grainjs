import {IDisposable} from './dispose';
import {DomElementMethod, DomMethod} from './domImpl';

export type EventName = keyof HTMLElementEventMap;
export type EventType<E extends EventName|string> = E extends EventName ? HTMLElementEventMap[E] : Event;

export type EventCB<E extends Event = Event, T extends EventTarget = EventTarget> =
  (this: void, event: E, elem: T) => void;

function _findMatch(inner: Element, outer: Element, selector: string): Element|null {
  for (let el: Element|null = inner; el && el !== outer; el = el.parentElement) {
    if (el.matches(selector)) {
      return el;
    }
  }
  return null;
}

class DomEventListener<E extends Event, T extends EventTarget> implements EventListenerObject, IDisposable {
  constructor(protected elem: T,
              protected eventType: string,
              protected callback: EventCB<E, T>,
              protected useCapture: boolean,
              protected selector?: string) {
    this.elem.addEventListener(this.eventType, this, this.useCapture);
  }

  public handleEvent(event: E) {
    const cb = this.callback;
    cb(event, this.elem);
  }

  public dispose() {
    this.elem.removeEventListener(this.eventType, this, this.useCapture);
  }
}

class DomEventMatchListener<E extends Event> extends DomEventListener<E, EventTarget> {
  public handleEvent(event: E) {
    const elem = _findMatch(event.target as Element, this.elem as Element, this.selector!);
    if (elem) {
      const cb = this.callback;
      cb(event, elem);
    }
  }
}

/**
 * Listen to a DOM event, returning the listener object.
 * ```ts
 * const listener = dom.onElem(elem, 'click', (event, elem) => { ... });
 * ```
 *
 * To stop listening:
 * ```ts
 * listener.dispose();
 * ```
 *
 * Disposing the listener returned by `onElem()` is the only way to stop listening to an event. You
 * can use `autoDispose` to stop listening automatically when subscribing in a `Disposable` object:
 * ```ts
 * this.autoDispose(domevent.onElem(document, 'mouseup', callback));
 * ```
 *
 * If you need "once" semantics, i.e. to remove the callback on first call, here's a useful pattern:
 * ```ts
 * const lis = domevent.onElem(elem, 'mouseup', e => { lis.dispose(); other_work(); });
 * ```
 *
 * @param elem - DOM Element to listen to.
 * @param eventType - Event type to listen for (e.g. `'click'`).
 * @param callback - Callback to call as `callback(event, elem)`, where elem is `elem`.
 * @param options - `useCapture: boolean`: Add the listener in the capture phase. This should very
 *    rarely be useful (e.g. JQuery doesn't even offer it as an option).
 * @returns Listener object whose `.dispose()` method will remove the event listener.
 */
export function onElem<E extends EventName|string, T extends EventTarget>(
  elem: T, eventType: E, callback: EventCB<EventType<E>, T>, {useCapture = false} = {}): IDisposable {
  return new DomEventListener(elem, eventType, callback, useCapture);
}

/**
 * Listen to a DOM event. It is typically used as an argument to the `dom()` function:
 * ```ts
 * dom('div', dom.on('click', (event, elem) => { ... }));
 * ```
 *
 * When the div is disposed, the listener is automatically removed.
 *
 * The callback is called with the event and the element to which it was attached. Unlike in, say,
 * JQuery, the callback's return value is ignored. Use `event.stopPropagation()` and
 * `event.preventDefault()` explicitly if needed.
 *
 * To listen to descendants of an element matching the given selector (what JQuery calls
 * "delegated events", see http://api.jquery.com/on/), see [`onMatch`](#onMatch).
 *
 * @param eventType - Event type to listen for (e.g. `'click'`).
 * @param callback - Callback to call as `callback(event, elem)`, where `elem` is the element this
 *    listener is attached to.
 * @param options - `useCapture?: boolean`: Add the listener in the capture phase.
 */
export function on<E extends EventName|string, T extends EventTarget>(
  eventType: E, callback: EventCB<EventType<E>, T>, {useCapture = false} = {}): DomMethod<T> {
  // tslint:disable-next-line:no-unused-expression
  return (elem) => { new DomEventListener(elem, eventType, callback, useCapture); };
}

/**
 * Listen to a DOM event on descendants of the given elem matching the given selector.
 *
 * ```ts
 * const let lis = domevent.onMatchElem(elem, '.selector', 'click', (event, el) => { ... });
 * ```
 *
 * @param elem - DOM Element to whose descendants to listen.
 * @param selector - CSS selector string to filter elements that trigger this event.
 *    JQuery calls it "delegated events" (http://api.jquery.com/on/). The callback will only be
 *    called when the event occurs for an element matching the given selector. If there are
 *    multiple elements matching the selector, the callback is only called for the innermost one.
 * @param eventType - Event type to listen for (e.g. 'click').
 * @param callback - Callback to call as `callback(event, elem)`, where elem is a
 *    descendent of `elem` which matches `selector`.
 * @param options - `useCapture?: boolean`: Add the listener in the capture phase.
 * @returns Listener object whose `.dispose()` method will remove the event listener.
 */
export function onMatchElem(elem: EventTarget, selector: string, eventType: string,
                            callback: EventCB, {useCapture = false} = {}): IDisposable {
  return new DomEventMatchListener(elem, eventType, callback, useCapture, selector);
}

/**
 * Listen to a DOM event on descendants of the given element matching the given selector.
 *
 * This is similar to JQuery's [delegated events](https://api.jquery.com/on/#direct-and-delegated-events)
 *
 * ```ts
 * dom('div', dom.onMatch('.selector', 'click', (event, elem) => { ... }));
 * ```
 *
 * In this usage, the element passed to the callback will be a DOM element matching the given
 * selector. If there are multiple matches, the callback is only called for the innermost one.
 *
 * @param selector - CSS selector string to filter elements that trigger this event.
 * @param eventType - Event type to listen for (e.g. `'click'`).
 * @param callback - Callback to call as `callback(event, elem)`, where `elem` is an element
 *    matching `selector`.
 * @param options - `useCapture?: boolean`: Add the listener in the capture phase.
 */
export function onMatch(selector: string, eventType: string, callback: EventCB,
                        {useCapture = false} = {}): DomElementMethod {
  // tslint:disable-next-line:no-unused-expression
  return (elem) => { new DomEventMatchListener(elem, eventType, callback, useCapture, selector); };
}

export type KeyEventType = 'keypress' | 'keyup' | 'keydown';

export interface IKeyHandlers<T extends HTMLElement = HTMLElement> {
  [key: string]: (this: void, ev: KeyboardEvent, elem: T) => void;
}

/**
 * Listen to key events (typically 'keydown' or 'keypress'), with specified per-key callbacks.
 * Key names are listed at https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
 *
 * By default, handled events are stopped from bubbling with stopPropagation() and
 * preventDefault(). If, however, you register a key with a "$" suffix (i.e. "Enter$" instead of
 * "Enter"), then the event is allowed to bubble normally.
 *
 * When this handler is set on an element, we automatically ensure that tabindex attribute is set,
 * to allow this element to receive keyboard events.
 *
 * For example:
 * ```
 *    dom('input', ...
 *      dom.onKeyDown({
 *        Enter: (e, elem) => console.log("Enter pressed"),
 *        Escape: (e, elem) => console.log("Escape pressed"),
 *        Delete$: (e, elem) => console.log("Delete pressed, will bubble"),
 *      })
 *    )
 * ```
 */
export function onKeyElem<T extends HTMLElement>(
  elem: T, evType: KeyEventType, keyHandlers: IKeyHandlers<T>,
): IDisposable {
  if (!(elem.tabIndex >= 0)) {                    // If tabIndex property is undefined or -1,
    elem.setAttribute('tabindex', '-1');          // Set tabIndex attribute to make the element focusable.
  }
  return onElem(elem, evType, (ev, _elem) => {
    const plainHandler = keyHandlers[ev.key];
    const handler = plainHandler || keyHandlers[ev.key + '$'];
    if (handler) {
      if (plainHandler!) {
        ev.stopPropagation();
        ev.preventDefault();
      }
      handler(ev, _elem);
    }
  });
}

/**
 * Add listeners to `"keypress"` events. See [`onKeyElem`](#onKeyElem) for details.
 */
export function onKeyPress<T extends HTMLElement>(keyHandlers: IKeyHandlers<T>): DomMethod<T> {
  return (elem) => { onKeyElem(elem, 'keypress', keyHandlers); };
}

/**
 * Add listeners to `"keydown"` events. See [`onKeyElem`](#onKeyElem) for details.
 */
export function onKeyDown<T extends HTMLElement>(keyHandlers: IKeyHandlers<T>): DomMethod<T> {
  return (elem) => { onKeyElem(elem, 'keydown', keyHandlers); };
}
