"use strict";

/* global describe, it */

const binding = require('../lib/binding');
const {computed} = require('../lib/computed');
const {observable} = require('../lib/observable');
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
    ret = binding.subscribe(17, spy);
    assertResetSingleCall(spy, undefined, 17, undefined);
    assert.strictEqual(ret, null);

    let obj = {foo: "bar"};
    ret = binding.subscribe(obj, spy);
    assertResetSingleCall(spy, undefined, obj, undefined);
    assert.strictEqual(ret, null);
  });

  it('should work with an observable', function() {
    let obs = observable();
    let spy = sinon.spy();

    assert.isFalse(obs.hasListeners());
    let sub = binding.subscribe(obs, spy);
    assert.isTrue(obs.hasListeners());

    // Check that the callback was called initially.
    assertResetSingleCall(spy, undefined, undefined, undefined);

    // Check the callback gets called on changes.
    obs.set("Hello");
    assertResetSingleCall(spy, undefined, "Hello", undefined);

    // Check the callback does not get called for unchanged values.
    obs.set("Hello");
    sinon.assert.notCalled(spy);

    obs.set("Hello2");
    assertResetSingleCall(spy, undefined, "Hello2", "Hello");

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
    let sub = binding.subscribe(obs, spy);
    assert.isTrue(obs.hasListeners());

    // Check that the callback was called initially.
    assertResetSingleCall(spy, undefined, 289, undefined);

    // Check the callback gets called on changes.
    tmp.set(5);
    assertResetSingleCall(spy, undefined, 25, 289);

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
    let sub = binding.subscribe(use => { cbSpy(); return use(tmp) * use(tmp); }, spy);
    assert.isTrue(tmp.hasListeners());

    // Check that the callback was called initially.
    assertResetSingleCall(spy, undefined, 289, undefined);
    assertResetSingleCall(cbSpy, undefined);

    // Check the callback gets called on changes.
    tmp.set(5);
    assertResetSingleCall(spy, undefined, 25, 289);
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
    let sub = binding.subscribe(obs, spy);
    assert.strictEqual(obs.getSubscriptionsCount(), 1);

    // Check that the callback was called initially.
    assertResetSingleCall(spy, undefined, 289, undefined);

    // Check the callback gets called on changes.
    tmp(5);
    assertResetSingleCall(spy, undefined, 25, 289);

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
});
