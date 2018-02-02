/**
 * A simple and fast priority queue with a limited interface to push, pop, peek, and get size. It
 * is essentially equivalent to both npm modules 'fastpriorityqueue' and 'qheap', but is in
 * TypeScript and is a bit cleaner and simpler.
 *
 * It is constructed with a function that returns which of two items is "prior"; the pop() method
 * returns the most-prior element.
 */

export type IsPriorFunc<T> = (a: T, b: T) => boolean;

export class PriorityQueue<T> {
  // Items form a binary tree packed into an array. Root is items[0]; children of items[i] are
  // items[2*i+1] and items[2*i+2]; parent of items[i] is items[(i - 1) >> 1]. For all children,
  // the invariant isPrior(parent, child) holds.
  private _items: T[] = [];

  constructor(private _isPrior: IsPriorFunc<T>) {}

  public get size(): number { return this._items.length; }

  public push(item: T): void {
    const items = this._items;
    const isPrior = this._isPrior;

    let curIdx = items.length;
    while (curIdx > 0) {
      // While we have a parent that is not prior to us, bubble up the "hole" at items.length.
      const parIdx = (curIdx - 1) >> 1;   // tslint:disable-line:no-bitwise
      const parItem = items[parIdx];
      if (isPrior(parItem, item)) {
        break;
      }
      items[curIdx] = parItem;
      curIdx = parIdx;
    }
    items[curIdx] = item;
  }

  public peek(): T|undefined {
    return this._items[0];
  }

  public pop(): T|undefined {
    const items = this._items;
    const isPrior = this._isPrior;
    const result = items[0];
    if (items.length <= 1) {
      items.length = 0;
      return result;
    }

    // Bubble the last item downwards from the root.
    const size = items.length - 1;
    const item = items[size];
    items.length = size;
    let curIdx = 0;
    // Getting the "half" right is a bit tricky. It needs to be that
    // (curIdx < half) is equivalent to (curIdx * 2 + 1 < size)
    const half = size >> 1;     // tslint:disable-line:no-bitwise
    while (curIdx < half) {
      let bestIdx = curIdx * 2 + 1;
      let bestItem = items[bestIdx];
      const rightIdx = bestIdx + 1;
      if (rightIdx < size) {
        // If there is a second child too, pick the prior one for bubbling down.
        const rightItem = items[rightIdx];
        if (isPrior(rightItem, bestItem)) {
          bestIdx = rightIdx;
          bestItem = rightItem;
        }
      }
      if (isPrior(item, bestItem)) {
        break;
      }
      items[curIdx] = bestItem;
      curIdx = bestIdx;
    }
    items[curIdx] = item;
    return result;
  }
}
