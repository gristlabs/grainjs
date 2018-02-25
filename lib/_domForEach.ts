import {domDispose} from './_domDispose';
import {DomMethod, frag} from './_domImpl';
import {replaceContent} from './_domMethods';
import {computedArray, ObsArray} from './obsArray';
import {Observable} from './observable';

// Use the browser globals in a way that allows replacing them with mocks in tests.
import {G} from './browserGlobals';

/**
 * Creates DOM elements for each element of an observable array. As the array is changed, children
 * are added or removed. This works for any array-valued observable, and for obsArray() and
 * computedArray() it works more efficiently for simple changes.
 *
 * The given itemCreateFunc() should return a single DOM node for each item, or null to skip that
 * item. It is called for new items whenever they are spliced in, or the array replaced. The
 * forEach() owns the created nodes, and runs domDispose() on them when they are spliced out.
 *
 * If the created nodes are removed from their parent externally, forEach() will cope with it, but
 * will consider these elements as no longer owned, and will not run domDispose() on them.
 *
 * Note that itemCreateFunc() does not receive an index: an index would only be correct at the
 * time the item is created, and would not reflect further changes to the array.
 *
 * If you'd like to map the DOM node back to its source item, use dom.data() and dom.getData() in
 * itemCreateFunc().
 */
export function forEach<T>(obsArray: Observable<T[]>, itemCreateFunc: (item: T) => Node|null): DomMethod {
  return (elem: Node) => {
    const markerPre = G.document.createComment('a');
    const markerPost = G.document.createComment('b');
    elem.appendChild(markerPre);
    elem.appendChild(markerPost);

    const nodes: ObsArray<Node|null> = computedArray(obsArray, itemCreateFunc);
    nodes.addListener((newArr: Array<Node|null>, oldArr: Array<Node|null>, splice?) => {
      if (splice) {
        // Remove the elements that are gone.
        for (const node of splice.deleted) {
          if (node && node.parentNode === elem) {
            domDispose(node);
            elem.removeChild(node);
          }
        }

        if (splice.numAdded > 0) {
          // Find a valid child immediately following the spliced out portion, for DOM insertion.
          const endIndex: number = splice.start + splice.numAdded;
          let nextElem: Node = markerPost;
          for (let i = endIndex; i < newArr.length; i++) {
            const node = newArr[i];
            if (node && node.parentNode === elem) {
              nextElem = node;
              break;
            }
          }

          // Insert the new elements.
          const content = frag(newArr.slice(splice.start, endIndex));
          elem.insertBefore(content, nextElem);
        }
      } else {
        replaceContent(markerPre, markerPost, newArr);
      }
    });
    replaceContent(markerPre, markerPost, nodes.get());
  };
}
