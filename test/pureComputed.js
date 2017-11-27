"use strict";

/* global describe, it, before */

const assert = require('chai').assert;
const sinon = require('sinon');
const {observable} = require('../lib/observable');
const {computed} = require('../lib/computed');
const pureComputed = require('../lib/pureComputed');
const testutil = require('./testutil');


describe('pureComputed', function() {

  // NOTE: a pureComputed() with a subscriber is nearly identical to a computed(), and in fact all
  // tests for a computed() ALSO get run for pureComputed(), in test/computed.js. This file
  // includes additional tests for behavior specific to pureComputed.

  it('should evaluate correctly when inactive', function() {
    let spyB, spyC, spyD;
    let a = observable("a"),
        b = pureComputed(spyB = sinon.spy(use => use(a).toUpperCase())),
        c = computed(spyC = sinon.spy(use => '(' + use(a) + ')')),
        d = pureComputed(b, spyD = sinon.spy((use, b) => use(a) + b + use(c)));
    let allObs = [a, b, c, d];
    let allSpies = [spyB, spyC, spyD];

    assert.deepEqual(allSpies.map(x => x.callCount), [0, 1, 0]);
    assert.deepEqual(allObs.map(x => x.get()), ['a', 'A', '(a)', 'aA(a)']);
    assert.deepEqual(allSpies.map(x => x.callCount), [2, 1, 1]);

    // Each call to .get() increases call counts for pureComputed (but not for regular computed).
    assert.deepEqual(allObs.map(x => x.get()), ['a', 'A', '(a)', 'aA(a)']);
    assert.deepEqual(allSpies.map(x => x.callCount), [4, 1, 2]);

    // Changing a dependency doesn't trigger a computation for inactive pureComputed, but they are
    // recomputed on .get().
    a.set('b');
    assert.deepEqual(allSpies.map(x => x.callCount), [4, 2, 2]);
    assert.deepEqual(allObs.map(x => x.get()), ['b', 'B', '(b)', 'bB(b)']);
    assert.deepEqual(allSpies.map(x => x.callCount), [6, 2, 3]);

    // Once there is a subscriber, things change.
    let lis = d.addListener(() => {});
    assert.deepEqual(allSpies.map(x => x.callCount), [7, 2, 4]);
    assert.deepEqual(allObs.map(x => x.get()), ['b', 'B', '(b)', 'bB(b)']);
    assert.deepEqual(allSpies.map(x => x.callCount), [7, 2, 4]);

    // Now changing a dependency updates everything immediately.
    a.set('c');
    assert.deepEqual(allSpies.map(x => x.callCount), [8, 3, 5]);
    assert.deepEqual(allObs.map(x => x.get()), ['c', 'C', '(c)', 'cC(c)']);
    assert.deepEqual(allSpies.map(x => x.callCount), [8, 3, 5]);

    // Once no more subscriber, we go back to normal.
    lis.dispose();
    assert.deepEqual(allObs.map(x => x.get()), ['c', 'C', '(c)', 'cC(c)']);
    assert.deepEqual(allSpies.map(x => x.callCount), [10, 3, 6]);
  });

  it('should not cause infinite loops with circular dependencies', function() {
    // Create two observables that depend on each other.
    let x = observable("x"), t = observable("t");
    let y = pureComputed(use => (use(x) || use(z)).toUpperCase());
    let z = pureComputed(use => use(y) + use(t));

    assert.strictEqual(y.get(), "X");
    assert.strictEqual(z.get(), "Xt");

    x.set("");
    assert.strictEqual(y.get(), "XT");
    assert.strictEqual(z.get(), "XTt");
    // Note that although y depends on z, it does not get updated more than once.

    // Another change to x: y picks up z's new value, but again is only updated once.
    x.set(false);
    assert.strictEqual(y.get(), "XTT");
    assert.strictEqual(z.get(), "XTTt");

    // Cause a change to z: z is updated first, and y second. This differs a bit from non-pure
    // case. Here, evaluation of z triggers evaluation of y first.
    t.set("u");
    assert.strictEqual(z.get(), "XTTTu");
    assert.strictEqual(y.get(), "XTTTU");

    // Set x: y is updated first again, and z second, and y no longer depends on z.
    x.set("a");
    assert.strictEqual(y.get(), "A");
    assert.strictEqual(z.get(), "Au");

    // Check that y no longer depends on z.
    t.set('s');
    assert.strictEqual(z.get(), "As");
    assert.strictEqual(y.get(), "A");   // Unchanged.
  });
});


describe('pureComputed memory', function() {
  this.timeout(30000);
  before(function() { testutil.skipWithoutGC(this); });

  it('should not leak memory as computeds do', function() {
    let obs;
    return testutil.measureMemoryUsage(10000, {
      before: () => { obs = observable(1); },
      createItem: (i) => computed(use => use(obs)),
      after: () => { obs = null; }
    })
    .then(ret => {
      assert.isAbove(ret.bytesCreated, 200);
      assert.isAbove(ret.bytesDestroyed, 200);
      assert.closeTo(ret.bytesAtFinish, 0, 5);
    })
    .then(() => testutil.measureMemoryUsage(10000, {
      before: () => { obs = observable(1); },
      createItem: (i) => pureComputed(use => use(obs)),
      after: () => { obs = null; }
    }))
    .then(ret => {
      assert.isAbove(ret.bytesCreated, 200);
      assert.closeTo(ret.bytesDestroyed, 0, 5);
      assert.closeTo(ret.bytesAtFinish, 0, 5);
    });
  });

  it('should not leak memory after last unsubscribe', function() {
    let obs, cb = () => {};
    return testutil.measureMemoryUsage(10000, {
      before: () => { obs = observable(1); },
      createItem: (i) => { let c = pureComputed(use => use(obs)); return c.addListener(cb); },
      after: () => { obs = null; }
    })
    .then(ret => {
      assert.isAbove(ret.bytesCreated, 200);
      assert.isAbove(ret.bytesDestroyed, 200);
      assert.closeTo(ret.bytesAtFinish, 0, 5);
    })
    .then(() => testutil.measureMemoryUsage(10000, {
      before: () => { obs = observable(1); },
      createItem: (i) => { let c = pureComputed(use => use(obs)); return c.addListener(cb); },
      destroyItem: lis => lis.dispose(),
      after: () => { obs = null; }
    }))
    .then(ret => {
      assert.isAbove(ret.bytesCreated, 200);
      assert.closeTo(ret.bytesDestroyed, 0, 5);
      assert.closeTo(ret.bytesAtFinish, 0, 5);
    });
  });
});
