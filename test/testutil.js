"use strict";

/* global it */

const _ = require('lodash');

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
