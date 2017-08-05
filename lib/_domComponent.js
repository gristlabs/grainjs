/**
 * Implementation of UI components that can be inserted into dom(). See documentation for
 * createElem() and create().
 */
"use strict";

const noop = require('lodash/noop');
const _domImpl = require('./_domImpl.js');
const _domDispose = require('./_domDispose.js');

// Use the browser globals in a way that allows replacing them with mocks in tests.
const G = require('./browserGlobals.js').use('document');


/**
 * Helper class that maintains a range of DOM elements that are owned by a given disposable.
 * Its special magic is that when the owner is disposed, the owned content is disposed (even if it
 * consists of multiple elements) and removed. And conversely, if the owned content gets disposed,
 * it disposes the owner object.
 *
 * TODO: Once there are tests, try to simplify by removing the skipping feature, tying
 * owner.dispose to markerPost, and skipping both dom disposal and detaching when isInDomDispose
 * is set.
 */
class OwnedContent {
  /**
   * Appends content to elem, associating it with an owner object, which should be an instance of
   * Disposable. When elem gets disposed, owner.dispose() will get called. When owner.dispose() is
   * called, the owned content will be disposed and removed. Note that for optimization, the
   * removal of the content is skipped if DOM is being disposed anyway.
   * @param {Element} elem: The element to which to append content.
   * @param {Disposable} owner: The element taking the ownership of the content.
   * @param {Object} content: Arbitrary content to add. This may be any argument that's valid to
   *    pass to dom(), including a DOM element, a string, null, or an array.
   */
  constructor(elem, owner, content) {
    // The way it's implemented is by keeping a comment node before and after the inserted
    // content. Cleaning is implmented by iterating from the first marker to the last.
    this._markerPre = G.document.createComment('A');
    this._markerPost = G.document.createComment('B');
    _domImpl.update(elem, this._markerPre, content, this._markerPost);

    // We attach disposal of owner to the first marker. It uses a special feature of dom.dispose()
    // to skip the rest of the owned elements during disposal. TODO: do we need "skip" feature?
    this._isInDomDispose = false;
    _domDispose.onDisposeElem(this._markerPre, () => {
      this._isInDomDispose = true;
      owner.dispose();
      return this._markerPost;
    });

    // Whenever the owner object is disposed, dispose this OwnedContent too.
    owner.autoDispose(this);
  }

  dispose() {
    // This always disposes content, but skips the removal of the content from the DOM if called
    // during DOM disposal.
    let elem = this._markerPre.parentNode;
    if (!elem) { return; }

    let next, maybeDetach = this._isInDomDispose ? noop : _detachNode;
    for (let n = this._markerPre.nextSibling; n && n !== this._markerPost; n = next) {
      next = n.nextSibling;
      _domDispose.dispose(n);
      maybeDetach(elem, n);
    }
    maybeDetach(elem, this._markerPre);
    maybeDetach(elem, this._markerPost);
  }
}

function _detachNode(parent, child) {
  parent.removeChild(child);
}

/**
 * Construct and insert a UI component into the given DOM element. The component must extend
 * dispose.Disposable(...), and must implement a `render()` method which should return any value
 * accepted by dom() as an argument, including a DOM element, a string, null, or an array. The
 * returned DOM is automatically owned by the component.
 *
 * Logically, the parent `elem` owns the created component, and the component owns the DOM
 * returned by its render() method. If the parent is disposed, so is the component and its DOM. If
 * the component is somehow disposed directly, then its DOM is disposed and removed from `elem`.
 *
 * NOTE ON CORRECT USAGE:
 *
 *    It is possible to insert a component using 'dom.create(Comp)` or
 *    `dom.render(Comp.create())`. The first one should be used. To understand why, compare these:
 *
 *       dom('div', dom.create(Comp1), dom.create(Comp2))
 *    vs
 *       dom('div', dom.render(Comp1.create()), dom.render(Comp2.create())
 *
 *    In both cases, the constructor for Comp1 runs before the constructor for Comp2. Consider
 *    what happens when Comp2's constructor throws an exception. In the second case, nothing yet
 *    owns the created Comp1 component, and it will never get cleaned up. In the first case,
 *    dom('div') element gets ownership of it early enough and will disposed it.
 *
 * @param {Element} elem: The element to which to append the newly constructed component.
 * @param {Class} ComponentClass: The component class to instantiate. It must extend
 *    dispose.Disposable(...) (e.g. dispose.Disposable(Object)), and implement render() method.
 * @param {Objects} ...args: Arbitrary arguments to the constructor.
 */
function createElem(elem, ComponentClass, ...args) {
  let comp = ComponentClass.create(...args);
  new OwnedContent(elem, comp, comp.render());
  return comp;
}
function create(ComponentClass, ...args) {
  return elem => createElem(elem, ComponentClass, ...args);
}
exports.createElem = createElem;
exports.create = create;


/**
 * Attach an already-existing component to DOM.
 * NOT A RECOMMENDED INTERFACE: see NOTE in createElem.
 * TODO: We do want a way to attach an already-constructed component too. A more suitable usage
 * would be if render() does not attempt to give DOM the ownership of the component. The method
 * exists here in its current form as an illustration to the problem described in createElem.
 */
function renderElem(elem, component) {
  new OwnedContent(elem, component, component.render());
}
function render(component) {
  return elem => renderElem(elem, component);
}
exports.renderElem = renderElem;
exports.render = render;
