"use strict";

/* global describe, it */

const {observable, bundleChanges} = require('../../lib/observable');
const {computed} = require('../../lib/computed');
const {subscribe} = require('../../lib/subscribe');

const assert = require('chai').assert;
const sinon = require('sinon');

describe('subscribe', function() {
  // Note that the `subscribe` module is also tested implicitly by the more comprehensive
  // `computed` test.

  it('should depend on static and dynamic dependencies', function() {
    // Create a few observables, a computed, and and a subscription that depends on them
    // statically or dynamically.
    let x = observable('x'),
        y = observable('y'),
        z = observable('z'),
        w = observable('w'),
        cy = computed(use => 'c' + use(y));
    let spy = sinon.spy();
    let sub = subscribe(x, y, (use, x, y) => spy(x, y, use(cy), use(z), use(z) && use(w)));

    // Check it got called immediately.
    assert.deepEqual(spy.args, [['x', 'y', 'cy', 'z', 'w']]);
    spy.resetHistory();

    // Change different observables, and ensure it reacts to each change.
    x.set('X');
    y.set('Y');
    z.set('Z');
    w.set('W');
    assert.deepEqual(spy.args, [
      ['X', 'y', 'cy', 'z', 'w'],
      ['X', 'Y', 'cY', 'z', 'w'],
      ['X', 'Y', 'cY', 'Z', 'w'],
      ['X', 'Y', 'cY', 'Z', 'W'],
    ]);
    spy.resetHistory();

    // Check that a set() call that causes no change, does not triggers the subscription callback.
    x.set('X');
    y.set('Y');
    assert.deepEqual(spy.args, []);

    // Cause a dynamic subscription to be dropped and check that it no longer listens to it.
    z.set('');
    assert.deepEqual(spy.args, [['X', 'Y', 'cY', '', '']]);
    w.set('world');
    assert.deepEqual(spy.args, [['X', 'Y', 'cY', '', '']]);   // no new call.

    // Check that when the dynamic subscription is re-added, it triggers callback again.
    z.set('hello');
    assert.deepEqual(spy.args, [['X', 'Y', 'cY', '', ''],
                                ['X', 'Y', 'cY', 'hello', 'world']]);
    w.set('WORLD');
    assert.deepEqual(spy.args, [['X', 'Y', 'cY', '', ''],
                                ['X', 'Y', 'cY', 'hello', 'world'],
                                ['X', 'Y', 'cY', 'hello', 'WORLD']]);
    spy.resetHistory();

    // Check that for bundled changes, subscription is only called once.
    bundleChanges(() => {
      x.set('x');
      y.set('y');
      z.set('z');
      w.set('w');
    });
    y.set('Y');
    assert.deepEqual(spy.args, [['x', 'y', 'cy', 'z', 'w'],
                                ['x', 'Y', 'cY', 'z', 'w']]);
    spy.resetHistory();

    // Verify that after disposal, it no longer reacts to dependencies.
    sub.dispose();
    x.set("x0");
    y.set("y0");
    z.set("z0");
    w.set("w0");
    assert.deepEqual(spy.args, []);
  });
});
