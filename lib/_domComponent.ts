/**
 * Implementation of UI components that can be inserted into dom(). See documentation for
 * createElem() and create().
 */

import {domDispose, onDisposeElem} from './_domDispose';
import {DomElementArg, DomElementMethod, update} from './_domImpl';
import {Disposable, IDisposableOwner} from './dispose';

// Use the browser globals in a way that allows replacing them with mocks in tests.
import {G} from './browserGlobals';

/**
 * A UI component should extend this base class and implement `render()`. Compared to a simple
 * function returning DOM (a "functional" component), a "class" component makes it easier to
 * organize code into methods.
 *
 * In addition, a "class" component may be disposed to remove it from the DOM, although this is
 * uncommon since a UI component is normally owned by its containing DOM.
 */
export abstract class Component extends Disposable {
  private _markerPre: Node|undefined;
  private _markerPost: Node|undefined;

  /**
   * Component should implement render(). If overriding constructor, remember to pass along
   * arguments, and keep in mind that render() will be called before additional constructor code.
   * TODO This should have typescript overloads to ensure that it takes the same arguments as
   * render().
   */
  constructor(elem: Element, ...args: any[]) {
    super();
    this._mount(elem, this.render(...args));
  }

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
  public abstract render(...args: any[]): DomElementArg;

  /**
   * Inserts the content into DOM, arranging for it to be disposed when this Component is, and to
   * dispose the Component when the parent element gets disposed.
   */
  private _mount(elem: Element, content: DomElementArg): void {
    this._markerPre = G.document.createComment('A');
    this._markerPost = G.document.createComment('B');

    // If the containing DOM is disposed, it will dispose all of our DOM (included among children
    // of the containing DOM). Let it also dispose this Component when it gets to _markerPost.
    // Since _unmount() is unnecessary here, we skip its work by unseting _markerPre/_markerPost.
    onDisposeElem(this._markerPost, () => {
      this._markerPre = this._markerPost = undefined;
      this.dispose();
    });

    // When the component is disposed, unmount the DOM we created (i.e. dispose and remove).
    // Except that we skip this as unnecessary when the disposal is triggered by containing DOM.
    this.onDispose(this._unmount, this);

    // Insert the result of render() into the given parent element.
    update(elem, this._markerPre, content, this._markerPost);
  }

  /**
   * Detaches and disposes the DOM created and attached in _mount().
   */
  private _unmount(): void {
    // Dispose the owned content, and remove it from the DOM. The conditional skips the work when
    // the unmounting is triggered by the disposal of the containing DOM.
    if (this._markerPre && this._markerPre.parentNode) {
      let next;
      const elem = this._markerPre.parentNode;
      for (let n = this._markerPre.nextSibling; n && n !== this._markerPost; n = next) {
        next = n.nextSibling;
        domDispose(n);
        elem.removeChild(n);
      }
      elem.removeChild(this._markerPre);
      elem.removeChild(this._markerPost!);
    }
  }
}

export interface IComponentClassType<T> {
  new (...args: any[]): T;
  create(owner: IDisposableOwner|null, ...args: any[]): T;
}

/**
 * Construct and insert a UI component into the given DOM element. The component must extend
 * dom.Component, and must implement a `render(...)` method which should do any rendering work
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
export function createElem<T extends Component>(elem: Element, cls: IComponentClassType<T>, ...args: any[]): T {
  return cls.create(null, elem, ...args);
}
export function create<T extends Component>(cls: IComponentClassType<T>, ...args: any[]): DomElementMethod {
  // tslint:disable-next-line:no-unused-expression
  return (elem) => { cls.create(null, elem, ...args); };
}

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
export function createInit<T>(cls: IComponentClassType<T>, ...args: any[]): DomElementMethod {
  return (elem) => {
    const initFunc: (c: T) => void = args.pop();
    const c = cls.create(null, elem, ...args);
    initFunc(c);
  };
}
