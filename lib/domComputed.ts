import {BindableValue, subscribeElem} from './binding';
import {domDispose} from './domDispose';
import {DomArg, DomMethod, frag} from './domImpl';

// Use the browser globals in a way that allows replacing them with mocks in tests.
import {G} from './browserGlobals';

// The type returned by domComputed(). It's actually an example of DomArg, but is given its own
// name for use in places where a DomComputed is suitable but a general DomArg is not.
export type DomComputed = [Node, Node, DomMethod];

/**
 * Replaces the content between nodeBefore and nodeAfter, which should be two siblings within the
 * same parent node. New content may be anything allowed as an argument to dom(), including null
 * to insert nothing. Runs disposers, if any, on all removed content.
 */
export function replaceContent(nodeBefore: Node, nodeAfter: Node, content: DomArg): void {
  const elem = nodeBefore.parentNode;
  if (elem) {
    let next;
    for (let n = nodeBefore.nextSibling; n && n !== nodeAfter; n = next) {
      next = n.nextSibling;
      domDispose(n);
      elem.removeChild(n);
    }
    if (content) {
      elem.insertBefore(content instanceof G.Node ? content : frag(content), nodeAfter);
    }
  }
}

/**
 * Appends dynamic DOM content to an element. The value may be an observable or function (from
 * which a computed is created), whose value will be passed to `contentFunc` which should return
 * DOM content. If the contentFunc is omitted, it defaults to identity, i.e. it's OK for the
 * observable or function to return DOM directly.
 *
 * The DOM content returned may be an element, string, array, or null. Whenever the observable
 * changes, previous content is disposed and removed, and new content added in its place.
 *
 * The following are roughly equivalent:
 *  (A) domComputed(nlinesObs, nlines => nlines > 1 ? dom('textarea') : dom('input'));
 *  (B) domComputed(use => use(nlinesObs) > 1 ? dom('textarea') : dom('input'));
 *  (C) domComputed(use => use(nlinesObs) > 1, isTall => isTall ? dom('textarea') : dom('input'));
 *
 * Here, (C) is best. Both (A) and (B) would rebuild DOM for any change in nlinesObs, but (C)
 * encapsulates meaningful changes in the observable, and only recreates DOM when necessary.
 *
 * Syntax (B), without the second argument, may be useful in cases of DOM depending on several
 * observables, e.g.
 *
 *    domComputed(use => use(readonlyObs) ? dom('div') :
 *                          (use(nlinesObs) > 1 ? dom('textarea') : dom('input')));
 *
 * If the argument is not an observable, domComputed() may but should not be used. The following
 * are equivalent:
 *
 *    dom(..., domComputed(listValue, list => `Have ${list.length} items`), ...)
 *    dom(..., `Have ${listValue.length} items`, ...)
 *
 * In this case, the latter is preferred as the clearly simpler one.
 *
 * @param valueObs: Observable or function for a computed.
 * @param contentFunc: Function called with the result of valueObs as the input, and
 *    returning DOM as output. If omitted, defaults to the identity function.
 */
export function domComputed(valueObs: BindableValue<Exclude<DomArg, DomMethod>>): DomComputed;
export function domComputed<T>(valueObs: BindableValue<T>, contentFunc: (val: T) => DomArg): DomComputed;
export function domComputed<T>(
  valueObs: BindableValue<T>, contentFunc: (val: T) => DomArg = identity as any,
): DomComputed {
  const markerPre = G.document.createComment('a');
  const markerPost = G.document.createComment('b');

  // Function is added after markerPre and markerPost, so that it runs once they have already been
  // attached to elem (the parent element).
  return [markerPre, markerPost, (elem: Node) => {
    subscribeElem(markerPost, valueObs,
      (value) => replaceContent(markerPre, markerPost, contentFunc(value)));
  }];
}

function identity<T>(arg: T): T { return arg; }

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
 * @param boolValueObs: Observable or function for a computed.
 * @param contentFunc: Called with the result of boolValueObs when it is truthy. Should return DOM.
 */
export function maybe<T>(boolValueObs: BindableValue<T>, contentFunc: (val: T) => DomArg): DomComputed {
  return domComputed(boolValueObs, (value) => value ? contentFunc(value) : null);
}
