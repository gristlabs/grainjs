import {BindableValue, subscribeElem as _subscribe} from './binding';
import {onDisposeElem} from './domDispose';
import {DomElementMethod, DomMethod, IAttrObj} from './domImpl';

// Use the browser globals in a way that allows replacing them with mocks in tests.
import {G} from './browserGlobals';

/**
 * Private global map for associating arbitrary data with DOM. It's a WeakMap, so does not prevent
 * values from being garbage collected when the owning DOM elements are no longer used.
 */
const _dataMap: WeakMap<Node, {[key: string]: any}> = new WeakMap();

/**
 * Sets multiple attributes of a DOM element. The `attrs()` variant takes no `elem` argument.
 * Null and undefined values are omitted, and booleans are either omitted or set to empty string.
 * @param attrsObj - Object mapping attribute names to attribute values.
 */
export function attrsElem(elem: Element, attrsObj: IAttrObj): void {
  for (const key of Object.keys(attrsObj)) {
    const val = attrsObj[key];
    if (val != null && val !== false) {
      elem.setAttribute(key, val === true ? '' : val);
    }
  }
}
export function attrs(attrsObj: IAttrObj): DomElementMethod {
  return (elem) => attrsElem(elem, attrsObj);
}

/**
 * Sets an attribute of a DOM element to the given value. Removes the attribute when the value is
 * null or undefined. The `attr()` variant takes no `elem` argument, and `attrValue` may be an
 * observable or function.
 * @param elem - The element to update.
 * @param attrName - The name of the attribute to bind, e.g. 'href'.
 * @param attrValue - The string value, or null or undefined to remove the attribute.
 */
export function attrElem(elem: Element, attrName: string, attrValue: string|null|undefined): void {
  if (attrValue === null || attrValue === undefined) {
    elem.removeAttribute(attrName);
  } else {
    elem.setAttribute(attrName, attrValue);
  }
}

/**
 * Sets an attribute of a DOM element to the given value. Removes the attribute when the value is
 * null or undefined.
 *
 * @example
 * ```ts
 * dom('a', dom.attr('href', urlObs))
 * ```
 */
export function attr(attrName: string, attrValueObs: BindableValue<string|null|undefined>): DomElementMethod {
  return (elem) => _subscribe(elem, attrValueObs, (val) => attrElem(elem, attrName, val));
}

/**
 * Sets or removes a boolean attribute of a DOM element. According to the spec, empty string is a
 * valid true value for the attribute, and the false value is indicated by the attribute's absence.
 * @param elem - The element to update.
 * @param attrName - The name of the attribute to bind, e.g. 'checked'.
 * @param boolValue - Boolean value whether to set or unset the attribute.
 */
export function boolAttrElem(elem: Element, attrName: string, boolValue: boolean): void {
  attrElem(elem, attrName, boolValue ? '' : null);
}
/**
 * Dom-method that sets or removes a boolean attribute of a DOM element.
 * @param attrName - The name of the attribute to bind, e.g. 'checked'.
 * @param boolValueObs - Value, observable, or function for a whether to set or unset the attribute.
 */
export function boolAttr(attrName: string, boolValueObs: BindableValue<boolean>): DomElementMethod {
  return (elem) => _subscribe(elem, boolValueObs, (val) => boolAttrElem(elem, attrName, val));
}

/**
 * Adds a text node to the element. The `text()` variant takes no `elem`, and `value` may be an
 * observable or function.
 * @param elem - The element to update.
 * @param value - The text value to add.
 */
export function textElem(elem: Node, value: string): void {
  elem.appendChild(G.document.createTextNode(value));
}
export function text(valueObs: BindableValue<string>): DomMethod {
  return (elem) => {
    const textNode = G.document.createTextNode('');
    _subscribe(elem, valueObs, (val) => { textNode.nodeValue = val; });
    elem.appendChild(textNode);
  };
}

/**
 * Sets a style property of a DOM element to the given value. The `style()` variant takes no
 * `elem`, and `value` may be an observable or function.
 * @param elem - The element to update.
 * @param property - The name of the style property to update, e.g. 'fontWeight'.
 * @param value - The value for the property.
 */
export function styleElem(elem: Element, property: string, value: string): void {
  (elem as any).style[property] = value;
}
export function style(property: string, valueObs: BindableValue<string>): DomElementMethod {
  return (elem) =>
    _subscribe(elem, valueObs, (val) => styleElem(elem, property, val));
}

/**
 * Sets the property of a DOM element to the given value.
 * The `prop()` variant takes no `elem`, and `value` may be an observable or function.
 * @param elem - The element to update.
 * @param property - The name of the property to update, e.g. 'disabled'.
 * @param value - The value for the property.
 */
export function propElem<T>(elem: Node, property: string, value: T): void {
  (elem as any)[property] = value;
}
export function prop<T>(property: string, valueObs: BindableValue<T>): DomMethod {
  return (elem) => _subscribe(elem, valueObs, (val) => propElem(elem, property, val));
}

/**
 * Shows or hides the element depending on a boolean value. Note that the element must be visible
 * initially (i.e. unsetting style.display should show it).
 * The `show()` variant takes no `elem`, and `boolValue` may be an observable or function.
 * @param elem - The element to update.
 * @param boolValue - True to show the element, false to hide it.
 */
export function showElem(elem: HTMLElement, boolValue: boolean): void {
  elem.style.display = boolValue ? '' : 'none';
}
export function show(boolValueObs: BindableValue<boolean>): DomElementMethod {
  return (elem) =>
    _subscribe(elem, boolValueObs, (val) => showElem(elem, val));
}

/**
 * The opposite of show, hiding the element when boolValue is true.
 * The `hide()` variant takes no `elem`, and `boolValue` may be an observable or function.
 * @param elem - The element to update.
 * @param boolValue - True to hide the element, false to show it.
 */
export function hideElem(elem: HTMLElement, boolValue: boolean): void {
  elem.style.display = boolValue ? 'none' : '';
}
export function hide(boolValueObs: BindableValue<boolean>): DomElementMethod {
  return (elem) =>
    _subscribe(elem, boolValueObs, (val) => hideElem(elem, val));
}

/**
 * Sets or toggles the given css class className.
 */
export function clsElem(elem: Element, className: string, boolValue: boolean = true): void {
  elem.classList.toggle(className, Boolean(boolValue));
}

/**
 * Sets or toggles a css class className. If className is an observable, it will be replaced when
 * the observable changes. If a plain string, then an optional second boolean observable may be
 * given, which will toggle it.
 * ```
 * dom.cls('foo')                                // Sets className 'foo'
 * dom.cls('foo', isFoo);                        // Toggles 'foo' className according to observable.
 * dom.cls('foo', (use) => use(isFoo));          // Toggles 'foo' className according to observable.
 * dom.cls(fooClass);                            // Sets className to the value of fooClass observable
 * dom.cls((use) => `prefix-${use(fooClass)}`);  // Sets className to prefix- plus fooClass observable.
 * ```
 */
export function cls(className: string, boolValue?: BindableValue<boolean>): DomElementMethod;
export function cls(className: BindableValue<string>): DomElementMethod;
export function cls(className: string|BindableValue<string>, boolValue?: BindableValue<boolean>): DomElementMethod {
  if (typeof className !== 'string') {
    return _clsDynamicPrefix('', className);
  } else if (!boolValue || typeof boolValue === 'boolean') {
    return (elem) => clsElem(elem, className, boolValue);
  } else {
    return (elem) => _subscribe(elem, boolValue, (val) => clsElem(elem, className, val));
  }
}

/**
 * Just like cls() but prepends a prefix to className, including when it is an observable.
 */
export function clsPrefix(prefix: string, className: string, boolValue?: BindableValue<boolean>): DomElementMethod;
export function clsPrefix(prefix: string, className: BindableValue<string>): DomElementMethod;
export function clsPrefix(prefix: string, className: string|BindableValue<string>,
                          boolValue?: BindableValue<boolean>): DomElementMethod {
  if (typeof className !== 'string') {
    return _clsDynamicPrefix(prefix, className);
  } else {
    return cls(prefix + className, boolValue);
  }
}

function _clsDynamicPrefix(prefix: string, className: BindableValue<string>): DomElementMethod {
  return (elem) => {
    let prevClass: string|null = null;
    _subscribe(elem, className, (name: string) => {
      if (prevClass) { elem.classList.remove(prevClass); }
      prevClass = name ? prefix + name : null;
      if (prevClass) { elem.classList.add(prevClass); }
    });
  };
}

/**
 * Associate arbitrary data with a DOM element. The `data()` variant takes no `elem`, and `value`
 * may be an observable or function.
 * @param elem - The element with which to associate data.
 * @param key - Key to identify this piece of data among others attached to elem.
 * @param value - Arbitrary value to associate with elem.
 */
export function dataElem(elem: Node, key: string, value: any): void {
  const obj = _dataMap.get(elem);
  if (obj) {
    obj[key] = value;
  } else {
    onDisposeElem(elem, () => _dataMap.delete(elem));
    _dataMap.set(elem, {[key]: value});
  }
}
export function data(key: string, valueObs: BindableValue<any>): DomMethod {
  return (elem) => _subscribe(elem, valueObs, (val) => dataElem(elem, key, val));
}
export function getData(elem: Node, key: string) {
  const obj = _dataMap.get(elem);
  return obj && obj[key];
}

/**
 * A very simple setup to identify DOM elements for testing purposes. Here's the recommended
 * usage.
 * ```
 *   // In the component to be tested.
 *   import {noTestId, TestId} from 'grainjs';
 *
 *   function myComponent(myArgs, testId: TestId = noTestId) {
 *     return dom(..., testId("some-name"),
 *       dom(..., testId("another-name"), ...),
 *     );
 *   }
 * ```
 *
 * In the fixture code using this component:
 * ```
 *   import {makeTestId} from 'grainjs';
 *
 *   dom(..., myComponent(myArgs, makeTestId('test-mycomp-'), ...)
 * ```
 *
 * In the webdriver test code:
 * ```
 *   driver.find('.test-my-comp-some-name')
 *   driver.find('.test-my-comp-another-name')
 * ```
 *
 * When myComponent() is created with testId argument omitted, the testId() calls are no-ops. When
 * makeTestId('test-foo-') is passed in, testId() calls simply add a css class with that prefix.
 */
export type TestId = (name: string) => DomElementMethod|null;

/**
 * See documentation for TestId above.
 */
export function makeTestId(prefix: string): TestId {
  return clsPrefix.bind(null, prefix);
}

/**
 * See documentation for TestId above.
 */
export const noTestId: TestId = (name: string) => null;
