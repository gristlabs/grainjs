"use strict";

/* global describe, before, beforeEach, afterEach, it */

const util = require('../lib/util');

const _ = require('lodash');
const assert = require('chai').assert;
const sinon = require('sinon');
const timeit = require('./testutil').timeit;

describe('util', function() {

  describe('bind', () => {
    it('should bind args correctly', () => {
      for (let n = 0; n < 50; n++) {
        let spy = sinon.spy();
        let values = _.range(n);
        let boundB = util.bindB(spy, values);
        let boundUB = util.bindUB(spy, values);
        let boundBU = util.bindBU(spy, values);
        boundB("a", "b");
        boundUB("a", "b");
        boundBU("a", "b");
        assert.strictEqual(spy.callCount, 3);
        assert.deepEqual(spy.args[0], values);
        assert.deepEqual(spy.args[1], ["a"].concat(values));
        assert.deepEqual(spy.args[2], [].concat(values, "a"));
      }
    });
  });

  let plainBind = {
    bindB: (func, args) => (() => func(...args)),
    bindUB: (func, args) => ((arg) => func(arg, ...args)),
    bindBU: (func, args) => ((arg) => func(...args, arg)),
  };

  ["bindB", "bindUB", "bindBU"].forEach(method => {
    [0,4,9].forEach(argCount => {
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
