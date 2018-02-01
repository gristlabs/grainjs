(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.grainjs = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./lib/computed"));
__export(require("./lib/dispose"));
__export(require("./lib/dom"));
__export(require("./lib/domevent"));
__export(require("./lib/emit"));
__export(require("./lib/kowrap"));
__export(require("./lib/observable"));
__export(require("./lib/subscribe"));
__export(require("./lib/util"));

},{"./lib/computed":9,"./lib/dispose":10,"./lib/dom":11,"./lib/domevent":12,"./lib/emit":13,"./lib/kowrap":14,"./lib/observable":15,"./lib/subscribe":16,"./lib/util":17}],2:[function(require,module,exports){
"use strict";
/**
 * This module supports computed observables, organizing them into a priority queue, so that
 * computeds can be updated just once after multiple bundled changes.
 *
 * This module is for internal use only (hence the leading underscore in the name). The only
 * function useful outside is exposed via the `observable` module as `observable.bundleChanges()`.
 *
 * Changes may come together because multiple observables are changed synchronously, or because
 * multiple computeds depend on a single changed observable. In either case, if a computed depends
 * on multiple observables that are being changed, we want it to just get updated once when the
 * changes are complete.
 *
 * This is done by maintaining a _priority in each computed, where greater values get evaluated
 * later (computed with greater values depend on those with smaller values). When a computed needs
 * updating, it adds itself to the queue using enqueue() method. At the end of an observable.set()
 * call, or of bundleChanges() call, the queue gets processed in order of _priority.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const FastPriorityQueue = require("fastpriorityqueue");
/**
 * DepItem is an item in a dependency relationship. It may depend on other DepItems. It is used
 * for subscriptions and computed observables.
 */
class DepItem {
    /**
     * Callback should call depItem.useDep(dep) for each DepInput it depends on.
     */
    constructor(callback, optContext) {
        this._priority = 0;
        this._enqueued = false;
        this._callback = callback;
        this._context = optContext;
    }
    static isPrioritySmaller(a, b) {
        return a._priority < b._priority;
    }
    /**
     * Mark depItem as a dependency of this DepItem. The argument may be null to indicate a leaf (an
     * item such as a plain observable, which does not itself depend on anything else).
     */
    useDep(depItem) {
        const p = depItem ? depItem._priority : 0;
        if (p >= this._priority) {
            this._priority = p + 1;
        }
    }
    /**
     * Recompute this DepItem, calling the callback given in the constructor.
     */
    recompute() {
        this._priority = 0;
        this._callback.call(this._context);
    }
    /**
     * Add this DepItem to the queue, to be recomputed when the time is right.
     */
    enqueue() {
        if (!this._enqueued) {
            this._enqueued = true;
            queue.add(this);
        }
    }
}
exports.DepItem = DepItem;
// The main compute queue.
const queue = new FastPriorityQueue(DepItem.isPrioritySmaller);
// Array to keep track of items recomputed during this call to compute(). It could be a local
// variable in compute(), but is made global to minimize allocations.
const _seen = [];
// Counter used for bundling multiple calls to compute() into one.
let bundleDepth = 0;
/**
 * Exposed for unittests. Returns the internal priority value of an observable.
 */
function _getPriority(obs) {
    const depItem = obs._getDepItem();
    return depItem ? depItem._priority : 0;
}
exports._getPriority = _getPriority;
/**
 * Update any computed observables that need updating. The update is deferred if we are currently
 * in the middle of a bundle. This is called automatically whenever you set an observable, and
 * there should be no need to ever call this by users of the library.
 */
function compute() {
    if (bundleDepth === 0 && queue.size > 0) {
        // Prevent nested compute() calls, which are unnecessary and can cause deep recursion stack.
        bundleDepth++;
        try {
            // We reuse _seen array to minimize allocations, but always leave it empty.
            do {
                const item = queue.poll();
                _seen.push(item);
                item.recompute();
            } while (queue.size > 0);
        }
        finally {
            // We delay the unsetting of _enqueued flag to here, to protect against infinite loops when
            // a change to a computed causes it to get enqueued again.
            for (const item of _seen) {
                item._enqueued = false;
            }
            _seen.length = 0;
            bundleDepth--;
        }
    }
}
exports.compute = compute;
/**
 * Defer recomputations of all computed observables and subscriptions until func() returns. This
 * is useful to avoid unnecessary recomputation if you are making several changes to observables
 * together. This function is exposed as `observable.bundleChanges()`.
 *
 * Note that this intentionally does not wait for promises to be resolved, since that would block
 * all updates to all computeds while waiting.
 */
function bundleChanges(func) {
    try {
        bundleDepth++;
        return func();
    }
    finally {
        bundleDepth--;
        compute();
    }
}
exports.bundleChanges = bundleChanges;

},{"fastpriorityqueue":18}],3:[function(require,module,exports){
"use strict";
/**
 * Implementation of UI components that can be inserted into dom(). See documentation for
 * createElem() and create().
 */
Object.defineProperty(exports, "__esModule", { value: true });
const _domDispose_1 = require("./_domDispose");
const _domImpl_1 = require("./_domImpl");
const dispose_1 = require("./dispose");
// Use the browser globals in a way that allows replacing them with mocks in tests.
const browserGlobals_1 = require("./browserGlobals");
/**
 * A UI component should extend this base class and implement `render()`. Compared to a simple
 * function returning DOM (a "functional" component), a "class" component makes it easier to
 * organize code into methods.
 *
 * In addition, a "class" component may be disposed to remove it from the DOM, although this is
 * uncommon since a UI component is normally owned by its containing DOM.
 */
class Component extends dispose_1.Disposable {
    /**
     * Components must extend this class and implement a `render()` method, which is called at
     * construction with constructor arguments, and should return DOM for the component.
     *
     * It is recommended that any constructor work is done in this method.
     *
     * render() may return any type of value that's accepted by dom() as an argument, including a
     * DOM element, a string, null, or an array. The returned DOM is automatically owned by the
     * component, so do not wrap it in `this.autoDispose()`.
     */
    render(...args) {
        throw new Error("Not implemented");
    }
    /**
     * This is not intended to be called directly or overridden. Instead, implement render().
     */
    create(elem, ...args) {
        const content = this.render(...args);
        this._markerPre = browserGlobals_1.G.document.createComment('A');
        this._markerPost = browserGlobals_1.G.document.createComment('B');
        // If the containing DOM is disposed, it will dispose all of our DOM (included among children
        // of the containing DOM). Let it also dispose this Component when it gets to _markerPost.
        // Since _unmount() is unnecessary here, we skip its work by unseting _markerPre/_markerPost.
        _domDispose_1.onDisposeElem(this._markerPost, () => {
            this._markerPre = this._markerPost = undefined;
            this.dispose();
        });
        // When the component is disposed, unmount the DOM we created (i.e. dispose and remove).
        // Except that we skip this as unnecessary when the disposal is triggered by containing DOM.
        this.autoDisposeWith(this._unmount, this);
        // Insert the result of render() into the given parent element.
        _domImpl_1.update(elem, this._markerPre, content, this._markerPost);
    }
    /**
     * Detaches and disposes the DOM created and attached in _mount().
     */
    _unmount() {
        // Dispose the owned content, and remove it from the DOM.
        if (this._markerPre && this._markerPre.parentNode) {
            let next;
            const elem = this._markerPre.parentNode;
            for (let n = this._markerPre.nextSibling; n && n !== this._markerPost; n = next) {
                next = n.nextSibling;
                _domDispose_1.domDispose(n);
                elem.removeChild(n);
            }
            elem.removeChild(this._markerPre);
            elem.removeChild(this._markerPost);
        }
    }
}
exports.Component = Component;
/**
 * Construct and insert a UI component into the given DOM element. The component must extend
 * dom.Component(...), and must implement a `render(...)` method which should do any constructor
 * work and return DOM. DOM may be any type value accepted by dom() as an argument, including a
 * DOM element, string, null, or array. The returned DOM is automatically owned by the component.
 *
 * Logically, the parent `elem` owns the created component, and the component owns the DOM
 * returned by its render() method. If the parent is disposed, so is the component and its DOM. If
 * the component is somehow disposed directly, then its DOM is disposed and removed from `elem`.
 *
 * Note the correct usage:
 *
 *       dom('div', dom.create(Comp1), dom.create(Comp2, ...args))
 *
 * To understand why the syntax is such, consider a potential alterntive such as:
 *
 *       dom('div', _insert_(new Comp1()), _insert_(new Comp2(...args))
 *
 *    In both cases, the constructor for Comp1 runs before the constructor for Comp2. What happens
 *    when Comp2's constructor throws an exception? In the second case, nothing yet owns the
 *    created Comp1 component, and it will never get cleaned up. In the first, correct case,
 *    dom('div') element gets ownership of it early enough and will dispose it.
 *
 * @param {Element} elem: The element to which to append the newly constructed component.
 * @param {Class} ComponentClass: The component class to instantiate. It must extend
 *    dom.Component(...) and implement the render() method.
 * @param {Objects} ...args: Arguments to the constructor which passes them to the render method.
 */
function createElem(elem, ComponentClass, ...args) {
    // tslint:disable-next-line:no-unused-expression
    new ComponentClass(elem, ...args);
}
exports.createElem = createElem;
function create(ComponentClass, ...args) {
    // tslint:disable-next-line:no-unused-expression
    return (elem) => { new ComponentClass(elem, ...args); };
}
exports.create = create;
/**
 * If you need to initialize a component after creation, you may do it in the middle of a dom()
 * call using createInit(), in which the last of args is initFunc: a function called with the
 * constructed instance of the component:
 *    dom.createInit(MyComponent, ...args, c => {
 *      c.addChild(...);
 *      c.setOption(...);
 *    });
 * The benefit of such inline construction is that the component is owned by the dom element as
 * soon as it's created, so an exception in the init function or later among dom()'s arguments
 * will trigger a cleanup.
 */
function createInit(ComponentClass, ...args) {
    return (elem) => {
        const initFunc = args.pop();
        const c = new ComponentClass(elem, ...args);
        initFunc(c);
    };
}
exports.createInit = createInit;

},{"./_domDispose":4,"./_domImpl":5,"./browserGlobals":8,"./dispose":10}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
function domDispose(elem) {
    _walkDom(elem, _disposeElem);
}
exports.domDispose = domDispose;
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
function onDisposeElem(elem, disposerFunc) {
    const prevDisposer = _disposeMap.get(elem);
    _disposeMap.set(elem, disposerFunc);
    if (prevDisposer) {
        _disposeMap.set(disposerFunc, prevDisposer);
    }
}
exports.onDisposeElem = onDisposeElem;
function onDispose(disposerFunc) {
    return (elem) => onDisposeElem(elem, disposerFunc);
}
exports.onDispose = onDispose;
/**
 * Make the given element own the disposable, and call its dispose method when domDispose() is
 * called on the element or any of its parents.
 * @param {Element} elem: The element to own the disposable.
 * @param {Disposable} disposable: Anything with a .dispose() method.
 */
function autoDisposeElem(elem, disposable) {
    if (disposable) {
        onDisposeElem(elem, () => disposable.dispose());
    }
}
exports.autoDisposeElem = autoDisposeElem;
function autoDispose(disposable) {
    if (disposable) {
        return (elem) => autoDisposeElem(elem, disposable);
    }
}
exports.autoDispose = autoDispose;

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _domDispose_1 = require("./_domDispose");
const _domMethods_1 = require("./_domMethods");
// Use the browser globals in a way that allows replacing them with mocks in tests.
const browserGlobals_1 = require("./browserGlobals");
// The goal of the above declarations is to get help from TypeScript in detecting incorrect usage:
//  import {text, hide} from './_domMethods';
//  dom('div', text('hello'));        // OK
//  dom('div', hide(true));           // OK
//  dom('div', {title: 'hello'});     // OK
//  frag(text('hello'));              // OK
//  frag(hide(true));                 // Bad: DocumentFragment is not an Element
//  frag({title: 'hello'});           // Bad: DocumentFragment is not an Element
/**
 * dom('tag#id.class1.class2', ...args)
 *   The first argument is a string consisting of a tag name, with optional #foo suffix
 *   to add the ID 'foo', and zero or more .bar suffixes to add a CSS class 'bar'.
 *
 * The rest of the arguments are optional and may be:
 *
 *   Nodes - which become children of the created element;
 *   strings - which become text node children;
 *   objects - of the form {attr: val} to set additional attributes on the element;
 *   Arrays - which are flattened with each item processed recursively;
 *   functions - which are called with elem as the argument, for a chance to modify the
 *       element as it's being created. Return values are processed recursively.
 *   "dom methods" - expressions such as `dom.attr('href', url)` or `dom.hide(obs)`, which
 *       are actually special cases of the "functions" category.
 */
function dom(tagString, ...args) {
    return _updateWithArgsOrDispose(_createFromTagString(_createElementHtml, tagString), args);
}
exports.dom = dom;
/**
 * svg('tag#id.class1.class2', ...args)
 *  Same as dom(...), but creates an SVG element.
 */
function svg(tagString, ...args) {
    return _updateWithArgsOrDispose(_createFromTagString(_createElementSvg, tagString), args);
}
exports.svg = svg;
// Internal helper used to create HTML elements.
function _createElementHtml(tag) {
    return browserGlobals_1.G.document.createElement(tag);
}
// Internal helper used to create SVG elements.
function _createElementSvg(tag) {
    return browserGlobals_1.G.document.createElementNS("http://www.w3.org/2000/svg", tag);
}
/**
 * Internal helper to parse tagString, create an element using createFunc with the given tag, and
 * set its id and classes from the tagString.
 * @param {Funtion} createFunc(tag): Function that should create an element given a tag name.
 *    It is passed in to allow creating elements in different namespaces (e.g. plain HTML vs SVG).
 * @param {String} tagString: String of the form "tag#id.class1.class2" where id and classes are
 *    optional.
 * @return {Element} The result of createFunc(), possibly with id and class attributes also set.
 */
function _createFromTagString(createFunc, tagString) {
    // We do careful hand-written parsing rather than use a regexp for speed. Using a regexp is
    // significantly more expensive.
    let tag;
    let id;
    let classes;
    let dotPos = tagString.indexOf(".");
    const hashPos = tagString.indexOf('#');
    if (dotPos === -1) {
        dotPos = tagString.length;
    }
    else {
        classes = tagString.substring(dotPos + 1).replace(/\./g, ' ');
    }
    if (hashPos === -1) {
        tag = tagString.substring(0, dotPos);
    }
    else if (hashPos > dotPos) {
        throw new Error(`ID must come before classes in dom("${tagString}")`);
    }
    else {
        tag = tagString.substring(0, hashPos);
        id = tagString.substring(hashPos + 1, dotPos);
    }
    const elem = createFunc(tag);
    if (id) {
        elem.setAttribute('id', id);
    }
    if (classes) {
        elem.setAttribute('class', classes);
    }
    return elem;
}
function update(elem, ...args) {
    return _updateWithArgs(elem, args);
}
exports.update = update;
function _updateWithArgs(elem, args) {
    for (const arg of args) {
        _updateWithArg(elem, arg);
    }
    return elem;
}
function _updateWithArgsOrDispose(elem, args) {
    try {
        return _updateWithArgs(elem, args);
    }
    catch (e) {
        _domDispose_1.domDispose(elem);
        throw e;
    }
}
function _updateWithArg(elem, arg) {
    if (typeof arg === 'function') {
        const value = arg(elem);
        // Skip the recursive call in the common case when the function returns nothing.
        if (value !== undefined && value !== null) {
            _updateWithArg(elem, value);
        }
    }
    else if (Array.isArray(arg)) {
        _updateWithArgs(elem, arg);
    }
    else if (arg === undefined || arg === null) {
        // Nothing to do.
    }
    else if (arg instanceof browserGlobals_1.G.Node) {
        elem.appendChild(arg);
    }
    else if (typeof arg === 'object') {
        _domMethods_1.attrsElem(elem, arg);
    }
    else {
        elem.appendChild(browserGlobals_1.G.document.createTextNode(arg));
    }
}
/**
 * Creates a DocumentFragment processing arguments the same way as the dom() function.
 */
function frag(...args) {
    const elem = browserGlobals_1.G.document.createDocumentFragment();
    return _updateWithArgsOrDispose(elem, args);
}
exports.frag = frag;
/**
 * Find the first element matching a selector; just an abbreviation for document.querySelector().
 */
function find(selector) { return browserGlobals_1.G.document.querySelector(selector); }
exports.find = find;
/**
 * Find all elements matching a selector; just an abbreviation for document.querySelectorAll().
 */
function findAll(selector) { return browserGlobals_1.G.document.querySelectorAll(selector); }
exports.findAll = findAll;

},{"./_domDispose":4,"./_domMethods":6,"./browserGlobals":8}],6:[function(require,module,exports){
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

},{"./_domDispose":4,"./_domImpl":5,"./binding":7,"./browserGlobals":8}],7:[function(require,module,exports){
"use strict";
/**
 * binding.ts offers a convenient subscribe() function that creates a binding to an observable, a
 * a plain value, or a function from which it builds a computed.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const computed_1 = require("./computed");
const observable_1 = require("./observable");
/**
 * Subscribes a callback to valueObs, which may be one a plain value, an observable, a knockout
 * observable, or a function. If a function, it's used to create a computed() and will be called
 * with a context function `use`, allowing it to depend on other observable values (see
 * documentation for `computed`).
 *
 * In all cases, `callback(newValue, oldValue)` is called immediately and whenever the value
 * changes. On the initial call, oldValue is undefined.
 *
 * Returns an object which should be disposed to remove the created subscriptions, or null.
 */
function subscribe(valueObs, callback) {
    // A plain function (to make a computed from), or a knockout observable.
    if (typeof valueObs === 'function') {
        // Knockout observable.
        const koValue = valueObs;
        if (typeof koValue.peek === 'function') {
            let savedValue = koValue.peek();
            const sub = koValue.subscribe((val) => {
                const old = savedValue;
                savedValue = val;
                callback(val, old);
            });
            callback(savedValue, undefined);
            return sub;
        }
        // Function from which to make a computed. Note that this is also reasonable:
        //    let sub = subscribe(use => callback(valueObs(use)));
        // The difference is that when valueObs() evaluates to unchanged value, callback would be
        // called in the version above, but not in the version below.
        const comp = computed_1.computed(valueObs);
        comp.addListener(callback);
        callback(comp.get(), undefined);
        return comp; // Disposing this will dispose its one listener.
    }
    // An observable.
    if (valueObs instanceof observable_1.Observable) {
        const sub = valueObs.addListener(callback);
        callback(valueObs.get(), undefined);
        return sub;
    }
    callback(valueObs, undefined);
    return null;
}
exports.subscribe = subscribe;

},{"./computed":9,"./observable":15}],8:[function(require,module,exports){
"use strict";
/**
 * Module that allows client-side code to use browser globals (such as `document` or `Node`) in a
 * way that allows those globals to be replaced by mocks in browser-less tests.
 *
 *    import {G} from 'browserGlobals';
 *    ... use G.document
 *    ... use G.Node
 *
 * Initially, the global `window` object, is the source of the global values.
 *
 * To use a mock of globals in a test, use:
 *
 *    import {pushGlobals, popGlobals} as G from 'browserGlobals';
 *    before(function() {
 *      pushGlobals(mockWindow);    // e.g. jsdom.jsdom(...).defaultView
 *    });
 *    after(function() {
 *      popGlobals();
 *    });
 */
Object.defineProperty(exports, "__esModule", { value: true });
function _updateGlobals(dest, source) {
    dest.DocumentFragment = source.DocumentFragment;
    dest.Element = source.Element;
    dest.Node = source.Node;
    dest.document = source.document;
    dest.window = source.window;
}
// The initial IBrowserGlobals object.
const initial = {};
_updateGlobals(initial, (typeof window !== 'undefined' ? window : {}));
// The globals G object strats out with a copy of `initial`.
exports.G = Object.assign({}, initial);
// The stack of globals that always has the intial object, but which may be overridden.
const _globalsStack = [initial];
/**
 * Replace globals with those from the given object. Use popGlobals() to restore previous values.
 */
function pushGlobals(globals) {
    _globalsStack.push(globals);
    _updateGlobals(exports.G, globals);
}
exports.pushGlobals = pushGlobals;
/**
 * Restore the values of globals to undo the preceding pushGlobals() call.
 */
function popGlobals() {
    if (_globalsStack.length > 1) {
        _globalsStack.pop();
    }
    _updateGlobals(exports.G, _globalsStack[_globalsStack.length - 1]);
}
exports.popGlobals = popGlobals;

},{}],9:[function(require,module,exports){
"use strict";
/**
 * computed.js implements a computed observable, whose value depends on other observables and gets
 * recalculated automatically when they change.
 *
 * E.g. if we have some existing observables (which may themselves be instances of `computed`),
 * we can create a computed that subscribes to them explicitly:
 *  let obs1 = observable(5), obs2 = observable(12);
 *  let computed1 = computed(obs1, obs2, (use, v1, v2) => v1 + v2);
 *
 * or implicitly by using `use(obs)` function:
 *  let computed2 = computed(use => use(obs1) + use(obs2));
 *
 * In either case, computed1.get() and computed2.get() will have the value 17. If obs1 or obs2 is
 * changed, computed1 and computed2 will get recomputed automatically.
 *
 * Creating a computed allows any number of dependencies to be specified explicitly, and their
 * values will be passed to the read() callback. These may be combined with automatic dependencies
 * detected using use(). Note that constructor dependencies have less overhead.
 *
 *  let val = computed(...deps, ((use, ...depValues) => READ_CALLBACK));
 *
 * You may specify a `write` callback by calling `onWrite(WRITE_CALLBACK)`, which will be called
 * whenever set() is called on the computed by its user. If a `write` bacllback is not specified,
 * calling `set` on a computed observable will throw an exception.
 *
 * Note that pureComputed.js offers a variation of computed() with the same interface, but which
 * stays unsubscribed from dependencies while it itself has no subscribers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const observable_1 = require("./observable");
const subscribe_1 = require("./subscribe");
function _noWrite() {
    throw new Error("Can't write to non-writable computed");
}
class Computed extends observable_1.Observable {
    /**
     * Internal constructor for a Computed observable. You should use computed() function instead.
     */
    constructor(callback, dependencies) {
        // At initialization we force an undefined value even though it's not of type T: it gets set
        // to a proper value during the creation of new Subscription, which calls this._read.
        super(undefined);
        this._callback = callback;
        this._write = _noWrite;
        this._sub = new subscribe_1.Subscription(this._read.bind(this), dependencies);
    }
    /**
     * Used by subscriptions to keep track of dependencies.
     */
    _getDepItem() {
        return this._sub._getDepItem();
    }
    /**
     * "Sets" the value of the computed by calling the write() callback if one was provided in the
     * constructor. Throws an error if there was no such callback (not a "writable" computed).
     * @param {Object} value: The value to pass to the write() callback.
     */
    set(value) { this._write(value); }
    /**
     * Set callback to call when this.set(value) is called, to make it a writable computed. If not
     * set, attempting to write to this computed will throw an exception.
     */
    onWrite(writeFunc) {
        this._write = writeFunc;
        return this;
    }
    /**
     * Disposes the computed, unsubscribing it from all observables it depends on.
     */
    dispose() {
        this._sub.dispose();
        super.dispose();
    }
    _read(use, ...args) {
        super.set(this._callback(use, ...args));
    }
}
exports.Computed = Computed;
/**
 * Creates a new Computed.
 * @param {Observable} ...observables: The initial params, of which there may be zero or more, are
 *    observables on which this computed depends. When any of them change, the read() callback
 *    will be called with the values of these observables as arguments.
 * @param {Function} readCallback: Read callback that will be called with (use, ...values),
 *    i.e. the `use` function and values for all of the ...observables. The callback is called
 *    immediately and whenever any dependency changes.
 * @returns {Computed} The newly created computed observable.
 */
function computed(...args) {
    const readCb = args.pop();
    return new Computed(readCb, args);
}
exports.computed = computed;
// TODO Consider mplementing .singleUse() method.
// An open question is in how to pass e.g. kd.hide(computed(x, x => !x)) in such a way that
// the temporary computed can be disposed when temporary, but not otherwise. A function-only
// syntax is kd.hide(use => !use(x)), but prevents use of static subscriptions.
//
// (a) function-only use of computeds is fine and useful.
// (b) pureComputed is another option, and doesn't technically require getting disposed.
// (c) kd.hide(compObs), kd.autoDispose(compObs) is more general and
//     can be replaced more concisely by kd.hide(compObs.singleUse())
// .singleUse() automatically disposes a computed (or an observable?) once there are no
// subscriptions to it. If there are no subscriptions at the time of this call, waits for the next
// tick, and possibly disposes then.

},{"./observable":15,"./subscribe":16}],10:[function(require,module,exports){
"use strict";
/**
 * dispose.js provides tools to objects that needs to dispose resources, such as destroy DOM, and
 * unsubscribe from events. The motivation with examples is presented here:
 *
 *    https://phab.getgrist.com/w/disposal/
 *
 * Disposable is a class for components that need cleanup (e.g. maintain DOM, listen to
 * events, subscribe to anything). It provides a .dispose() method that should be called to
 * destroy the component, and .autoDispose() family of methods that the component should use to
 * take responsibility for other pieces that require cleanup.
 *
 * To define a disposable class:
 *    class Foo extends Disposable {
 *      create(...args) { ...constructor work... }      // Instead of constructor, if needed.
 *    }
 *
 * To create Foo:
 *    let foo = new Foo(args...);
 *
 * Foo should do constructor work in its create() method (or rarely other methods), where it can
 * take ownership of other objects:
 *    this.bar = this.autoDispose(new Bar(...));
 *
 * Note that create() is automatically called at construction. Its advantage is that if it throws
 * an exception, any calls to .autoDispose() that happened before the exception are honored.
 *
 * For more customized disposal:
 *    this.baz = this.autoDisposeWithMethod('destroy', new Baz());
 *    this.elem = this.autoDisposeWith(ko.cleanNode, document.createElement(...));
 * When `this` is disposed, it will call this.baz.destroy(), and ko.cleanNode(this.elem).
 *
 * To call another method on disposal (e.g. to add custom disposal logic):
 *    this.autoDisposeCallback(this.myUnsubscribeAllMethod);
 * The method will be called with `this` as context, and no arguments.
 *
 * To wipe out this object on disposal (i.e. set all properties to null):
 *    this.wipeOnDispose();
 * See the documentation of that method for more info.
 *
 * To dispose Foo:
 *    foo.dispose();
 * Owned objects will be disposed in reverse order from which `autoDispose` were called.
 *
 * To release an owned object:
 *    this.disposeRelease(this.bar);
 *
 * To dispose an owned object early:
 *    this.disposeDiscard(this.bar);
 *
 * To determine if an object has already been disposed:
 *    foo.isDisposed()
 */
Object.defineProperty(exports, "__esModule", { value: true });
class Disposable {
    /**
     * Constructor forwards arguments to  `this.create(...args)`, which is where subclasses should
     * do any constructor work. This ensures that if create() throws an exception, dispose() gets
     * called to clean up the partially-constructed object.
     */
    constructor(...args) {
        this._disposalList = [];
        try {
            this.create(...args);
        }
        catch (e) {
            try {
                this.dispose();
            }
            catch (e) {
                // tslint:disable-next-line:no-console
                console.error("Error disposing partially constructed %s:", this.constructor.name, e);
            }
            throw e;
        }
    }
    /**
     * Take ownership of `obj`, and dispose it when `this.dispose` is called.
     * @param {Object} obj: Disposable object to take ownership of.
     * @returns {Object} obj
     */
    autoDispose(obj) {
        return this.autoDisposeWith(_defaultDisposer, obj);
    }
    /**
     * Take ownership of `obj`, and dispose it by calling the specified function.
     * @param {Function} disposer: disposer(obj) will be called to dispose the object, with `this`
     *    as the context.
     * @param {Object} obj: Object to take ownership of, on which `disposer` will be called.
     * @returns {Object} obj
     */
    autoDisposeWith(disposer, obj) {
        this._disposalList.push({ obj, disposer });
        return obj;
    }
    /**
     * Take ownership of `obj`, and dispose it with `obj[methodName]()`.
     * @param {String} methodName: method name to call on obj when it's time to dispose it.
     * @returns {Object} obj
     */
    autoDisposeWithMethod(methodName, obj) {
        return this.autoDisposeWith((_obj) => _obj[methodName](), obj);
    }
    /**
     * Adds the given callback to be called when `this.dispose` is called.
     * @param {Function} callback: Called on disposal with `this` as the context and no arguments.
     * @returns nothing
     */
    autoDisposeCallback(callback) {
        this.autoDisposeWith(_callFuncHelper, callback);
    }
    /**
     * Wipe out this object when it is disposed, i.e. set all its properties to null. It is
     * recommended to call this early in the constructor. It's safe to call multiple times.
     *
     * This makes disposal more costly, but has certain benefits:
     * - If anything still refers to the object and uses it, we'll get an early error, rather than
     *   silently keep going, potentially doing useless work (or worse) and wasting resources.
     * - If anything still refers to the object (even without using it), the fields of the object
     *   can still be garbage-collected.
     * - If there are circular references involving this object, they get broken, making the job
     *   easier for the garbage collector.
     *
     * The recommendation is to use it for complex, longer-lived objects, but to skip for objects
     * which are numerous and short-lived (and less likely to be referenced from unexpected places).
     */
    wipeOnDispose() {
        this.autoDisposeWith(_wipeOutObject, this);
    }
    /**
     * Remove `obj` from the list of owned objects; it will not be disposed on `this.dispose`.
     * @param {Object} obj: Object to release.
     * @returns {Object} obj
     */
    disposeRelease(obj) {
        const list = this._disposalList;
        const index = list.findIndex((entry) => (entry.obj === obj));
        if (index !== -1) {
            list.splice(index, 1);
        }
        return obj;
    }
    /**
     * Dispose an owned object `obj` now, and remove it from the list of owned objects.
     * @param {Object} obj: Object to release.
     * @returns nothing
     */
    disposeDiscard(obj) {
        const list = this._disposalList;
        const index = list.findIndex((entry) => (entry.obj === obj));
        if (index !== -1) {
            const entry = list[index];
            list.splice(index, 1);
            entry.disposer.call(this, obj);
        }
    }
    /**
     * Returns whether this object has already been disposed.
     */
    isDisposed() {
        return this._disposalList === null;
    }
    /**
     * Clean up `this` by disposing all owned objects, and calling `stopListening()` if defined.
     */
    dispose() {
        const list = this._disposalList;
        if (list) {
            // This makes isDisposed() true, and the object is no longer valid (in particular,
            // this._disposalList no longer satisfies its declared type).
            this._disposalList = null;
            // Go backwards through the disposal list, and dispose everything.
            for (let i = list.length - 1; i >= 0; i--) {
                const entry = list[i];
                _disposeHelper(this, entry.disposer, entry.obj);
            }
        }
    }
}
exports.Disposable = Disposable;
/**
 * Internal helper to allow adding cleanup callbacks to the disposalList. It acts as the
 * "disposer" for callback, by simply calling them with the same context that it is called with.
 */
function _callFuncHelper(callback) {
    callback.call(this);
}
/**
 * Wipe out the given object by setting each property to a dummy sentinel value. This is helpful
 * for objects that are disposed and should be ready to be garbage-collected.
 *
 * The sentinel value doesn't have to be null, but some values cause more helpful errors than
 * others. E.g. if a.x = "disposed", then a.x.foo() throws "undefined is not a function", while
 * when a.x = null, a.x.foo() throws "Cannot read property 'foo' of null", which is more helpful.
 */
function _wipeOutObject(obj) {
    Object.keys(obj).forEach((k) => (obj[k] = null));
}
/**
 * Internal helper to call a disposer on an object. It swallows errors (but reports them) to make
 * sure that when we dispose an object, an error in disposing one owned part doesn't stop
 * the disposal of the other parts.
 */
function _disposeHelper(owner, disposer, obj) {
    try {
        disposer.call(owner, obj);
    }
    catch (e) {
        // tslint:disable-next-line:no-console
        console.error("While disposing %s, error disposing %s: %s", _describe(owner), _describe(obj), e);
    }
}
/**
 * Helper for reporting errors during disposal. Try to report the type of the object.
 */
function _describe(obj) {
    return (obj && obj.constructor && obj.constructor.name ? obj.constructor.name : '' + obj);
}
/**
 * Helper disposer that simply invokes the .dispose() method.
 */
function _defaultDisposer(obj) {
    obj.dispose();
}

},{}],11:[function(require,module,exports){
"use strict";
/**
 * dom.js provides a way to build a DOM tree easily.
 *
 * E.g.
 *  import {dom} from 'grainjs';
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
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
// We keep various dom-related functions organized in private modules, but they are exposed here.
var _domImpl_1 = require("./_domImpl");
exports.svg = _domImpl_1.svg;
exports.update = _domImpl_1.update;
exports.frag = _domImpl_1.frag;
exports.find = _domImpl_1.find;
exports.findAll = _domImpl_1.findAll;
__export(require("./_domComponent"));
__export(require("./_domDispose"));
__export(require("./_domMethods"));
__export(require("./domevent"));
const _domComponent = require("./_domComponent");
const _domDispose = require("./_domDispose");
const _domImpl = require("./_domImpl");
const _domMethods = require("./_domMethods");
const domevent = require("./domevent");
// We just want to re-export _domImpl.dom, but to allow adding methods to it in a typesafe way,
// TypeScript wants us to declare a real function in the same file.
function dom(tagString, ...args) {
    return _domImpl.dom(tagString, ...args);
}
exports.dom = dom;
// Additionally export all methods as properties of dom() function.
(function (dom) {
    dom.svg = _domImpl.svg;
    dom.frag = _domImpl.frag;
    dom.update = _domImpl.update;
    dom.find = _domImpl.find;
    dom.findAll = _domImpl.findAll;
    dom.domDispose = _domDispose.domDispose;
    dom.onDisposeElem = _domDispose.onDisposeElem;
    dom.onDispose = _domDispose.onDispose;
    dom.autoDisposeElem = _domDispose.autoDisposeElem;
    dom.autoDispose = _domDispose.autoDispose;
    dom.attrsElem = _domMethods.attrsElem;
    dom.attrs = _domMethods.attrs;
    dom.attrElem = _domMethods.attrElem;
    dom.attr = _domMethods.attr;
    dom.boolAttrElem = _domMethods.boolAttrElem;
    dom.boolAttr = _domMethods.boolAttr;
    dom.textElem = _domMethods.textElem;
    dom.text = _domMethods.text;
    dom.styleElem = _domMethods.styleElem;
    dom.style = _domMethods.style;
    dom.propElem = _domMethods.propElem;
    dom.prop = _domMethods.prop;
    dom.showElem = _domMethods.showElem;
    dom.show = _domMethods.show;
    dom.hideElem = _domMethods.hideElem;
    dom.hide = _domMethods.hide;
    dom.toggleClassElem = _domMethods.toggleClassElem;
    dom.toggleClass = _domMethods.toggleClass;
    dom.cssClassElem = _domMethods.cssClassElem;
    dom.cssClass = _domMethods.cssClass;
    dom.dataElem = _domMethods.dataElem;
    dom.data = _domMethods.data;
    dom.getData = _domMethods.getData;
    dom.domComputed = _domMethods.domComputed;
    dom.maybe = _domMethods.maybe;
    dom.Component = _domComponent.Component;
    dom.createElem = _domComponent.createElem;
    dom.create = _domComponent.create;
    dom.createInit = _domComponent.createInit;
    dom.onElem = domevent.onElem;
    dom.on = domevent.on;
    dom.onMatchElem = domevent.onMatchElem;
    dom.onMatch = domevent.onMatch;
})(dom = exports.dom || (exports.dom = {}));

},{"./_domComponent":3,"./_domDispose":4,"./_domImpl":5,"./_domMethods":6,"./domevent":12}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
"use strict";
/**
 * emit.js implements an Emitter class which emits events to a list of listeners. Listeners are
 * simply functions to call, and "emitting an event" just calls those functions.
 *
 * This is similar to Backbone events, with more focus on efficiency. Both inserting and removing
 * listeners is constant time.
 *
 * To create an emitter:
 *    let emitter = new Emitter();
 *
 * To add a listener:
 *    let listener = fooEmitter.addListener(callback);
 * To remove a listener:
 *    listener.dispose();
 *
 * The only way to remove a listener is to dispose the Listener object returned by addListener().
 * You can often use autoDispose to do this automatically when subscribing in a constructor:
 *    this.autoDispose(fooEmitter.addListener(this.onFoo, this));
 *
 * To emit an event, call emit() with any number of arguments:
 *    emitter.emit("hello", "world");
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Note about a possible alternative implementation.
//
// We could implement the same interface using an array of listeners. Certain issues apply, in
// particular with removing listeners from inside emit(), and in ensuring that removals are
// constant time on average. Such an implementation was attempted and timed. The result is that
// compared to the linked-list implementation here, add/remove combination could be made nearly
// twice faster (on average), while emit and add/remove/emit are consistently slightly slower.
//
// The implementation here was chosen based on those timings, and as the simpler one. For example,
// on one setup (macbook, node4, 5-listener queue), add+remove take 0.1us, while add+remove+emit
// take 3.82us. (In array-based implementation with same set up, add+remove is 0.06us, while
// add+remove+emit is 4.80us.)
// The private property name to hold next/prev pointers.
function _noop() { }
/**
 * This is an implementation of a doubly-linked list, with just the minimal functionality we need.
 */
class LLink {
    constructor() {
        this._next = null;
        this._prev = null;
        // This immediate circular reference might be undesirable for GC, but might not matter, and
        // makes the linked list implementation simpler and faster.
        this._next = this;
        this._prev = this;
    }
    isDisposed() {
        return !this._next;
    }
    _insertBefore(next, node) {
        const last = next._prev;
        last._next = node;
        next._prev = node;
        node._prev = last;
        node._next = next;
    }
    _removeNode(node) {
        if (node._prev) {
            node._prev._next = node._next;
            node._next._prev = node._prev;
        }
        node._prev = node._next = null;
    }
    _disposeList() {
        let node = this;
        let next = node._next;
        while (next !== null) {
            node._next = node._prev = null;
            node = next;
            next = node._next;
        }
    }
}
exports.LLink = LLink;
class Emitter extends LLink {
    /**
     * Constructs an Emitter object.
     */
    constructor() {
        super();
        this._changeCB = _noop;
        this._changeCBContext = undefined;
    }
    /**
     * Adds a listening callback to the list of functions to call on emit().
     * @param {Function} callback: Function to call.
     * @param {Object} optContext: Context for the function.
     * @returns {Listener} Listener object. Its dispose() method removes the callback from the list.
     */
    addListener(callback, optContext) {
        return new Listener(this, callback, optContext);
    }
    /**
     * Calls all listener callbacks, passing all arguments to each of them.
     */
    emit(...args) {
        Listener.callAll(this._next, this, args);
    }
    /**
     * Sets the single callback that would get called when a listener is added or removed.
     * @param {Function} changeCB(hasListeners): Function to call after a listener is added or
     *    removed. It's called with a boolean indicating whether this Emitter has any listeners.
     *    Pass in `null` to unset the callback.
     */
    setChangeCB(changeCB, optContext) {
        this._changeCB = changeCB || _noop;
        this._changeCBContext = optContext;
    }
    /**
     * Helper used by Listener class, but not intended for public usage.
     */
    _triggerChangeCB() {
        this._changeCB.call(this._changeCBContext, this.hasListeners());
    }
    /**
     * Returns whether this Emitter has any listeners.
     */
    hasListeners() {
        return this._next !== this;
    }
    /**
     * Disposes the Emitter. It breaks references between the emitter and all the items, allowing
     * for better garbage collection. It effectively disposes all current listeners.
     */
    dispose() {
        this._disposeList();
        this._changeCB = _noop;
        this._changeCBContext = undefined;
    }
}
exports.Emitter = Emitter;
/**
 * Listener object wraps a callback added to an Emitter, allowing for O(1) removal when the
 * listener is disposed.
 */
class Listener extends LLink {
    constructor(emitter, callback, context) {
        super();
        this.emitter = emitter;
        this.callback = callback;
        this.context = context;
        this._insertBefore(emitter, this);
        emitter._triggerChangeCB();
    }
    static callAll(begin, end, args) {
        while (begin !== end) {
            const lis = begin;
            lis.callback.call(lis.context, ...args);
            begin = lis._next;
        }
    }
    dispose() {
        if (this.isDisposed()) {
            return;
        }
        this._removeNode(this);
        this.emitter._triggerChangeCB();
    }
}
exports.Listener = Listener;

},{}],14:[function(require,module,exports){
"use strict";
/**
 * Grain.js observables and computeds are similar to (and mostly inspired by) those in
 * Knockout.js. In fact, they can work together.
 *
 *  import {fromKo} from 'kowrap'
 *
 *  fromKo(koObservable)
 *
 * returns a Grain.js observable that mirrors the passed-in Knockout observable (which may be a
 * computed as well). Similarly,
 *
 *  import {toKo} from 'kowrap';
 *  import * as ko from 'knockout';
 *
 *  toKo(ko, observable)
 *
 * returns a Knockout.js observable that mirrows the passed-in Grain observable or computed. Note
 * that toKo() mus tbe called with the knockout module as an argument. This is to avoid adding
 * knockout as a dependency of grainjs.
 *
 * In both cases, calling fromKo/toKo twice on the same observable will return the same wrapper,
 * and subscriptions and disposal are appropriately set up to make usage seamless.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const observable_1 = require("./observable");
const fromKoWrappers = new WeakMap();
const toKoWrappers = new WeakMap();
/**
 * Returns a Grain.js observable which mirrors a Knockout observable.
 */
function fromKo(koObservable) {
    const prevObs = fromKoWrappers.get(koObservable);
    if (prevObs) {
        return prevObs;
    }
    const newObs = observable_1.observable(koObservable.peek());
    fromKoWrappers.set(koObservable, newObs);
    koObservable.subscribe((val) => newObs.set(val));
    return newObs;
}
exports.fromKo = fromKo;
/**
 * Returns a Knockout observable which mirrors a Grain.js observable.
 */
function toKo(knockout, grainObs) {
    const prevKoObs = toKoWrappers.get(grainObs);
    if (prevKoObs) {
        return prevKoObs;
    }
    const newKoObs = knockout.observable(grainObs.get());
    toKoWrappers.set(grainObs, newKoObs);
    grainObs.addListener((val) => newKoObs(val));
    return newKoObs;
}
exports.toKo = toKo;

},{"./observable":15}],15:[function(require,module,exports){
"use strict";
/**
 * observable.js implements an observable value, which lets other code subscribe to changes.
 *
 * E.g.
 *  let o = observable(17);
 *  o.get();          // 17
 *  o.addListener(foo);
 *  o.set("asdf");    // foo("asdf", 17) gets called.
 *  o.get();          // "asdf"
 *
 * To subscribe to changes, use obs.addListener(callback, context). The callback will get called
 * with (newValue, oldValue) as arguments.
 *
 * When you use observables within the body of a computed(), you can automatically create
 * subscriptions to them with the use(obs) function. E.g.
 *    let obs3 = computed(use => use(obs1) + use(obs2));
 * creates a computed observable `obs3` which is subscribed to changes to `obs1` and `obs2`.
 *
 * Note that unlike with knockout, use(obs) method requires an explicit `use` function, which is
 * always passed to a computed's read() callback for this purpose. This makes it explicit when a
 * dependency is created, and which observables the dependency connects.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const _computed_queue_1 = require("./_computed_queue");
const emit_1 = require("./emit");
var _computed_queue_2 = require("./_computed_queue");
exports.bundleChanges = _computed_queue_2.bundleChanges;
class Observable {
    /**
     * Internal constructor for an Observable. You should use observable() function instead.
     */
    constructor(value) {
        this._onChange = new emit_1.Emitter();
        this._value = value;
    }
    /**
     * Returns the value of the observable. It is fast and does not create a subscription.
     * (It is similar to knockout's peek()).
     * @returns {Object} The current value of the observable.
     */
    get() { return this._value; }
    /**
     * Sets the value of the observable. If the value differs from the previously set one, then
     * listeners to this observable will get called with (newValue, oldValue) as arguments.
     * @param {Object} value: The new value to set.
     */
    set(value) {
        const prev = this._value;
        if (value !== prev) {
            this._value = value;
            this._onChange.emit(value, prev);
            _computed_queue_1.compute();
        }
    }
    /**
     * Adds a callback to listen to changes in the observable.
     * @param {Function} callback: Function, called on changes with (newValue, oldValue) arguments.
     * @param {Object} optContext: Context for the function.
     * @returns {Listener} Listener object. Its dispose() method removes the callback.
     */
    addListener(callback, optContext) {
        return this._onChange.addListener(callback, optContext);
    }
    /**
     * Returns whether this observable has any listeners.
     */
    hasListeners() {
        return this._onChange.hasListeners();
    }
    /**
     * Sets a single callback to be called when a listener is added or removed. It overwrites any
     * previously-set such callback.
     * @param {Function} changeCB(hasListeners): Function to call after a listener is added or
     *    removed. It's called with a boolean indicating whether this observable has any listeners.
     *    Pass in `null` to unset the callback.
     */
    setListenerChangeCB(changeCB, optContext) {
        this._onChange.setChangeCB(changeCB, optContext);
    }
    /**
     * Used by subscriptions to keep track of dependencies. An observable that has dependnecies,
     * such as a computed observable, would override this method.
     */
    _getDepItem() {
        return null;
    }
    /**
     * Disposes the observable.
     */
    dispose() {
        this._onChange.dispose();
        this._value = undefined;
    }
    /**
     * Returns whether this observable is disposed.
     */
    isDisposed() {
        return this._onChange.isDisposed();
    }
}
exports.Observable = Observable;
/**
 * Creates a new Observable with the initial value of optValue if given or undefined if omitted.
 * @param {Object} optValue: The initial value to set.
 * @returns {Observable} The newly created observable.
 */
function observable(value) {
    return new Observable(value);
}
exports.observable = observable;

},{"./_computed_queue":2,"./emit":13}],16:[function(require,module,exports){
"use strict";
/**
 * subscribe.js implements subscriptions to several observables at once.
 *
 * E.g. if we have some existing observables (which may be instances of `computed`),
 * we can subscribe to them explicitly:
 *    let obs1 = observable(5), obs2 = observable(12);
 *    subscribe(obs1, obs2, (use, v1, v2) => console.log(v1, v2));
 *
 * or implicitly by using `use(obs)` function, which allows dynamic subscriptions:
 *    subscribe(use => console.log(use(obs1), use(obs2)));
 *
 * In either case, if obs1 or obs2 is changed, the callbacks will get called automatically.
 *
 * Creating a subscription allows any number of dependencies to be specified explicitly, and their
 * values will be passed to the callback(). These may be combined with automatic dependencies
 * detected using use(). Note that constructor dependencies have less overhead.
 *
 *    subscribe(...deps, ((use, ...depValues) => READ_CALLBACK));
 */
Object.defineProperty(exports, "__esModule", { value: true });
const _computed_queue_1 = require("./_computed_queue");
// Constant empty array, which we use to avoid allocating new read-only empty arrays.
const emptyArray = [];
class Subscription {
    /**
     * Internal constructor for a Subscription. You should use subscribe() function instead.
     */
    constructor(callback, dependencies) {
        this._depItem = new _computed_queue_1.DepItem(this._evaluate, this);
        this._dependencies = dependencies.length > 0 ? dependencies : emptyArray;
        this._depListeners = dependencies.length > 0 ? dependencies.map((obs) => this._subscribeTo(obs)) : emptyArray;
        this._dynDeps = new Map(); // Maps dependent observable to its Listener object.
        this._callback = callback;
        this._useFunc = this._useDependency.bind(this);
        this._evaluate();
    }
    /**
     * Disposes the computed, unsubscribing it from all observables it depends on.
     */
    dispose() {
        for (const lis of this._depListeners) {
            lis.dispose();
        }
        for (const lis of this._dynDeps.values()) {
            lis.dispose();
        }
    }
    /**
     * For use by computed(): returns this subscription's hook into the _computed_queue.
     */
    _getDepItem() { return this._depItem; }
    /**
     * @private
     * Gets called when the callback calls `use(obs)` for an observable. It creates a
     * subscription to `obs` if one doesn't yet exist.
     * @param {Observable} obs: The observable being used as a dependency.
     */
    _useDependency(obs) {
        let listener = this._dynDeps.get(obs);
        if (!listener) {
            listener = this._subscribeTo(obs);
            this._dynDeps.set(obs, listener);
        }
        listener._inUse = true;
        this._depItem.useDep(obs._getDepItem());
        return obs.get();
    }
    /**
     * @private
     * Calls the callback() with appropriate args, and updates subscriptions when it is done.
     * I.e. adds dynamic subscriptions created via `use(obs)`, and disposes those no longer used.
     */
    _evaluate() {
        try {
            // Note that this is faster than using .map().
            const readArgs = [this._useFunc];
            for (let i = 0, len = this._dependencies.length; i < len; i++) {
                readArgs[i + 1] = this._dependencies[i].get();
                this._depItem.useDep(this._dependencies[i]._getDepItem());
            }
            return this._callback.apply(undefined, readArgs);
        }
        finally {
            this._dynDeps.forEach((listener, obs) => {
                if (listener._inUse) {
                    listener._inUse = false;
                }
                else {
                    this._dynDeps.delete(obs);
                    listener.dispose();
                }
            });
        }
    }
    /**
     * @private
     * Subscribes this computed to another observable that it depends on.
     * @param {Observable} obs: The observable to subscribe to.
     * @returns {Listener} Listener object.
     */
    _subscribeTo(obs) {
        return obs.addListener(this._enqueue, this);
    }
    /**
     * @private
     * Adds this item to the recompute queue.
     */
    _enqueue() {
        this._depItem.enqueue();
    }
}
exports.Subscription = Subscription;
/**
 * Creates a new Subscription.
 * @param {Observable} ...observables: The initial params, of which there may be zero or more, are
 *    observables on which this computed depends. When any of them change, the callback()
 *    will be called with the values of these observables as arguments.
 * @param {Function} callback: will be called with arguments (use, ...values), i.e. the
 *    `use` function and values for all of the ...observables that precede this argument.
 *    This callback is called immediately, and whenever any dependency changes.
 * @returns {Subscription} The new subscription which may be disposed to unsubscribe.
 */
function subscribe(...args) {
    const cb = args.pop();
    // The cast helps ensure that Observable is compatible with ISubscribable abstraction that we use.
    return new Subscription(cb, args);
}
exports.subscribe = subscribe;

},{"./_computed_queue":2}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Returns f such that f() calls func(...boundArgs), i.e. optimizes `() => func(...boundArgs)`.
 * It is faster on node6 by 57-92%.
 */
function bindB(func, b) {
    switch (b.length) {
        case 0: return () => func();
        case 1: return () => func(b[0]);
        case 2: return () => func(b[0], b[1]);
        case 3: return () => func(b[0], b[1], b[2]);
        case 4: return () => func(b[0], b[1], b[2], b[3]);
        case 5: return () => func(b[0], b[1], b[2], b[3], b[4]);
        case 6: return () => func(b[0], b[1], b[2], b[3], b[4], b[5]);
        case 7: return () => func(b[0], b[1], b[2], b[3], b[4], b[5], b[6]);
        case 8: return () => func(b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7]);
        default: return () => func.apply(undefined, b);
    }
}
exports.bindB = bindB;
/**
 * Returns f such that f(unboundArg) calls func(unboundArg, ...boundArgs).
 * I.e. optimizes `(arg) => func(arg, ...boundArgs)`.
 * It is faster on node6 by 0-92%.
 */
function bindUB(func, b) {
    switch (b.length) {
        case 0: return (arg) => func(arg);
        case 1: return (arg) => func(arg, b[0]);
        case 2: return (arg) => func(arg, b[0], b[1]);
        case 3: return (arg) => func(arg, b[0], b[1], b[2]);
        case 4: return (arg) => func(arg, b[0], b[1], b[2], b[3]);
        case 5: return (arg) => func(arg, b[0], b[1], b[2], b[3], b[4]);
        case 6: return (arg) => func(arg, b[0], b[1], b[2], b[3], b[4], b[5]);
        case 7: return (arg) => func(arg, b[0], b[1], b[2], b[3], b[4], b[5], b[6]);
        case 8: return (arg) => func(arg, b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7]);
        default: return (arg) => func(arg, ...b);
    }
}
exports.bindUB = bindUB;
/**
 * Returns f such that f(unboundArg) calls func(...boundArgs, unboundArg).
 * I.e. optimizes `(arg) => func(...boundArgs, arg)`.
 * It is faster on node6 by 0-92%.
 */
function bindBU(func, b) {
    switch (b.length) {
        case 0: return (arg) => func(arg);
        case 1: return (arg) => func(b[0], arg);
        case 2: return (arg) => func(b[0], b[1], arg);
        case 3: return (arg) => func(b[0], b[1], b[2], arg);
        case 4: return (arg) => func(b[0], b[1], b[2], b[3], arg);
        case 5: return (arg) => func(b[0], b[1], b[2], b[3], b[4], arg);
        case 6: return (arg) => func(b[0], b[1], b[2], b[3], b[4], b[5], arg);
        case 7: return (arg) => func(b[0], b[1], b[2], b[3], b[4], b[5], b[6], arg);
        case 8: return (arg) => func(b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], arg);
        default: return (arg) => func(...b, arg);
    }
}
exports.bindBU = bindBU;

},{}],18:[function(require,module,exports){
/**
 * FastPriorityQueue.js : a fast heap-based priority queue  in JavaScript.
 * (c) the authors
 * Licensed under the Apache License, Version 2.0.
 *
 * Speed-optimized heap-based priority queue for modern browsers and JavaScript engines.
 *
 * Usage :
         Installation (in shell, if you use node):
         $ npm install fastpriorityqueue

         Running test program (in JavaScript):

         // var FastPriorityQueue = require("fastpriorityqueue");// in node
         var x = new FastPriorityQueue();
         x.add(1);
         x.add(0);
         x.add(5);
         x.add(4);
         x.add(3);
         x.peek(); // should return 0, leaves x unchanged
         x.size; // should return 5, leaves x unchanged
         while(!x.isEmpty()) {
           console.log(x.poll());
         } // will print 0 1 3 4 5
         x.trim(); // (optional) optimizes memory usage
 */
"use strict";

var defaultcomparator = function (a, b) {
    return a < b;
};

// the provided comparator function should take a, b and return *true* when a < b
function FastPriorityQueue(comparator) {
    if (!(this instanceof FastPriorityQueue)) return new FastPriorityQueue(comparator);
    this.array = [];
    this.size = 0;
    this.compare = comparator || defaultcomparator;
}


// Add an element the the queue
// runs in O(log n) time
FastPriorityQueue.prototype.add = function (myval) {
    var i = this.size;
    this.array[this.size] = myval;
    this.size += 1;
    var p;
    var ap;
    while (i > 0) {
        p = (i - 1) >> 1;
        ap = this.array[p];
        if (!this.compare(myval, ap)) {
             break;
        }
        this.array[i] = ap;
        i = p;
    }
    this.array[i] = myval;
};

// replace the content of the heap by provided array and "heapifies it"
FastPriorityQueue.prototype.heapify = function (arr) {
    this.array = arr;
    this.size = arr.length;
    var i;
    for (i = (this.size >> 1); i >= 0; i--) {
        this._percolateDown(i);
    }
};

// for internal use
FastPriorityQueue.prototype._percolateUp = function (i) {
    var myval = this.array[i];
    var p;
    var ap;
    while (i > 0) {
        p = (i - 1) >> 1;
        ap = this.array[p];
        if (!this.compare(myval, ap)) {
            break;
        }
        this.array[i] = ap;
        i = p;
    }
    this.array[i] = myval;
};


// for internal use
FastPriorityQueue.prototype._percolateDown = function (i) {
    var size = this.size;
    var hsize = this.size >>> 1;
    var ai = this.array[i];
    var l;
    var r;
    var bestc;
    while (i < hsize) {
        l = (i << 1) + 1;
        r = l + 1;
        bestc = this.array[l];
        if (r < size) {
            if (this.compare(this.array[r], bestc)) {
                l = r;
                bestc = this.array[r];
            }
        }
        if (!this.compare(bestc, ai)) {
            break;
        }
        this.array[i] = bestc;
        i = l;
    }
    this.array[i] = ai;
};

// Look at the top of the queue (a smallest element)
// executes in constant time
//
// Calling peek on an empty priority queue returns
// the "undefined" value.
// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/undefined
//
FastPriorityQueue.prototype.peek = function () {
    if(this.size == 0) return undefined;
    return this.array[0];
};

// remove the element on top of the heap (a smallest element)
// runs in logarithmic time
//
// If the priority queue is empty, the function returns the
// "undefined" value.
// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/undefined
//
// For long-running and large priority queues, or priority queues
// storing large objects, you may  want to call the trim function
// at strategic times to recover allocated memory.
FastPriorityQueue.prototype.poll = function () {
    if (this.size == 0) 
        return undefined;
    var ans = this.array[0];
    if (this.size > 1) {
        this.array[0] = this.array[--this.size];
        this._percolateDown(0 | 0);
    } else {
        this.size -= 1;
    }
    return ans;
};


// This function adds the provided value to the heap, while removing
//  and returning the peek value (like poll). The size of the priority
// thus remains unchanged.
FastPriorityQueue.prototype.replaceTop = function (myval) {
    if (this.size == 0) 
        return undefined;
    var ans = this.array[0];
    this.array[0] = myval;
    this._percolateDown(0 | 0);
    return ans;
};


// recover unused memory (for long-running priority queues)
FastPriorityQueue.prototype.trim = function () {
    this.array = this.array.slice(0, this.size);
};

// Check whether the heap is empty
FastPriorityQueue.prototype.isEmpty = function () {
    return this.size === 0;
};

// just for illustration purposes
var main = function () {
    // main code
    var x = new FastPriorityQueue(function (a, b) {
        return a < b;
    });
    x.add(1);
    x.add(0);
    x.add(5);
    x.add(4);
    x.add(3);
    while (!x.isEmpty()) {
        console.log(x.poll());
    }
};

if (require.main === module) {
    main();
}

module.exports = FastPriorityQueue;

},{}]},{},[1])(1)
});