"use strict";

/* global describe, it */

const {observable} = require('../lib/observable');
const { assertResetSingleCall } = require('./testutil');

const assert = require('assert');
const sinon = require('sinon');

describe('observable', function() {

  it("should maintain a value", function() {
    // Test that initial value is set as expected, and can be retrieved.
    let obs1 = observable();
    let obs2 = observable("test1");
    assert.strictEqual(obs1.get(), undefined);
    assert.strictEqual(obs2.get(), "test1");

    // Test that we can set a new value, and that it is seen.
    obs1.set(17);
    obs2.set("test2");
    assert.strictEqual(obs1.get(), 17);
    assert.strictEqual(obs2.get(), "test2");

    // After an observable is disposed, it should discard its reference to the value.
    obs1.dispose();
    obs2.dispose();
    assert.strictEqual(obs1.get(), undefined);
    assert.strictEqual(obs2.get(), undefined);
  });

  it("should call listeners when the value changes", function() {
    let obs = observable("test1");
    let spy1 = sinon.spy(), spy2 = sinon.spy(), spy3 = sinon.spy();

    let lis1 = obs.addListener(spy1);
    sinon.assert.notCalled(spy1);

    // If the value doesn't change, the listener shouldn't get called.
    obs.set("test1");
    sinon.assert.notCalled(spy1);

    // If the value does change, the listener should get called with new and old values.
    obs.set("hello world");
    sinon.assert.calledOnce(spy1);
    sinon.assert.calledWithExactly(spy1, "hello world", "test1");
    spy1.reset();

    // When there are multiple listeners, all should get called.
    obs.addListener(spy2);
    obs.addListener(spy3);
    sinon.assert.notCalled(spy1);
    sinon.assert.notCalled(spy2);
    sinon.assert.notCalled(spy3);
    obs.set("test2");
    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
    sinon.assert.calledOnce(spy3);
    sinon.assert.calledWithExactly(spy1, "test2", "hello world");
    sinon.assert.calledWithExactly(spy2, "test2", "hello world");
    sinon.assert.calledWithExactly(spy3, "test2", "hello world");
    assert(spy1.calledBefore(spy2));
    assert(spy2.calledBefore(spy3));

    // Another test that no-change update does not call listeners.
    obs.set("test2");
    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
    sinon.assert.calledOnce(spy3);

    // When one listener is disposed, the rest should stay subscribed.
    lis1.dispose();
    obs.set("test3");
    sinon.assert.calledOnce(spy1);
    sinon.assert.calledTwice(spy2);
    sinon.assert.calledTwice(spy3);
    spy2.getCall(1).calledWithExactly("test3", "test2");
    spy3.getCall(1).calledWithExactly("test3", "test2");

    // Once the observable is disposed, it should no longer work, and should not call listeners.
    obs.dispose();
    assert.throws(() => obs.set("test4"));
    sinon.assert.calledOnce(spy1);
    sinon.assert.calledTwice(spy2);
    sinon.assert.calledTwice(spy3);
  });

  it("should call callbacks set with setListenerChangeCB", function() {
    let obs = observable("test1");
    let spy1 = sinon.spy(), spy2 = sinon.spy(), spyChange = sinon.spy();

    assert.strictEqual(obs.hasListeners(), false);

    // Test that hasListeners() works on its own.
    let lis1 = obs.addListener(spy1);
    assert.strictEqual(obs.hasListeners(), true);
    lis1.dispose();
    assert.strictEqual(obs.hasListeners(), false);
    sinon.assert.notCalled(spy1);

    // Test setListenerChangeCB.
    obs.setListenerChangeCB(spyChange);

    lis1 = obs.addListener(spy1);
    assertResetSingleCall(spyChange, undefined, true);
    assert.strictEqual(obs.hasListeners(), true);

    let lis2 = obs.addListener(spy2);
    assertResetSingleCall(spyChange, undefined, true);
    assert.strictEqual(obs.hasListeners(), true);

    lis1.dispose();
    assertResetSingleCall(spyChange, undefined, true);
    assert.strictEqual(obs.hasListeners(), true);

    lis2.dispose();
    assertResetSingleCall(spyChange, undefined, false);
    assert.strictEqual(obs.hasListeners(), false);

    // Check that it can be unset.
    obs.setListenerChangeCB(null);
    lis1 = obs.addListener(spy1);
    sinon.assert.notCalled(spyChange);
    assert.strictEqual(obs.hasListeners(), true);
  });
});
