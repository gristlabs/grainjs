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

    let curIdx = this._items.length;
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
    if (this._items.length <= 1) { return this._items.pop(); }
    const items = this._items;
    const isPrior = this._isPrior;
    const result = items[0];

    // Bubble the last item downwards from the root.
    const item = items.pop()!;
    const size = this._items.length;
    let curIdx = 0;
    let leftIdx = 1;
    while (leftIdx < size) {
      const rightIdx = leftIdx + 1;
      const bestIdx = (rightIdx < size && isPrior(items[rightIdx], items[leftIdx])) ?
        rightIdx : leftIdx;
      if (isPrior(item, items[bestIdx])) {
        break;
      }
      items[curIdx] = items[bestIdx];
      curIdx = bestIdx;
      leftIdx = curIdx + curIdx + 1;
    }
    items[curIdx] = item;
    return result;
  }
}
