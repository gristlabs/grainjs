import {DomContents, replaceContent} from './domComputed';
import {autoDisposeElem, domDispose} from './domDispose';
import {frag} from './domImpl';
import {computedArray, MaybeObsArray, ObsArray} from './obsArray';

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
 * Note that itemCreateFunc() is called with an index as the second argument, but that index is
 * only accurate at the time of the call, and will stop reflecting the true index if more items
 * are inserted or removed before it.
 *
 * If you'd like to map the DOM node back to its source item, use dom.data() and dom.getData() in
 * itemCreateFunc().
 */
export function forEach<T>(
  obsArray: MaybeObsArray<T>,
  itemCreateFunc: (item: T, index: number) => Node|null
): DomContents {
  const markerPre = G.document.createComment('a');
  const markerPost = G.document.createComment('b');
  return [markerPre, markerPost, (elem: Node) => {
    if (Array.isArray(obsArray)) {
      replaceContent(markerPre, markerPost, obsArray.map(itemCreateFunc));
      return;
    }

    const nodes: ObsArray<Node|null> = computedArray(obsArray, itemCreateFunc);

    // Be sure to dispose the newly-created array when the DOM it's associated with is gone.
    autoDisposeElem(markerPost, nodes);

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
  }];
}
