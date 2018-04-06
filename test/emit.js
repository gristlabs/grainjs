"use strict";

/* global describe, before, it */

const emit = require('../lib/emit');
const { assertResetSingleCall } = require('./testutil2');

const assert = require('chai').assert;
const sinon = require('sinon');
const timeit = require('./testutil').timeit;

describe('emitter.Emitter', function() {

  it("should call subscribed listeners", function() {
    let emitter = new emit.Emitter();
    let obj = {};
    let spy1 = sinon.spy(), spy2 = sinon.spy(), spy3 = sinon.spy();
    let lis1 = emitter.addListener(spy1);
    let lis2 = emitter.addListener(spy2, obj);

    emitter.emit("hello", 1, obj);

    assert(spy1.calledBefore(spy2));
    assertResetSingleCall(spy1, undefined, "hello", 1, obj);
    assertResetSingleCall(spy2, obj, "hello", 1, obj);
    sinon.assert.notCalled(spy3);

    let lis3 = emitter.addListener(spy3);
    emitter.emit("test");

    assert(spy1.calledBefore(spy2));
    assert(spy2.calledBefore(spy3));
    assertResetSingleCall(spy1, undefined, "test");
    assertResetSingleCall(spy2, obj, "test");
    assertResetSingleCall(spy3, undefined, "test");

    lis2.dispose();
    emitter.emit("test2");

    assert(spy1.calledBefore(spy3));
    assertResetSingleCall(spy1, undefined, "test2");
    assertResetSingleCall(spy3, undefined, "test2");
    sinon.assert.notCalled(spy2);

    lis1.dispose();
    lis3.dispose();
    emitter.emit("test3");
    sinon.assert.notCalled(spy1);
    sinon.assert.notCalled(spy2);
    sinon.assert.notCalled(spy3);
  });

  it("should be correct on subscriptions/unsubscriptions during emit call", function() {
    let spy1 = sinon.spy(), spy2 = sinon.spy(), spy3 = sinon.spy();

    // This callback expect "cb" as second argument and calls it. It will do our bidding from
    // inside emit() calll.
    let doCall = (arg, cb) => { cb(); };

    let emitter = new emit.Emitter();
    let lis1 = emitter.addListener(spy1);
    emitter.addListener(doCall);

    // Add a listener from inside another listener.
    let lis2;
    let cbAddLis2 = () => { lis2 = emitter.addListener(spy2); };
    emitter.emit("test", cbAddLis2);
    assertResetSingleCall(spy1, undefined, "test", cbAddLis2);
    // It might be better NOT to call a listener for the same event that caused it to be added,
    // but it's unclear how important that is, and the implementation is simpler if we do call it.
    assertResetSingleCall(spy2, undefined, "test", cbAddLis2);

    // Make sure listeners are there, called in expected order.
    let cbNoop = () => {};
    emitter.emit("test2", cbNoop);
    assert(spy1.calledBefore(spy2));
    assertResetSingleCall(spy1, undefined, "test2", cbNoop);
    assertResetSingleCall(spy2, undefined, "test2", cbNoop);

    // Add another listener yet at the end.
    emitter.addListener(spy3);

    // Now, remove both listeners from inside a listener. The effect of removal is seen
    // immediately in that subsequent listeners don't get called if they got removed.
    let cbRemLis = () => { lis1.dispose(); lis2.dispose(); };
    emitter.emit("test3", cbRemLis);
    assert(spy1.calledBefore(spy3));
    assertResetSingleCall(spy1, undefined, "test3", cbRemLis);
    sinon.assert.notCalled(spy2);
    assertResetSingleCall(spy3, undefined, "test3", cbRemLis);

    // Make sure both listeners are gone.
    let called = false;
    let cbMarkCalled = () => { called = true; };
    emitter.emit("test4", cbMarkCalled);
    sinon.assert.notCalled(spy1);
    assert(called);       // Make sure our `doCall` listener is still there.
    sinon.assert.notCalled(spy2);
    assertResetSingleCall(spy3, undefined, "test4", cbMarkCalled);
  });

  it("should allow disposing listeners after emitter", function() {
    let emitter = new emit.Emitter();
    let spy1 = sinon.spy(), spy2 = sinon.spy(), spy3 = sinon.spy();
    let obj = {};
    let lis1 = emitter.addListener(spy1);
    let lis2 = emitter.addListener(spy2, obj);
    let lis3 = emitter.addListener(spy3, obj);

    lis2.dispose();
    emitter.emit("hello", 1, obj);

    assert(spy1.calledBefore(spy2));
    assertResetSingleCall(spy1, undefined, "hello", 1, obj);
    sinon.assert.notCalled(spy2);
    assertResetSingleCall(spy3, obj, "hello", 1, obj);

    assert.strictEqual(emitter.isDisposed(), false);
    assert.strictEqual(lis1.isDisposed(), false);
    assert.strictEqual(lis2.isDisposed(), true);
    assert.strictEqual(lis3.isDisposed(), false);

    emitter.dispose();
    assert.strictEqual(emitter.isDisposed(), true);
    assert.strictEqual(lis1.isDisposed(), true);
    assert.strictEqual(lis2.isDisposed(), true);
    assert.strictEqual(lis3.isDisposed(), true);
    assert.throws(() => emitter.emit("foo"), /null/);
    lis1.dispose();
    lis3.dispose();
    assert.throws(() => emitter.emit("foo"), /null/);
  });

  it("should support setChangeCB and hasListeners", function() {
    let emitter = new emit.Emitter();
    assert.strictEqual(emitter.hasListeners(), false);
    let spy1 = sinon.spy(), spy2 = sinon.spy();
    let spyChange = sinon.spy();

    // Set the change callback, and see how it reacts to listeners getting added and removed.
    emitter.setChangeCB(spyChange);
    let lis1 = emitter.addListener(spy1);
    assertResetSingleCall(spyChange, undefined, true);
    assert.strictEqual(emitter.hasListeners(), true);
    let lis2 = emitter.addListener(spy2);
    assertResetSingleCall(spyChange, undefined, true);
    assert.strictEqual(emitter.hasListeners(), true);

    lis2.dispose();
    assertResetSingleCall(spyChange, undefined, true);
    assert.strictEqual(emitter.hasListeners(), true);

    emitter.emit(1,2,3);
    assertResetSingleCall(spy1, undefined, 1,2,3);
    sinon.assert.notCalled(spy2);

    assert.strictEqual(emitter.hasListeners(), true);
    lis1.dispose();
    assertResetSingleCall(spyChange, undefined, false);
    assert.strictEqual(emitter.hasListeners(), false);

    // Check that we can unset the change callback too.
    emitter.setChangeCB(null);
    lis1 = emitter.addListener(spy1);
    sinon.assert.notCalled(spyChange);
    assert.strictEqual(emitter.hasListeners(), true);
    lis1.dispose();
    sinon.assert.notCalled(spyChange);
    assert.strictEqual(emitter.hasListeners(), false);

  });

  // What follows are timing tests, for different lengths of listener queues, to help decide on
  // the implementation.
  [1, 5, 20].forEach(listenerQueueSize => {
    describe("Timing with " + listenerQueueSize + " listeners", function() {
      let noop = () => {};
      let emitter, listeners = [], n = 0;

      function setup() {
        emitter = new emit.Emitter();
        for (let i = 0; i < listenerQueueSize; i++) {
          listeners.push(emitter.addListener(noop));
        }
      }

      before(setup);

      timeit("add/remove", () => {
        // Remove the oldest listener, add a new one, and increment the index: this way we
        // remove the oldest listener each time. It may be better to test removal at each
        // position, but I am not sure how to do it quickly.
        listeners[n].dispose();
        listeners[n] = emitter.addListener(noop);
        n = (n + 1) % listenerQueueSize;
      }, 500);

      timeit("emit", () => {
        emitter.emit("test");
      }, 500);

      timeit("add/remove/emit", () => {
        listeners[n].dispose();
        listeners[n] = emitter.addListener(noop);
        n = (n + 1) % listenerQueueSize;
        emitter.emit("test");
      }, 500);

      timeit("create/dispose-emitter", () => {
        emitter.dispose();
        setup();
      });
    });
  });
});
