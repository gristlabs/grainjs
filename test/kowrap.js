"use strict";

/* global describe, it */

const ko = require('knockout');
const observable = require('../lib/observable.js');
const computed = require('../lib/computed.js');
const kowrap = require('../lib/kowrap.js')(ko);
const { assertResetSingleCall } = require('./testutil.js');

const assert = require('chai').assert;
const sinon = require('sinon');

describe('kowrap', function() {

  it('should support dependency on knockout observables', function() {
    let kObs = ko.observable(17);
    let kComp = ko.computed(() => kObs() * 2);
    let gObs = observable("foo");

    // Check that multiple calls to wrap don't create different observables.
    let gWrap = kowrap(kObs);
    assert.strictEqual(kowrap(kObs), gWrap);

    let stub = sinon.stub().returnsArg(0);
    let gComp = computed(use => stub([use(kowrap(kObs)), use(kowrap(kComp)), use(gObs), use(gWrap)]));

    assert.deepEqual(gComp.get(), [17, 34, "foo", 17]);
    assertResetSingleCall(stub, undefined, [17, 34, "foo", 17]);

    gObs.set("bar");
    assert.deepEqual(gComp.get(), [17, 34, "bar", 17]);
    assertResetSingleCall(stub, undefined, [17, 34, "bar", 17]);

    // A change to an observable happens to first trigger kComp, ultimately triggering gComp
    // twice. This is sucky, but is normal for knockout.
    kObs(5);
    assert.deepEqual(gComp.get(), [5, 10, "bar", 5]);
    assert.deepEqual(stub.args, [[[17, 10, "bar", 17]], [[5, 10, "bar", 5]]]);
    stub.resetHistory();

    // We can avoid multiple changes at the level of Grain.js observables using bundleChanges().
    observable.bundleChanges(() => kObs(6));
    assert.deepEqual(gComp.get(), [6, 12, "bar", 6]);
    assertResetSingleCall(stub, undefined, [6, 12, "bar", 6]);

    // If we dispose the computed, there are no more calls to it.
    gComp.dispose();
    gObs.set("foo");
    kObs(17);
    sinon.assert.notCalled(stub);

    // Test that using a knockout observable works with kowrap(), and throws an exception without.
    assert.throws(() => computed(use => use(kObs)), /addListener/);
    computed(use => use(kowrap(kObs)));
  });

  it('should support being a dependency of knockout observables', function() {
    let gObs = observable(17);
    let gComp = computed(use => use(gObs) * 2);
    let kObs = ko.observable("foo");

    // Check that multiple calls to wrap don't create different observables.
    let kWrap = kowrap.ko(gObs);
    assert.strictEqual(kowrap.ko(gObs), kWrap);

    let stub = sinon.stub().returnsArg(0);
    let kComp = ko.computed(() => stub([kowrap.koUnwrap(gObs), kowrap.ko(gComp)(), kObs(), kWrap()]));

    assert.deepEqual(kComp.peek(), [17, 34, "foo", 17]);
    assertResetSingleCall(stub, undefined, [17, 34, "foo", 17]);

    kObs("bar");
    assert.deepEqual(kComp.peek(), [17, 34, "bar", 17]);
    assertResetSingleCall(stub, undefined, [17, 34, "bar", 17]);

    gObs.set(5);
    assert.deepEqual(kComp.peek(), [5, 10, "bar", 5]);
    assert.deepEqual(stub.args, [[[5, 34, "bar", 5]], [[5, 10, "bar", 5]]]);
    stub.resetHistory();

    // If we dispose the computed, there are no more calls to it.
    kComp.dispose();
    kObs("foo");
    gObs.set(17);
    sinon.assert.notCalled(stub);
  });

  it('should avoid duplicate calls when only use grain observables', function() {
    let gObs = observable(17);
    let gComp = computed(use => use(gObs) * 2);
    let gObs2 = observable("foo");

    let stub = sinon.stub().returnsArg(0);
    let gAll = computed(use => stub([use(gObs), use(gComp), use(gObs2), use(gObs)]));

    assert.deepEqual(gAll.get(), [17, 34, "foo", 17]);
    assertResetSingleCall(stub, undefined, [17, 34, "foo", 17]);

    gObs2.set("bar");
    assert.deepEqual(gAll.get(), [17, 34, "bar", 17]);
    assertResetSingleCall(stub, undefined, [17, 34, "bar", 17]);

    gObs.set(5);
    assert.deepEqual(gAll.get(), [5, 10, "bar", 5]);
    assertResetSingleCall(stub, undefined, [5, 10, "bar", 5]);

    gObs.set(6);
    assert.deepEqual(gAll.get(), [6, 12, "bar", 6]);
    assertResetSingleCall(stub, undefined, [6, 12, "bar", 6]);
  });
});
