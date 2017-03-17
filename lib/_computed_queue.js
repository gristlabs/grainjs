/**
 * This module supports computed observables, organizing them into a priority queue, so that
 * computeds can be updated just once after multiple bundled changes.
 *
 * This module for internal use only (hence the leading underscore in the name). The only function
 * useful to outside code is exposed via the `computed` module as `computed.bundleChanges()`.
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

let queue = new FastPriorityQueue((a, b) => a._priority < b._priority);
let bundleDepth = 0;
let _seen = [];

// The private property name to hold a boolean for whether a computed is enqueued.
let _enqueued = Symbol('_enqueued');

/**
 * Update any computed observables that need updating. The update is deferred if we are currently
 * in the middle of a bundle. This is called automatically whenever you set an observable, and
 * there should be no need to ever call this by users of the library.
 */
function compute() {
  if (bundleDepth === 0 && queue.size > 0) {
    // Prevent compute() calls, which are unnecessary and can cause deep recursion stack.
    bundleDepth++;
    try {
      // We reuse _seen array to minimize allocations, but always leave it empty.
      do {
        let compObs = queue.poll();
        _seen.push(compObs);
        compObs.recompute();
      } while (queue.size > 0);
    } finally {
      // We delay the unsetting of _enqueued flag, to protect against infinite loops when a
      // change to a computed causes it to get enqueued again.
      for (let compObs of _seen) {
        compObs[_enqueued] = false;
      }
      _seen.length = 0;
      bundleDepth--;
    }
  }
}
exports.compute = compute;

/**
 * Defer recomputations of all computed observables until func() returns. This is useful to avoid
 * unnecessary recomputation if you are making several changes to observables together.
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


/**
 * Add a computed observable to the queue, to be recomputed when the time is right.
 */
function enqueue(computedObs) {
  if (!computedObs[_enqueued]) {
    computedObs[_enqueued] = true;
    queue.add(computedObs);
  }
}
exports.enqueue = enqueue;
