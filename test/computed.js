"use strict";

/* global describe, before, it */

const observable = require('../lib/observable.js');
const computed = require('../lib/computed.js');

const _ = require('lodash');
const assert = require('assert');
const sinon = require('sinon');
const ko = require('knockout');
const timeit = require('./testutil.js').timeit;

describe('computed', function() {

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
    let comp2 = computed(x, (use, x) => x.toUpperCase(), {
      write: val => x.set(val.toLowerCase())
    });

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


  it('should support options.read argument', function() {
    let x1 = observable("Test");
    let x2 = observable("Test");
    let comp1 = computed(x1, (use, x1) => x1.toUpperCase(), {
      write: v => x1.set(v.toLowerCase())
    });
    let comp2 = computed(x2, {
      read: (use, x2) => x2.toUpperCase(),
      write: v => x2.set(v.toLowerCase())
    });

    // Verify that the read method works.
    assert.strictEqual(comp1.get(), "TEST");
    assert.strictEqual(comp2.get(), "TEST");

    // Verify that write methods work and that the read() is invoked automatically.
    comp1.set("Foo");
    comp2.set("Bar");
    assert.strictEqual(x1.get(), "foo");
    assert.strictEqual(x2.get(), "bar");
    assert.strictEqual(comp1.get(), "FOO");
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
    computed.bundleChanges(() => {
      x.set("x2");
      y.set("y2");
    });
    assert.strictEqual(z1.get(), "x2y2");
    assert.strictEqual(z2.get(), "x2y2");
    assert.deepEqual(spy1.returnValues, ["x2y2"]);
    assert.deepEqual(spy2.returnValues, ["x2y2"]);
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
});
