"use strict";

/* global it */

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
 */
function timeit(desc, func, optMsec) {
  if (!process.env.TIMING_TESTS) {
    return;
  }

  let msec = optMsec || 1000;
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
    this.test.title += " (" + usecPerCall.toFixed(2) + " us/call)";
  });
}
exports.timeit = timeit;
