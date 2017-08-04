/**
 * Module that allows client-side code to use browser globals (such as `document` or `Node`) in a
 * way that allows those globals to be replaced by mocks in browser-less tests.
 *
 * Usage: to get access to global variables `foo` and `bar`, call:
 *
 *    const G = require('browserGlobals').use('foo', 'bar');
 *
 * and use G.foo and G.bar. Initially, the global `window` object, if present, is the source of
 * the global values.
 *
 * To use a mock of globals in a test, use:
 *
 *    var browserGlobals = require('browserGlobals');
 *    before(function() {
 *      browserGlobals.pushGlobals(mockWindow);    // e.g. jsdom.jsdom(...).defaultView
 *    });
 *    after(function() {
 *      browserGlobals.popGlobals();
 *    });
 */
"use strict";

/* global window */

const last = require('lodash/last');

// A list of all the globals objects created with `use()`.
let allGlobalsRequested = [];

// Start off the globals with the window object, if available.
let globalsToUseStack = [typeof window !== 'undefined' ? window : {}];


/**
 * Get an object of global values for all of the passed-in names. E.g.
 *
 *    const G = require('browserGlobals').use('foo', 'bar');
 *
 * makes G.foo and G.bar available. These will be set to window.foo, window.bar, or their
 * mocks when globals are overridden in tests.
 */
function use(...names) {
  let globalVars = last(globalsToUseStack);
  var obj = {};
  for (let key of names) {
    obj[key] = globalVars[key];
  }
  allGlobalsRequested.push(obj);
  return obj;
}
exports.use = use;


/**
 * Internal helper which updates properties of all globals objects created with get().
 */
function _updateGlobals() {
  let globalVars = last(globalsToUseStack);
  for (let obj of allGlobalsRequested) {
    for (let key of Object.keys(obj)) {
      obj[key] = globalVars[key];
    }
  }
}


/**
 * Replace globals with those from the given object. The previous values can be restored with
 * popGlobals().
 */
function pushGlobals(globals) {
  globalsToUseStack.push(globals);
  _updateGlobals();
}
exports.pushGlobals = pushGlobals;


/**
 * Restore the values of globals set with the previous pushGlobals() call.
 */
function popGlobals() {
  globalsToUseStack.pop();
  _updateGlobals();
}
exports.popGlobals = popGlobals;
