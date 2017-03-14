"use strict";

/* global describe, it */

const observable = require('../lib/observable.js');
const computed = require('../lib/computed.js');

const assert = require('assert');
const sinon = require('sinon');

describe('computed', function() {

  it('should depend on static and dynamic dependencies', function() {
    // Create four observables, and a computed that depends on them statically or dynamically.
    let x = observable("x"),
        y = observable("y"),
        z = observable("z"),
        w = observable("w");
    let spy = sinon.spy();
    let comp = computed(x, y, (x, y, use) => { spy(); return x + y + use(z) + use(w); });

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
    let comp1 = computed(x, (x, c) => x.toUpperCase());
    let comp2 = computed(x, (x, c) => x.toUpperCase(), {
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
    let comp1 = computed(x1, (x1, c) => x1.toUpperCase(), {
      write: v => x1.set(v.toLowerCase())
    });
    let comp2 = computed(x2, {
      read: (x2, c) => x2.toUpperCase(),
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
    let comp1 = computed(arr, (arr, use) => spy1(arr.map(el => use(el)).join(":")));

    let x = observable("x");
    let a = computed(x, x => x + "a");
    let b = computed(x, x => x + "b");
    let c = computed(x, x => x + "c");

    // comp2 simply depends on three dependencies which will all change together.
    let spy2 = sinon.spy(val => val);
    let comp2 = computed(a, b, c, (a, b, c) => spy2([a,b,c].join(":")));
    // TODO: might it be ok to simplify so, and perhaps get rid of static subs?
    // May want performance benchmark to compare performance.
    //let comp2 = computed(use => spy2([use(a),use(b),use(c)].join(":")));

    arr.set([a, b, c]);

    assert.strictEqual(comp1.get(), "xa:xb:xc");
    assert.strictEqual(comp2.get(), "xa:xb:xc");
    assert.deepEqual(spy1.returnValues, ["", "xa:xb:xc"]);
    assert.deepEqual(spy2.returnValues, ["xa:xb:xc"]);

    // Change x, which triggers three dependent observables to change, and should cause a single
    // recomputation of comp.
    x.set("y");
    assert.strictEqual(comp1.get(), "ya:yb:yc");
    // TODO: This does not yet happen!
    //assert.deepEqual(spy1.returnValues, ["", "xa:xb:xc", "ya:yb:yc"]);
    assert.strictEqual(comp2.get(), "ya:yb:yc");
    // TODO: This does not yet happen!
    //assert.deepEqual(spy2.returnValues, ["xa:xb:xc", "ya:yb:yc"]);
    this.skip();
  });

  it('should not cause infinite loops', function() {
    // Create two observables that depend on each other.
    let x = observable("x");
    let y = computed(use => (use(x) || use(z)).toUpperCase());
    let z = computed(use => use(y) + "z");

    assert.strictEqual(y.get(), "X");
    assert.strictEqual(z.get(), "Xz");

    // TODO: This does not yet work!
    //x.set("");
    //assert.strictEqual(y.get(), "XZ");
    //assert.strictEqual(z.get(), "XZz");
    this.skip();
  });

});
