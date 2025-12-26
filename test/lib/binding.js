"use strict";

/* global describe, it */
/* eslint-disable @stylistic/max-statements-per-line */

const binding = require('../../lib/binding');
const {computed} = require('../../lib/computed');
const {bundleChanges, observable} = require('../../lib/observable');
const { assertResetSingleCall } = require('./testutil2');

const assert = require('chai').assert;
const sinon = require('sinon');
const ko = require('knockout');

describe('binding', function() {
  // Note that the `subscribe` module is also tested implicitly by the more comprehensive
  // `computed` test.

  it('should work with a plain value', function() {
    let spy = sinon.spy();
    let ret;
    ret = binding.subscribeBindable(17, spy);
    assertResetSingleCall(spy, undefined, 17);
    assert.strictEqual(ret, null);

    let obj = {foo: "bar"};
    ret = binding.subscribeBindable(obj, spy);
    assertResetSingleCall(spy, undefined, obj);
    assert.strictEqual(ret, null);
  });

  it('should work with an observable', function() {
    let obs = observable();
    let spy = sinon.spy();

    assert.isFalse(obs.hasListeners());
    let sub = binding.subscribeBindable(obs, spy);
    assert.isTrue(obs.hasListeners());

    // Check that the callback was called initially.
    assertResetSingleCall(spy, undefined, undefined);

    // Check the callback gets called on changes.
    obs.set("Hello");
    assertResetSingleCall(spy, undefined, "Hello");

    // Check the callback does not get called for unchanged values.
    obs.set("Hello");
    sinon.assert.notCalled(spy);

    obs.set("Hello2");
    assertResetSingleCall(spy, undefined, "Hello2");

    // Check the callback does not get called after disposal.
    sub.dispose();
    assert.isFalse(obs.hasListeners());
    obs.set("Bye");
    sinon.assert.notCalled(spy);
  });

  it('should work with an computed', function() {
    let tmp = observable(17);
    let obs = computed(use => use(tmp) * use(tmp));
    let spy = sinon.spy();

    assert.isFalse(obs.hasListeners());
    let sub = binding.subscribeBindable(obs, spy);
    assert.isTrue(obs.hasListeners());

    // Check that the callback was called initially.
    assertResetSingleCall(spy, undefined, 289);

    // Check the callback gets called on changes.
    tmp.set(5);
    assertResetSingleCall(spy, undefined, 25);

    // Check the callback does not get called for unchanged values.
    tmp.set(-5);
    sinon.assert.notCalled(spy);

    // Check the callback does not get called after disposal.
    sub.dispose();
    assert.isFalse(obs.hasListeners());
    tmp.set(10);
    assert.strictEqual(obs.get(), 100);
    sinon.assert.notCalled(spy);

    // Not quite related, but check that hasListeners works for a dependency of a computed.
    assert.isTrue(tmp.hasListeners());
    obs.dispose();
    assert.isFalse(tmp.hasListeners());
  });

  it('should work with a function', function() {
    // This is very similar to the test case for a computed, but the computed is hidden.
    let tmp = observable(17);
    let spy = sinon.spy();
    let cbSpy = sinon.spy();

    assert.isFalse(tmp.hasListeners());
    let sub = binding.subscribeBindable(use => { cbSpy(); return use(tmp) * use(tmp); }, spy);
    assert.isTrue(tmp.hasListeners());

    // Check that the callback was called initially.
    assertResetSingleCall(spy, undefined, 289);
    assertResetSingleCall(cbSpy, undefined);

    // Check the callback gets called on changes.
    tmp.set(5);
    assertResetSingleCall(spy, undefined, 25);
    assertResetSingleCall(cbSpy, undefined);

    // Check the callback does not get called for unchanged values, but the value function does.
    tmp.set(-5);
    sinon.assert.notCalled(spy);
    assertResetSingleCall(cbSpy, undefined);

    // Check the callback does not get called after disposal.
    sub.dispose();
    assert.isFalse(tmp.hasListeners());
    tmp.set(13);
    sinon.assert.notCalled(spy);
    sinon.assert.notCalled(cbSpy);
  });

  it('should work with a knockout computed', function() {
    let tmp = ko.observable(17);
    let obs = ko.computed(() => tmp() * tmp());
    let spy = sinon.spy();

    assert.strictEqual(obs.getSubscriptionsCount(), 0);
    let sub = binding.subscribeBindable(obs, spy);
    assert.strictEqual(obs.getSubscriptionsCount(), 1);

    // Check that the callback was called initially.
    assertResetSingleCall(spy, undefined, 289);

    // Check the callback gets called on changes.
    tmp(5);
    assertResetSingleCall(spy, undefined, 25);

    // Check the callback does not get called for unchanged values.
    tmp(-5);
    sinon.assert.notCalled(spy);

    // Check the callback does not get called after disposal.
    sub.dispose();
    assert.strictEqual(obs.getSubscriptionsCount(), 0);
    tmp(10);
    assert.strictEqual(obs.peek(), 100);
    sinon.assert.notCalled(spy);
  });

  it('should respect bundleChanges', function() {
    const obs1 = observable("a");
    const obs2 = observable("b");
    const spy1 = sinon.spy();
    const spy2 = sinon.spy();
    const sub1 = binding.subscribeBindable(obs1, (val1) => spy1(val1 + obs2.get()));
    const sub2 = binding.subscribeBindable((use) => use(obs1), (val1) => spy2(val1 + obs2.get()));

    // Check that the callbacks were called initially.
    assertResetSingleCall(spy1, undefined, "ab");
    assertResetSingleCall(spy2, undefined, "ab");

    bundleChanges(() => { obs1.set("A"); obs2.set("B"); });

    // If bundleChanges were not respected, we'd see "Ab" for spy1.
    assertResetSingleCall(spy1, undefined, "AB");
    assertResetSingleCall(spy2, undefined, "AB");
    sub1.dispose();
    sub2.dispose();
    bundleChanges(() => { obs1.set("C"); obs2.set("D"); });
    sinon.assert.notCalled(spy1);
    sinon.assert.notCalled(spy2);
  });

  it('should respect implicit bundling of changes', function() {
    const obs = observable('a');
    const obs1 = computed((use) => use(obs) + '1');
    const obs2 = computed((use) => use(obs) + '2');
    const spy1 = sinon.spy();
    const spy2 = sinon.spy();
    const sub1 = binding.subscribeBindable(obs1, () => spy1(obs1.get() + obs2.get()));
    const sub2 = binding.subscribeBindable(obs2, () => spy2(obs1.get() + obs2.get()));
    assertResetSingleCall(spy1, undefined, "a1a2");
    assertResetSingleCall(spy2, undefined, "a1a2");
    obs.set("x");
    assertResetSingleCall(spy1, undefined, "x1x2");
    assertResetSingleCall(spy2, undefined, "x1x2");
    sub1.dispose();
    sub2.dispose();
    obs.set("y");
    sinon.assert.notCalled(spy1);
    sinon.assert.notCalled(spy2);
  });
});
