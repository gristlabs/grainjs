"use strict";

/* global describe, before, beforeEach, afterEach, it */

const util = require('../lib/util.js');

const _ = require('lodash');
const assert = require('assert');
const sinon = require('sinon');
const timeit = require('./testutil.js').timeit;

describe('util', function() {
  describe('bind', () => {
    it('should bind args correctly', () => {
      let spy = sinon.spy();
      let boundB = util.bindB(spy, [1,2,3]);
      let boundUB = util.bindUB(spy, [1,2,3]);
      let boundBU = util.bindBU(spy, [1,2,3]);
      boundB("a", "b");    // no arguments are used
      boundUB("a", "b");    // only the first arg is used
      boundBU("a", "b");    // only the first arg is used
      assert.strictEqual(spy.callCount, 3);
      assert.deepEqual(spy.args[0], [1, 2, 3]);
      assert.deepEqual(spy.args[1], ["a", 1, 2, 3]);
      assert.deepEqual(spy.args[2], [1, 2, 3, "a"]);
    });
  });

  let plainBind = {
    bindB: (func, args) => (() => func(...args)),
    bindUB: (func, args) => ((arg) => func(arg, ...args)),
    bindBU: (func, args) => ((arg) => func(...args, arg)),
  };

  ["bindB", "bindUB", "bindBU"].forEach(method => {
    [0,4,8].forEach(argCount => {
      describe(`Timing ${method} with ${argCount} args`, function() {
        let boundFuncPlain, boundFuncOpt, seenArgCount;
        let boundArgs;
        let func = (...args) => {
          seenArgCount = args.length;
        };

        before(() => {
          boundArgs = _.range(argCount);
          boundFuncPlain = plainBind[method](func, boundArgs);
          boundFuncOpt = util[method](func, boundArgs);
        });

        beforeEach(() => {
          seenArgCount = null;
        });

        timeit('call plain', () => {
          boundFuncPlain("a");
        }, 500);

        timeit('call optimized', () => {
          boundFuncOpt("a");
        }, 500, { compareToPrevious: true });

        timeit('bind-call plain', () => {
          plainBind[method](func, boundArgs)("b");
        }, 500);

        timeit('bind-call optimized', () => {
          util[method](func, boundArgs)("b");
        }, 500, { compareToPrevious: true });

        afterEach(() => {
          assert.strictEqual(seenArgCount, argCount + (method === 'bindB' ? 0 : 1));
        });
      });
    });
  });
});
