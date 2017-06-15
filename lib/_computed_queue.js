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
"use strict";

const FastPriorityQueue = require('fastpriorityqueue');

// The private property name to hold a boolean for whether a computed is enqueued.
let _enqueued = Symbol('_enqueued');

// The private property name to hold the priority used in the priority queue.
let _priority = Symbol('_priority');

let queue = new FastPriorityQueue((a, b) => a[_priority] < b[_priority]);
let bundleDepth = 0;
let _seen = [];


/**
 * DepItem is an item in a dependency relationship. It may depend on other DepItems. It is used
 * for subscriptions and computed observables.
 */
class DepItem {
  /**
   * Callback should call depItem.useDep(dep) for each DepInput it depends on.
   */
  constructor(callback, optContext) {
    this[_priority] = 0;
    this[_enqueued] = false;
    this._callback = callback;
    this._context = optContext;
  }

  /**
   * Mark depItem as a dependency of this DepItem. The argument may be null to indicate a leaf (an
   * item such as a plain observable, which does not itself depend on anything else).
   */
  useDep(depItem) {
    let p = depItem ? depItem[_priority] : 0;
    if (p >= this[_priority]) {
      this[_priority] = p + 1;
    }
  }

  /**
   * Recompute this DepItem, calling the callback given in the constructor.
   */
  recompute() {
    this[_priority] = 0;
    this._callback.call(this._context);
  }

  /**
   * Add this DepItem to the queue, to be recomputed when the time is right.
   */
  enqueue() {
    if (!this[_enqueued]) {
      this[_enqueued] = true;
      queue.add(this);
    }
  }
}
exports.DepItem = DepItem;


/**
 * Exposed for unittests. Returns the internal priority value of an observable.
 */
function _getPriority(obs) {
  let depItem = obs._getDepItem();
  return depItem ? depItem[_priority] : 0;
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
        let item = queue.poll();
        _seen.push(item);
        item.recompute();
      } while (queue.size > 0);
    } finally {
      // We delay the unsetting of _enqueued flag, to protect against infinite loops when a
      // change to a computed causes it to get enqueued again.
      for (let item of _seen) {
        item[_enqueued] = false;
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
  } finally {
    bundleDepth--;
    compute();
  }
}
exports.bundleChanges = bundleChanges;
