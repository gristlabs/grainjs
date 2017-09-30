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
 * Makes N calls to createItem(index), saving their return values, and then calls
 * destroyItem(item) for each of them, and finally finish(). Measures memory usage, and returns a
 * Promise for:
 *      { bytesCreated, bytesDestroyed, bytesAtFinish }
 * containing per-object bytes, computed from delta of memory usage.
 *
 * Note that it is far from precise and may easily be slightly negative, but for large number of
 * objects, it should approach something a meaningful number.
 *
 * NOTE: this require mocha to be run with -gc flag, as it runs gc() for better measurements. Use
 * skipWithoutGC() to skip a test case or suite, rather than error out, when -gc is missing.
 */
function measureMemoryUsage(N, createItem, destroyItem, finish) {
  /* global gc */
  if (typeof gc === 'undefined') {
    throw new Error('No global "gc"; mocha should be run with -gc flag.');
  }
  // Measure things twice, returning just the second measurement, which seems to reduce unexpected
  // memory effects when new code first runs.
  return _measureMemoryUsageImpl(N, createItem, destroyItem, finish)
  .then(() => _measureMemoryUsageImpl(N, createItem, destroyItem, finish));
}
exports.measureMemoryUsage = measureMemoryUsage;


function _measureMemoryUsageImpl(N, createItem, destroyItem, finish) {
  let bytesAtStart, bytesCreated, bytesDestroyed, bytesAtFinish;
  let items = _.times(N, () => null);
  return getMemUsage()
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
    finish();
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
    if (context.test.type === 'test') {
      context.test.title += ' [requires -gc]';
    } else if (context.test.type === 'hook') {
      context.test.parent.tests.forEach(t => t.title += ' [requires -gc]');
    }
    context.skip();
  }
}
exports.skipWithoutGC = skipWithoutGC;
