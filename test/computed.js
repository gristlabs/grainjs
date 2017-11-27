"use strict";

/* global describe, before, it */

const {observable, bundleChanges} = require('../lib/observable');
const {computed} = require('../lib/computed');
const pureComputed = require('../lib/pureComputed');
const _computed_queue = require('../lib/_computed_queue');

const _ = require('lodash');
const assert = require('chai').assert;
const sinon = require('sinon');
const ko = require('knockout');
const timeit = require('./testutil').timeit;

// These test cases are separated and used for both computed() and pureComputed().
function testComputed(computed) {

  it('should depend on static and dynamic dependencies', function() {
    // Create four observables, and a computed that depends on them statically or dynamically.
    let x = observable("x"),
        y = observable("y"),
        z = observable("z"),
        w = observable("w");
    let spy = sinon.spy();
    let comp = computed(x, y, (use, x, y) => { spy(); return x + y + use(z) + use(w); });

    // Ensure it has correct value right after creation.
    assert.strictEqual(comp.get(), "xyzw");
    assert.strictEqual(spy.callCount, 1);

    // Change different observables, and ensure it reacts to them all.
    x.set("X");
    assert.strictEqual(comp.get(), "Xyzw");
    y.set("Y");
    assert.strictEqual(comp.get(), "XYzw");
    z.set("Z");
    assert.strictEqual(comp.get(), "XYZw");
    w.set("W");
    assert.strictEqual(comp.get(), "XYZW");
    assert.strictEqual(spy.callCount, 5);

    // Verify that after disposal, it no longer reacts to dependencies.
    comp.dispose();
    x.set("x");
    y.set("y");
    z.set("z");
    w.set("w");
    assert.strictEqual(spy.callCount, 5);
  });


  it('should subscribe and unsubscribe to dynamic dependencies', function() {
    // Create a computed with conditional dependencies.
    let x = observable(true),
        y = observable("y"),
        z = observable("z");
    let spy = sinon.spy();
    let comp = computed(use => { spy(); return use(x) ? use(y) : use(z); });

    assert.strictEqual(comp.get(), "y");
    assert.strictEqual(spy.callCount, 1);

    // Verify that changes to a non-dependency don't cause a recalculation.
    y.set("Y");
    assert.strictEqual(comp.get(), "Y");
    assert.strictEqual(spy.callCount, 2);
    z.set("Z");
    assert.strictEqual(comp.get(), "Y");
    assert.strictEqual(spy.callCount, 2);   // No new call.

    // Verify that when a dependency changes, the new dependency becomes active.
    x.set(false);
    assert.strictEqual(comp.get(), "Z");
    assert.strictEqual(spy.callCount, 3);
    z.set("Z2");
    assert.strictEqual(comp.get(), "Z2");
    assert.strictEqual(spy.callCount, 4);

    // Verify that when a dependency changes, the old dependency becomes inactive.
    y.set("Y2");
    assert.strictEqual(comp.get(), "Z2");
    assert.strictEqual(spy.callCount, 4);
  });


  it('should support writing when writable', function() {
    let x = observable("Test");
    let comp1 = computed(x, (use, x) => x.toUpperCase());
    let comp2 = computed(x, (use, x) => x.toUpperCase()).onWrite(val => x.set(val.toLowerCase()));

    // Verify that the read method works.
    assert.strictEqual(comp1.get(), "TEST");
    assert.strictEqual(comp2.get(), "TEST");

    // Check that we can't write to a non-writable computed.
    assert.throws(() => comp1.set("Foo"), /non-writable/);
    assert.strictEqual(x.get(), "Test");
    assert.strictEqual(comp1.get(), "TEST");

    // Check that we CAN write to a writable computed.
    comp2.set("Foo");
    assert.strictEqual(x.get(), "foo");
    assert.strictEqual(comp2.get(), "FOO");
    assert.strictEqual(comp1.get(), "FOO");
  });


  it('should support options.read with or without options.write', function() {
    let x1 = observable("Test");
    let x2 = observable("Test");
    let comp1 = computed(x1, (use, x1) => x1.toUpperCase());
    let comp2 = computed(x2, (use, x2) => x2.toUpperCase()).onWrite(v => x2.set(v.toLowerCase()));

    // Verify that the read method works.
    assert.strictEqual(comp1.get(), "TEST");
    assert.strictEqual(comp2.get(), "TEST");

    // Verify that write methods work and that the read() is invoked automatically.
    assert.throws(() => comp1.set("Foo"), /non-writable/);
    comp2.set("Bar");
    assert.strictEqual(x1.get(), "Test");
    assert.strictEqual(x2.get(), "bar");
    assert.strictEqual(comp1.get(), "TEST");
    assert.strictEqual(comp2.get(), "BAR");
  });


  it('should reevaluate once after connected dependencies change', function() {
    // comp2 depends on an array of dependencies. It is same as comp2 below but declared before
    // its (eventual) dependencies to ensure that order of declaration isn't the only factor.
    let arr = observable([]);
    let spy1 = sinon.spy(val => val);
    let comp1 = computed(arr, (use, arr) => spy1(arr.map(el => use(el)).join(":")));

    let x = observable("x");
    let a = computed(x, (use, x) => x + "a");
    let b = computed(x, (use, x) => x + "b");
    let c = computed(x, (use, x) => x + "c");

    // comp2 simply depends on three dependencies which will all change together.
    let spy2 = sinon.spy(val => val);
    let comp2 = computed(a, b, c, (use, a, b, c) => spy2([a,b,c].join(":")));

    // comp3 is similar but uses dynamic subscriptions.
    let spy3 = sinon.spy(val => val);
    let comp3 = computed(use => spy3([use(a),use(b),use(c)].join(":")));

    arr.set([a, b, c]);

    assert.strictEqual(comp1.get(), "xa:xb:xc");
    assert.strictEqual(comp2.get(), "xa:xb:xc");
    assert.strictEqual(comp3.get(), "xa:xb:xc");
    assert.deepEqual(spy1.returnValues, ["", "xa:xb:xc"]);
    assert.deepEqual(spy2.returnValues, ["xa:xb:xc"]);
    assert.deepEqual(spy3.returnValues, ["xa:xb:xc"]);

    // Change x, which triggers three dependent observables to change, and should cause a single
    // recomputation of comp.
    x.set("y");
    assert.strictEqual(comp1.get(), "ya:yb:yc");
    assert.deepEqual(spy1.returnValues, ["", "xa:xb:xc", "ya:yb:yc"]);
    assert.strictEqual(comp2.get(), "ya:yb:yc");
    assert.deepEqual(spy2.returnValues, ["xa:xb:xc", "ya:yb:yc"]);
    assert.strictEqual(comp3.get(), "ya:yb:yc");
    assert.deepEqual(spy3.returnValues, ["xa:xb:xc", "ya:yb:yc"]);
  });

  it('should not cause infinite loops with circular dependencies', function() {
    // Create two observables that depend on each other.
    let x = observable("x"), t = observable("t");
    let y = computed(use => (use(x) || use(z)).toUpperCase());
    let z = computed(use => use(y) + use(t));

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

    // Cause a change to z: z is updated first, and y second, neither is updated more than once.
    t.set("u");
    assert.strictEqual(z.get(), "XTTu");
    assert.strictEqual(y.get(), "XTTU");

    // Set x: y is updated first again, and z second, and y no longer depends on z.
    x.set("a");
    assert.strictEqual(y.get(), "A");
    assert.strictEqual(z.get(), "Au");

    // Check that y no longer depends on z.
    t.set('s');
    assert.strictEqual(z.get(), "As");
    assert.strictEqual(y.get(), "A");   // Unchanged.
  });

  it('should respect bundleChanges', function() {
    let x = observable("x0"), y = observable("y0");
    let spy1 = sinon.spy(val => val);
    let spy2 = sinon.spy(val => val);
    let z1 = computed(use => spy1(use(x) + use(y)));
    let z2 = computed(x, y, (use, x, y) => spy2(x + y));

    // First check that separate updates to x and y cause two updates to the computeds.
    spy1.reset(); spy2.reset();
    x.set("x1");
    y.set("y1");
    assert.strictEqual(z1.get(), "x1y1");
    assert.strictEqual(z2.get(), "x1y1");
    assert.deepEqual(spy1.returnValues, ["x1y0", "x1y1"]);
    assert.deepEqual(spy2.returnValues, ["x1y0", "x1y1"]);

    // Now check that with bundleChanges, there is a single update.
    spy1.reset(); spy2.reset();
    bundleChanges(() => {
      x.set("x2");
      y.set("y2");
    });
    assert.strictEqual(z1.get(), "x2y2");
    assert.strictEqual(z2.get(), "x2y2");
    assert.deepEqual(spy1.returnValues, ["x2y2"]);
    assert.deepEqual(spy2.returnValues, ["x2y2"]);
  });

  let _priority = _computed_queue._getPriority;

  it('should not update internal _priority unnecessarily', function() {
    // Create a computed with static and dynamic dependencies.
    let a = observable("a"), b = observable("b");
    let b2 = computed(b, (use, b) => b.toUpperCase());
    let c = computed(use => use(a) + (use(a).endsWith('.') ? '' : '+' + use(b2)));
    let d = computed(use => use(c).toUpperCase());
    assert.deepEqual([a,b,b2,c,d].map(x => x.get()), ['a', 'b', 'B', 'a+B', 'A+B']);

    // Check that _priorities are sensibly set.
    assert.deepEqual([a,b,b2,c,d].map(x => _priority(x)), [0,0,1,2,3]);

    // Check that on normal recompute, _priorities don't change.
    a.set('x');
    b.set('y');
    assert.deepEqual([a,b,b2,c,d].map(x => x.get()), ['x', 'y', 'Y', 'x+Y', 'X+Y']);
    assert.deepEqual([a,b,b2,c,d].map(x => _priority(x)), [0,0,1,2,3]);

    // Check that when recompute changes dynamic dependencies, priorities may change,
    // and when a dependency's priority changes, dependents may change too.
    a.set('xx.');
    assert.deepEqual([a,b,b2,c,d].map(x => x.get()), ['xx.', 'y', 'Y', 'xx.', 'XX.']);
    assert.deepEqual([a,b,b2,c,d].map(x => _priority(x)), [0,0,1,1,2]);

    a.set('z');
    assert.deepEqual([a,b,b2,c,d].map(x => x.get()), ['z', 'y', 'Y', 'z+Y', 'Z+Y']);
    assert.deepEqual([a,b,b2,c,d].map(x => _priority(x)), [0,0,1,2,3]);

    // Check that in an infinite loop/circular situation, _priorities stay stable.
    // We override a to depend on d, and c will depend on the new a once it's recomputed.
    a = computed(use => 'a' + use(d));
    assert.deepEqual([a,b,b2,c,d].map(x => x.get()), ['aZ+Y', 'y', 'Y', 'z+Y', 'Z+Y']);
    assert.deepEqual([a,b,b2,c,d].map(x => _priority(x)), [4,0,1,2,3]);
    b.set('b');
    assert.deepEqual([a,b,b2,c,d].map(x => x.get()), ['aAZ+Y+B', 'b', 'B', 'aZ+Y+B', 'AZ+Y+B']);
    assert.deepEqual([a,b,b2,c,d].map(x => _priority(x)), [7,0,1,5,6]);
    b.set('u');
    // NOTE: It would be better if such an update didn't cause all circular priorities to
    // increase, but this isn't critical and doesn't seem worth increasing complexity for it.
    assert.deepEqual([a,b,b2,c,d].map(x => x.get()), ['aAAZ+Y+B+U', 'u', 'U', 'aAZ+Y+B+U', 'AAZ+Y+B+U']);
    assert.deepEqual([a,b,b2,c,d].map(x => _priority(x)), [10,0,1,8,9]);
  });

  it('should work for complex dependency graphs', function() {
    // Create a non-trivial dependency graph: an array of computeds, with each depending on the
    // previous one, and all depending on a shared computed, which in turn depends on a single
    // source. And also multiple destination which depend on all the computes in the array.
    let aSpy, arrSpy = [], totSpy = [];
    let aObs = observable("a");
    let aComp = computed(aObs, aSpy = sinon.spy((use, a) => a.toUpperCase()));
    let arrObs = _.range(4).map(i => observable(i));
    let arrComp = [];
    _.range(4).forEach(i => {
      // computeds returning value of the form ":A0", "(A0):A1", etc.
      arrComp[i] = computed(arrSpy[i] = sinon.spy(use =>
        (i > 0 ? "(" + use(arrComp[i-1]) + "):" : ':') + use(aComp) + use(arrObs[i])));
    });
    let totObs = [
      computed(totSpy[0] = sinon.spy(use => _.minBy(arrComp.map(c => use(c)), 'length'))),
      computed(totSpy[1] = sinon.spy(use => _.maxBy(arrComp.map(c => use(c)), 'length'))),
      computed(totSpy[2] = sinon.spy(use => arrComp.map(c => use(c)).join(" "))),
    ];

    let allSpies = [].concat(aSpy, arrSpy, totSpy);
    let allObs = [].concat(aObs, aComp, arrObs, arrComp, totObs);

    // Verify the initial values.
    assert.deepEqual(allObs.map(x => x.get()),
      [ 'a', 'A', /* arrObs */ 0, 1, 2, 3,
        /* arrComp */ ':A0', '(:A0):A1', '((:A0):A1):A2', '(((:A0):A1):A2):A3',
        /* totObs */ ':A0', '(((:A0):A1):A2):A3', ':A0 (:A0):A1 ((:A0):A1):A2 (((:A0):A1):A2):A3',
      ]);
    assert.deepEqual(allObs.map(x => _priority(x)),
      [ 0, 1, /* arrObs */ 0, 0, 0, 0,
        /* arrComp */ 2, 3, 4, 5,
        /* totObs */ 6, 6, 6 ]);
    assert.deepEqual(allSpies.map(x => x.callCount),
      [ 1, 1, 1, 1, 1, 1, 1, 1 ]);

    // Change aObs, on which everything depends.
    aObs.set('u');
    assert.deepEqual(allObs.map(x => x.get()),
      [ 'u', 'U', /* arrObs */ 0, 1, 2, 3,
        /* arrComp */ ':U0', '(:U0):U1', '((:U0):U1):U2', '(((:U0):U1):U2):U3',
        /* totObs */ ':U0', '(((:U0):U1):U2):U3', ':U0 (:U0):U1 ((:U0):U1):U2 (((:U0):U1):U2):U3',
      ]);
    assert.deepEqual(allObs.map(x => _priority(x)),
      [ 0, 1, /* arrObs */ 0, 0, 0, 0,
        /* arrComp */ 2, 3, 4, 5,
        /* totObs */ 6, 6, 6 ]);
    assert.deepEqual(allSpies.map(x => x.callCount),
      [ 2, 2, 2, 2, 2, 2, 2, 2 ]);

    // Change an observable in the middle of arrObs. A subset of values should get recomputed.
    arrObs[2].set(5);
    assert.deepEqual(allObs.map(x => x.get()),
      [ 'u', 'U', /* arrObs */ 0, 1, 5, 3,
        /* arrComp */ ':U0', '(:U0):U1', '((:U0):U1):U5', '(((:U0):U1):U5):U3',
        /* totObs */ ':U0', '(((:U0):U1):U5):U3', ':U0 (:U0):U1 ((:U0):U1):U5 (((:U0):U1):U5):U3',
      ]);
    assert.deepEqual(allObs.map(x => _priority(x)),
      [ 0, 1, /* arrObs */ 0, 0, 0, 0,
        /* arrComp */ 2, 3, 4, 5,
        /* totObs */ 6, 6, 6 ]);
    assert.deepEqual(allSpies.map(x => x.callCount),
      [ 2, 2, 2, 3, 3, 3, 3, 3 ]);

    // Check here also that if we dispose a computed, it no longer updates.
    arrComp[3].dispose();
    arrComp.pop();
    arrObs[2].set(2);
    assert.deepEqual(allObs.map(x => x.get()),
      [ 'u', 'U', /* arrObs */ 0, 1, 2, 3,
        /* arrComp */ ':U0', '(:U0):U1', '((:U0):U1):U2', undefined,
        /* totObs */ ':U0', '((:U0):U1):U2', ':U0 (:U0):U1 ((:U0):U1):U2',
      ]);
    assert.deepEqual(allObs.map(x => x.isDisposed() ? null : _priority(x)),
      [ 0, 1, /* arrObs */ 0, 0, 0, 0,
        /* arrComp */ 2, 3, 4, /* disposed */null,
        /* totObs */ 5, 5, 5 ]);
    assert.deepEqual(allSpies.map(x => x.callCount),
      [ 2, 2, 2, 4, /* not called */3, 4, 4, 4 ]);
  });


  //----------------------------------------------------------------------
  // Timing tests.
  //----------------------------------------------------------------------

  [2, 20].forEach(depCount => {
    describe(`Timing computed with ${depCount} dependencies`, function() {
      // We create a knockout computed, and our own, using dynamic dependencies (as in knockout)
      // as well as using constructor dependencies.

      let koDeps, grDeps1, grDeps2;
      let koComputed, grComputed1, grComputed2;

      before(function() {
        koDeps = _.range(depCount).map(i => ko.observable(i));
        grDeps1 = _.range(depCount).map(i => observable(i));
        grDeps2 = _.range(depCount).map(i => observable(i));

        koComputed = ko.computed(() => koDeps.reduce((sum, d) => sum + d(), 0));

        // grComputed1 uses dynamic dependencies (created using use() callback).
        grComputed1 = computed(use => grDeps1.reduce((sum, d) => sum + use(d), 0));

        // grComputed2 uses static dependencies, specified when the computed is constructed.
        grComputed2 = computed(...grDeps2, (use, ...vals) => vals.reduce((sum, v) => sum + v, 0));
      });

      it('should produce expected values', () => {
        let expValue = depCount * (depCount - 1) / 2;
        assert.strictEqual(koComputed(), expValue);
        assert.strictEqual(grComputed1.get(), expValue);
        assert.strictEqual(grComputed2.get(), expValue);

        koDeps[0](1000);
        grDeps1[0].set(2000);
        grDeps2[0].set(3000);
        assert.strictEqual(koComputed(), expValue + 1000);
        assert.strictEqual(grComputed1.get(), expValue + 2000);
        assert.strictEqual(grComputed2.get(), expValue + 3000);

        koDeps[0](0);
        grDeps1[0].set(0);
        grDeps2[0].set(0);
        assert.strictEqual(koComputed(), expValue);
        assert.strictEqual(grComputed1.get(), expValue);
        assert.strictEqual(grComputed2.get(), expValue);
      });


      timeit("construct ko.computed", () => {
        let c = ko.computed(() => koDeps.reduce((sum, d) => sum + d(), 0));
        c.dispose();
      }, 500);

      timeit("construct computed", () => {
        let c = computed(use => grDeps1.reduce((sum, d) => sum + use(d), 0));
        c.dispose();
      }, 500, { compareToPrevious: true });

      timeit("construct computed with static deps", () => {
        let c = computed(...grDeps2, (use, ...vals) => vals.reduce((sum, v) => sum + v, 0));
        c.dispose();
      }, 500, { compareToPrevious: true });


      timeit("evaluate ko.computed", () => {
        koDeps[0](1000);
        koDeps[0](0);
      }, 500);

      timeit("evaluate computed", () => {
        grDeps1[0].set(2000);
        grDeps1[0].set(0);
      }, 500, { compareToPrevious: true });

      timeit("evaluate computed with static deps", () => {
        grDeps2[0].set(3000);
        grDeps2[0].set(0);
      }, 500, { compareToPrevious: true });
    });
  });
}

describe('computed', function() {
  testComputed(computed);
});

describe('pureComputed active', function() {
  // A pureComputed that has a subscription behaves the same way as a regular computed.
  // So we run the same suite of tests for it.
  function makeActivePureComputed(...args) {
    let c = pureComputed(...args);
    c.addListener(() => {});
    return c;
  }
  testComputed(makeActivePureComputed);
});
