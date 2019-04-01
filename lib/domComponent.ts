/**
 * UI components that can be inserted into dom().
 *
 * Components are created and inserted using dom.create():
 *
 *    dom('div',
 *      dom.create(MyWidget, ...myArgs),        // Calls MyWidget.create(owner, ...myArgs)
 *      dom.create(createMyWidget, ...myArgs),  // Calls createMyWidget(owner, ...myArgs)
 *    )
 *
 * The first argument may be a function, which is called directly, or a class with a .create()
 * static method, in which case that's what gets called.
 *
 * In both cases, the call gets a first argument of `owner` followed by the rest of the arguments
 * to dom.create(). The `owner` is a MultiHolder that will own this component. This works
 * naturally with any class that derives from Disposable, since it then has a suitable static
 * create() method.
 *
 * Function-based components may use owner to easily handle disposal. For example:
 *
 *    dom.create(createMyWidget)
 *    function createMyWidget(owner) {
 *      const foo = Foo.create(owner);
 *      return dom('div', foo.getTitle());
 *    }
 *
 * The `owner` argument is the main benefit of dom.create(). Logically, the owner is the DOM where
 * the component is attached. When the parent DOM element is disposed, so is the component.
 *
 *    [Explanation] To understand why the syntax is such, consider a potential alternative such as:
 *
 *       dom('div', _insert_(new Comp1()), _insert_(new Comp2(...args)))
 *
 *    In both cases, the constructor for Comp1 runs before the constructor for Comp2. What happens
 *    when Comp2's constructor throws an exception? In the second case, nothing yet owns the
 *    created Comp1 component, and it will never get cleaned up. With dom.create(), the DOM
 *    gets ownership of Comp1 early enough and will dispose it.
 *
 * A function component may return DOM directly. A class component returns the class instance,
 * which must have a .buildDom() method which will be called right after the constructor to get
 * the DOM. Note that buildDom is only called once.
 *
 * A function component may also return an object with .buildDom(). So these are equivalent:
 *
 *    dom.create(MyWidget)
 *    dom.create((owner) => MyWidget.create(owner))
 *
 * Note that ownership should be handled using the `owner` argument. Don't do this:
 *
 *    // NON-EXAMPLE: Nothing will dispose the created object:
 *    // dom.create(() => new MyWidget());
 *
 * The returned DOM may includes Nodes, strings, and domComputed() values, as well as arrays of
 * any of these. In other words, any DomArg goes except DomMethods. All the DOM returned will be
 * disposed when the containing element is disposed, followed by the `owner` itself.
 */
import {MultiHolder} from './dispose';
import {domComputed, DomComputed} from './domComputed';
import {autoDisposeElem} from './domDispose';

export type DomContents = Node | string | DomComputed | void | null | undefined | IDomContentsArray;
export interface IDomContentsArray extends Array<DomContents> {}

export interface IDomComponent {
  buildDom(): DomContents;
}

export type DomComponentReturn = DomContents | IDomComponent;

export type IDomCreateFunc<Args extends any[]> = (owner: MultiHolder, ...args: Args) => DomComponentReturn;

// It's not that we must have a constructor matching create(), but specifying type of new allows
// type checking of classes that derive from Disposable, whereas matching only create() does not
// (presumably because of the too much magic that Disposable does for the type of create()).
export interface IDomCreateClass<Args extends any[]> {
  create: IDomCreateFunc<Args>;
  new (...args: Args): DomComponentReturn;
}
export type IDomCreator<Args extends any[]> = IDomCreateFunc<Args> | IDomCreateClass<Args>;

type DomCreatorArgs<T> =
  T extends (owner: MultiHolder, ...args: infer P) => any ? P :
  (T extends new (...args: infer P) => any ? P : never);

export function create<Fn extends IDomCreator<any[]>>(fn: Fn, ...args: DomCreatorArgs<Fn>): DomContents {
  const [markerPre, markerPost, func] = domComputed(null, () => {
    // Note that the callback to domComputed() is not called until the markers have been attached
    // to the parent element. We attach the MultiHolder's disposal to markerPost the way
    // domComputed() normally attaches its own bindings.
    const owner = MultiHolder.create(null);
    autoDisposeElem(markerPost, owner);

    const value: DomComponentReturn = ('create' in fn) ?
      (fn as IDomCreateClass<any[]>).create(owner, ...args) :
      (fn as IDomCreateFunc<any[]>)(owner, ...args);
    return (value && typeof value === 'object' && 'buildDom' in value) ?
      value.buildDom() : value;
  });
  return [markerPre, markerPost, func];
}
