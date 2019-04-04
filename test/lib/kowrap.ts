import {assert} from 'chai';
import * as ko from 'knockout';
import * as sinon from 'sinon';
import {bundleChanges, computed, fromKo, observable, toKo} from '../../index';
import {assertResetSingleCall} from './testutil2';

describe('kowrap', function() {

  it('should support dependency on knockout observables', function() {
    const kObs = ko.observable(17);
    const kComp = ko.computed(() => kObs() * 2);
    const gObs = observable("foo");

    // Check that multiple calls to wrap don't create different observables.
    const gWrap = fromKo(kObs);
    assert.strictEqual(fromKo(kObs), gWrap);

    const stub = sinon.stub().returnsArg(0);
    const gComp = computed((use) => stub([use(fromKo(kObs)), use(fromKo(kComp)), use(gObs), use(gWrap)]));

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
    bundleChanges(() => kObs(6));
    assert.deepEqual(gComp.get(), [6, 12, "bar", 6]);
    assertResetSingleCall(stub, undefined, [6, 12, "bar", 6]);

    // If we dispose the computed, there are no more calls to it.
    gComp.dispose();
    gObs.set("foo");
    kObs(17);
    sinon.assert.notCalled(stub);

    // Test that using a knockout observable works with fromKo(), and throws an exception without.
    assert.throws(() => computed((use) => use(kObs)), TypeError);
    computed((use) => use(fromKo(kObs)));
  });

  it('should support being a dependency of knockout observables', function() {
    const gObs = observable(17);
    const gComp = computed((use) => use(gObs) * 2);
    const kObs = ko.observable("foo");

    // Check that multiple calls to wrap don't create different observables.
    const kWrap = toKo(ko, gObs);
    assert.strictEqual(toKo(ko, gObs), kWrap);

    const stub = sinon.stub().returnsArg(0);
    const kComp = ko.computed(() => stub([toKo(ko, gObs)(), toKo(ko, gComp)(), kObs(), kWrap()]));

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
    const gObs = observable(17);
    const gComp = computed((use) => use(gObs) * 2);
    const gObs2 = observable("foo");

    const stub = sinon.stub().returnsArg(0);
    const gAll = computed((use) => stub([use(gObs), use(gComp), use(gObs2), use(gObs)]));

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
