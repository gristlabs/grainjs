/**
 * Implementation of UI components that can be inserted into dom(). See documentation for
 * createElem() and create().
 */

import {onDisposeElem} from './_domDispose';
import {DomElementMethod, update} from './_domImpl';
import {replaceContent} from './_domMethods';
import {Disposable, IDisposableOwner, IDisposableOwnerT} from './dispose';

// Use the browser globals in a way that allows replacing them with mocks in tests.
import {G} from './browserGlobals';

// Static type of a class that inherits Component.
export interface IComponentClassType<T> {
  new (...args: any[]): T;
  create(owner: Element|IDisposableOwner|null, ...args: any[]): T;
}

/**
 * Helper that takes ownership of a component by mounting it to a parent element.
 */
class DomOwner implements IDisposableOwner {
  constructor(private _parentElem: Element) {}
  public autoDispose(comp: Component): void { comp.mount(this._parentElem); }
}

/**
 * A UI component should extend this base class and implement a constructor that creates some DOM
 * and calls this.setContent() with it. Compared to a simple function returning DOM (a
 * "functional" component), a "class" component makes it easier to organize code into methods.
 *
 * In addition, a "class" component may be disposed to remove it from the DOM, although this is
 * uncommon since a UI component is normally owned by its containing DOM.
 */
export abstract class Component extends Disposable {
  /**
   * Create a component using Foo.create(owner, ...args) similarly to creating any other
   * Disposable object. The difference is that `owner` may be a DOM Element, and the content set
   * by the constructor's setContent() call will be appended to and owned by that owner element.
   *
   * If the owner is not an Element, works like a regular Disposable. To add such a component to
   * DOM, use the mount() method.
   */
  public static create<T extends new (...args: any[]) => any>(
      this: T, owner: Element|IDisposableOwnerT<InstanceType<T>>|null,
      ...args: ConstructorParameters<T>): InstanceType<T> {
    const _owner: IDisposableOwner|null = owner instanceof G.Element ? new DomOwner(owner) : owner;
    return Disposable.create.call(this, _owner, ...args);
  }

  private _markerPre: Node = G.document.createComment('A');
  private _markerPost: Node = G.document.createComment('B');
  private _contentToMount: Node|null = null;

  constructor() {
    super();

    // If the containing DOM is disposed, it will dispose all of our DOM (included among children
    // of the containing DOM). Let it also dispose this Component when it gets to _markerPost.
    // Since _unmount() is unnecessary here, we skip its work by unseting _markerPre/_markerPost.
    onDisposeElem(this._markerPost, () => {
      this._markerPre = this._markerPost = undefined!;
      this.dispose();
    });

    // When the component is disposed, unmount the DOM we created (i.e. dispose and remove).
    // Except that we skip this as unnecessary when the disposal is triggered by containing DOM.
    this.onDispose(this._unmount, this);
  }

  /**
   * Inserts the content of this component into a parent DOM element.
   */
  public mount(elem: Element): void {
    // Insert the result of setContent() into the given parent element. Note that mount() must
    // only ever be called once. It is normally called as part of .create().
    if (!this._markerPost) { throw new Error('Component mount() called when already disposed'); }
    if (this._markerPost.parentNode) { throw new Error('Component mount() called twice'); }
    update(elem, this._markerPre, this._contentToMount, this._markerPost);
    this._contentToMount = null;
  }

  /**
   * Components should call setContent() with their DOM content, typically in the constructor. If
   * called outside the constructor, setContent() will replace previously set DOM. It accepts any
   * DOM Node; use dom.frag() to insert multiple nodes together.
   */
  protected setContent(content: Node): void {
    if (this._markerPost) {
      if (this._markerPost.parentNode) {
        // Component is already mounted. Replace previous content.
        replaceContent(this._markerPre!, this._markerPost, content);
      } else {
        // Component is created but not yet mounted. Save the content for the mount() call.
        this._contentToMount = content;
      }
    }
  }

  /**
   * Detaches and disposes the DOM created and attached in mount().
   */
  private _unmount(): void {
    // Dispose the owned content, and remove it from the DOM. The conditional skips the work when
    // the unmounting is triggered by the disposal of the containing DOM.
    if (this._markerPost && this._markerPost.parentNode) {
      const elem = this._markerPost.parentNode;
      replaceContent(this._markerPre!, this._markerPost, null);
      elem.removeChild(this._markerPre!);
      elem.removeChild(this._markerPost);
    }
    this._markerPre = this._markerPost = undefined!;
  }
}

/**
 * Construct and insert a UI component into the given DOM element. The component must extend
 * dom.Component, and should build DOM and call setContent(DOM) in the constructor. DOM may be any
 * Node. Use dom.frag() to insert multiple nodes together.
 *
 * Logically, the parent `elem` owns the created component, and the component owns the DOM set by
 * setContent(). If the parent is disposed, so is the component and its DOM. If the component is
 * somehow disposed directly, then its DOM is disposed and removed from `elem`.
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
 * @param {Objects} ...args: Arguments to the Component's constructor.
 */
export function create<T extends IComponentClassType<Component>>(
    cls: T, ...args: ConstructorParameters<T>): DomElementMethod {
  return (elem) => { cls.create(elem, ...args); };
}

/**
 * If you need to initialize a component after creation, you may do it in the middle of a dom()
 * call using createInit(), in which the last of args is initFunc: a function called with the
 * constructed instance of the component:
 *    dom.createInit(MyComponent, [...args], c => {
 *      c.addChild(...);
 *      c.setOption(...);
 *    });
 * (Note that for typescript type-safety, args must be passed as an array here.)
 * The benefit of such inline construction is that the component is owned by the dom element as
 * soon as it's created, so an exception in the init function or later among dom()'s arguments
 * will trigger a cleanup.
 */
export function createInit<T extends IComponentClassType<Component>>(
    cls: T, args: ConstructorParameters<T>, initFunc: (c: InstanceType<T>) => void): DomElementMethod {
  return (elem) => { initFunc(cls.create(elem, ...args) as InstanceType<T>); };
}
