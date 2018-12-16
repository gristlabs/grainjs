"use strict";

/* global it */

const assert = require('chai').assert;
const _ = require('lodash');
const mocha = require('mocha');

const perCallUsec = Symbol('perCallUsec');

/**
 * Times a single call of func in microseconds, wrapping it in an `it(desc, ...)` call, with
 * timing info appended to the test's title. The test takes between msec/2 and msec to run.
 *
 * Such a test is ONLY generated when process.env.TIMING_TESTS environment variable is truthy
 * (i.e. non-empty string).
 *
 * @param {String} desc: Test description, to which " (X.XX us/call)" will be appended.
 * @param {Function} func: Function to time.
 * @param {Number} optMsec: optional number of milliseconds to limit the test to; 1000 by default.
 * @param {Boolean} options.compareToPrevious: Report percentage change from the previous test
 *    case, which must also use timeit().
 */
function timeit(desc, func, optMsec, options) {
  if (!process.env.TIMING_TESTS) {
    return;
  }

  if (!options && _.isPlainObject(optMsec)) {
    options = optMsec;
    optMsec = undefined;
  }
  let msec = optMsec || 1000;
  options = options || {};

  // The implementation runs func() many times, doubling the interval between checking time. This
  // way, time measurement is done logarithmic number of times compared to the function call, and
  // has a negligible effect on the result.
  it(desc, function() {
    this.slow(msec);
    let start = Date.now();
    let delta = 0;
    for (var n = 1; n < 1<<30; n = n * 2) {
      for (let i = 0; i < n; i++) {
        func();
      }
      delta = Date.now() - start;
      if (delta > msec / 2) {
        break;
      }
    }
    let numCalls = n * 2 - 1;    // 1 + 2 + 4 + 8 + ... + n is (2n-1)
    let usecPerCall = delta * 1000 / numCalls;
    this.test.title += ` (${usecPerCall.toFixed(2)} us/call, ${numCalls} calls)`;
    this.test[perCallUsec] = usecPerCall;

    if (options.compareToPrevious) {
      let i = this.test.parent.tests.indexOf(this.test);
      let prevTestTiming = i > 0 ? this.test.parent.tests[i - 1][perCallUsec] : null;
      if (prevTestTiming) {
        let fasterBy = (1 - usecPerCall / prevTestTiming) * 100;
        if (fasterBy >= 0) {
          this.test.title += ` (faster by ${fasterBy.toFixed(1)}%)`;
        } else {
          this.test.title += ` (slower by ${-fasterBy.toFixed(1)}%)`;
        }
      } else {
        this.test.title += " (can't compare to previous)";
      }
    }
  });
}
exports.timeit = timeit;


function sleep(ms) {
  return new Promise((resolve, reject) => { setTimeout(resolve, ms); });
}

/**
 * Returns a Promise for memory usage. Calls gc() twice with some delays in the hope of getting a
 * more reliable measurement.
 */
function getMemUsage() {
  return Promise.resolve()
  .then(() => { gc(); return sleep(10); })
  .then(() => { gc(); return sleep(10); })
  .then(() => process.memoryUsage().heapUsed);
}

/**
 * Measure average per-call memory usage for N calls of some function, to detect memory leaks
 * or understand when values can be garbage-collected.
 *
 * Specifically, calls steps (which are all optional):
 *    1. spec.before()
 *    2. spec.createItem(index) [N times]
 *    3. spec.destroyItem(item) [N times]
 *    4. spec.after()
 * and returns a Promise for the object with per-item deltas in memory usage:
 *    {
 *      bytesCreated,       // delta between steps 1 and 2
 *      bytesDestroyed,     // delta between steps 1 and 3
 *      bytesAtFinish,      // delta between steps 1 and 4
 *    }
 *
 * If spec.test is given, it should be currently running test case (this.test), whose title will
 * be modified to include per-item memory usage.
 *
 * Note that it is far from precise and may easily be slightly negative, but for large number of
 * objects, it should approach a meaningful number.
 *
 * NOTE: this require mocha to be run with -gc flag, as it runs gc() for better measurements. To
 * skip tests in the absence of -gc option rather than error, use skipWithoutGC() helper.
 */
function measureMemoryUsage(N, spec) {
  /* global gc */
  if (typeof gc === 'undefined') {
    throw new Error('No global "gc"; mocha should be run with -gc flag.');
  }
  // Measure things twice, returning just the second measurement, which seems to reduce unexpected
  // memory effects when new code first runs.
  return _measureMemoryUsageImpl(N, spec)
  .then(() => _measureMemoryUsageImpl(N, spec))
  .then((memUsage) => {
    if (spec.test) {
      assert.isBelow(memUsage.bytesAtFinish, 8);
      const extra = memUsage.bytesDestroyed < 8 ? "" : `, ${memUsage.bytesDestroyed} leaked`;
      spec.test.title += ` [MEM ${memUsage.bytesCreated} bytes/item${extra}]`;
    }
    return memUsage;
  });
}
exports.measureMemoryUsage = measureMemoryUsage;


function _measureMemoryUsageImpl(N, spec) {
  let { before = _.noop, after = _.noop, createItem = _.noop, destroyItem = _.noop } = spec;
  let bytesAtStart, bytesCreated, bytesDestroyed, bytesAtFinish;
  let items = _.times(N, () => null);
  return Promise.resolve()
  .then(() => {
    before();
    return getMemUsage();
  })
  .then(value => {
    bytesAtStart = value;
    for (let i = 0; i < N; i++) {
      items[i] = createItem(i);
    }
    return getMemUsage();
  })
  .then(value => {
    bytesCreated = value;
    for (let i = 0; i < N; i++) {
      destroyItem(items[i]);
      items[i] = null;
    }
    return getMemUsage();
  })
  .then(value => {
    bytesDestroyed = value;
    after();
    return getMemUsage();
  })
  .then(value => {
    bytesAtFinish = value;
    return {
      bytesCreated: Math.ceil((bytesCreated - bytesAtStart) / N + 1) - 1,
      bytesDestroyed: Math.ceil((bytesDestroyed - bytesAtStart) / N + 1) - 1,
      bytesAtFinish: Math.ceil((bytesAtFinish - bytesAtStart) / N + 1) - 1,
    };
  });
}

/**
 * If a test can only run with -gc flag (such as those using measureMemoryUsage()), you can skip
 * it, rather than error out, by calling skipWithoutGC(this) at the start of the test case, or in
 * a before() handler.
 */
function skipWithoutGC(context) {
  if (typeof gc === 'undefined') {
    if (!(context instanceof mocha.Context)) {
      throw new Error('skipWithoutGC should be called from before() or inside of it()');
    }
    if (context.test.type === 'test') {
      context.test.title += ' [requires -gc]';
    } else if (context.test.type === 'hook') {
      context.test.parent.tests.forEach(t => t.title += ' [requires -gc]');
    }
    context.skip();
  }
}
exports.skipWithoutGC = skipWithoutGC;
