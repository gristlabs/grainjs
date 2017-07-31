"use strict";

/* global describe, before, it */

var emit = require('../lib/emit.js');

var assert = require('assert');
var sinon = require('sinon');
var timeit = require('./testutil.js').timeit;

describe('emitter.Emitter', function() {

  function assertResetSingleCall(spy, context, ...args) {
    sinon.assert.calledOnce(spy);
    sinon.assert.calledOn(spy, context);
    sinon.assert.calledWithExactly(spy, ...args);
    spy.reset();
  }

  it("should call subscribed listeners", function() {
    var emitter = new emit.Emitter();
    var obj = {};
    var spy1 = sinon.spy(), spy2 = sinon.spy(), spy3 = sinon.spy();
    var lis1 = emitter.addListener(spy1);
    var lis2 = emitter.addListener(spy2, obj);

    emitter.emit("hello", 1, obj);

    assert(spy1.calledBefore(spy2));
    assertResetSingleCall(spy1, undefined, "hello", 1, obj);
    assertResetSingleCall(spy2, obj, "hello", 1, obj);
    sinon.assert.notCalled(spy3);

    var lis3 = emitter.addListener(spy3);
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
    var spy1 = sinon.spy(), spy2 = sinon.spy(), spy3 = sinon.spy();

    // This callback expect "cb" as second argument and calls it. It will do our bidding from
    // inside emit() calll.
    var doCall = (arg, cb) => { cb(); };

    var emitter = new emit.Emitter();
    var lis1 = emitter.addListener(spy1);
    emitter.addListener(doCall);

    // Add a listener from inside another listener.
    var lis2;
    var cbAddLis2 = () => { lis2 = emitter.addListener(spy2); };
    emitter.emit("test", cbAddLis2);
    assertResetSingleCall(spy1, undefined, "test", cbAddLis2);
    // It might be better NOT to call a listener for the same event that caused it to be added,
    // but it's unclear how important that is, and the implementation is simpler if we do call it.
    assertResetSingleCall(spy2, undefined, "test", cbAddLis2);

    // Make sure listeners are there, called in expected order.
    var cbNoop = () => {};
    emitter.emit("test2", cbNoop);
    assert(spy1.calledBefore(spy2));
    assertResetSingleCall(spy1, undefined, "test2", cbNoop);
    assertResetSingleCall(spy2, undefined, "test2", cbNoop);

    // Add another listener yet at the end.
    emitter.addListener(spy3);

    // Now, remove both listeners from inside a listener. The effect of removal is seen
    // immediately in that subsequent listeners don't get called if they got removed.
    var cbRemLis = () => { lis1.dispose(); lis2.dispose(); };
    emitter.emit("test3", cbRemLis);
    assert(spy1.calledBefore(spy3));
    assertResetSingleCall(spy1, undefined, "test3", cbRemLis);
    sinon.assert.notCalled(spy2);
    assertResetSingleCall(spy3, undefined, "test3", cbRemLis);

    // Make sure both listeners are gone.
    var called = false;
    var cbMarkCalled = () => { called = true; };
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

    emitter.dispose();
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
    assert(spy1.calledBefore(spy2));
    assertResetSingleCall(spy1, undefined, 1,2,3);
    sinon.assert.notCalled(spy2);

    assert.strictEqual(emitter.hasListeners(), true);
    lis1.dispose();
    assertResetSingleCall(spyChange, undefined, false);
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
