"use strict";

/* global it */

const _ = require('lodash');
const sinon = require('sinon');

const perCallUsec = Symbol('perCallUsec');


/**
 * Assert that the given spy was called once with a certain context and arguments, and resets its
 * history. Also works for stubs.
 */
function assertResetSingleCall(spy, context, ...args) {
  sinon.assert.calledOnce(spy);
  sinon.assert.calledOn(spy, context);
  sinon.assert.calledWithExactly(spy, ...args);
  if (typeof spy.resetHistory === 'function') {
    spy.resetHistory();   // This is the appropriate method for stubs.
  } else {
    spy.reset();
  }
}
exports.assertResetSingleCall = assertResetSingleCall;

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


/**
 * Capture console output in the enclosed function. Usage:
 *
 *    return consoleCapture(['log', 'warn'], messages => {
 *      ...
 *      assert.deepEqual(messages, [...]);
 *    });
 *
 * @param {String} optMethodNames: If given, an array of console's method names to capture.
 *    The method name is always prefixed to the captured messages as "method: ". If omitted,
 *    equivalent to just ['log'].
 *
 * Note that captured messages are an approximation of what console would output: only %s and %d
 * get interpolated in the format string.
 */
function consoleCapture(optMethodNames, bodyFunc) {
  let methodNames = (bodyFunc === undefined ? ['log'] : optMethodNames);
  let func = (bodyFunc === undefined ? optMethodNames : bodyFunc);
  let messages = [];
  methodNames.forEach(m => sinon.stub(console, m).callsFake(
    (...args) => _capture(messages, m, ...args)));
  try {
    return func(messages);
  } finally {
    methodNames.forEach(m => console[m].restore());
  }
}
exports.consoleCapture = consoleCapture;

function _capture(messages, methodName, format, ...args) {
  // Format the message, nice and simple.
  let i = 0;
  if (typeof format == 'string') {
    format = format.replace(/\%s|\%d/g, () => args[i++]);
  }
  let message = methodName + ': ' + format;
  for ( ; i < args.length; i++) {
    message += ' ' + args[i];
  }
  messages.push(message);
}
