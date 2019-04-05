import {assert} from 'chai';
import * as ko from 'knockout';
import * as sinon from 'sinon';
import {bundleChanges, computed, dom, fromKo, IKnockoutObservable, observable, pureComputed, toKo} from '../../index';
import {assertResetSingleCall, useJsDomWindow} from './testutil2';

describe('kowrap', function() {

  it('should support computed depending on knockout observables', () => {
    const kObs = ko.observable(17);
    const kComp = ko.computed(() => kObs() * 2);
    const gObs = observable("foo");

    // Check that multiple calls to wrap don't create different observables.
    const gWrap = fromKo(kObs);
    assert.strictEqual(fromKo(kObs), gWrap);

    const stub = sinon.spy((a: any) => a);
    const gComp = computed((use) => stub([use(kObs), use(kComp), use(gObs), use(gWrap)]));

    assertResetSingleCall(stub, undefined, [17, 34, "foo", 17]);
    assert.deepEqual(gComp.get(), [17, 34, "foo", 17]);

    gObs.set("bar");
    assertResetSingleCall(stub, undefined, [17, 34, "bar", 17]);
    assert.deepEqual(gComp.get(), [17, 34, "bar", 17]);

    // A change to an observable triggers both kObs and kComp, which each trigger a separate
    // fromKo wrapper, ultimately triggering gComp twice. This is sucky, but normal for knockout.
    kObs(5);
    assert.deepEqual(stub.args, [[[5, 10, "bar", 5]], [[5, 10, "bar", 5]]]);
    assert.deepEqual(gComp.get(), [5, 10, "bar", 5]);
    stub.resetHistory();

    // We can avoid multiple changes at the level of Grain.js observables using bundleChanges().
    bundleChanges(() => kObs(6));
    assertResetSingleCall(stub, undefined, [6, 12, "bar", 6]);
    assert.deepEqual(gComp.get(), [6, 12, "bar", 6]);

    // We can set the computed via the wrapper, and changes get bundled.
    gWrap.set(7);
    assert.equal(kObs.peek(), 7);
    assertResetSingleCall(stub, undefined, [7, 14, "bar", 7]);
    assert.deepEqual(gComp.get(), [7, 14, "bar", 7]);

    // If we dispose the computed, there are no more calls to it.
    gComp.dispose();
    gObs.set("foo");
    kObs(17);
    sinon.assert.notCalled(stub);
  });

  // This is an ALMOST but not precisely a copy of the version for "computed" above.
  it('should support pureComputed depending on knockout observables', () => {
    const kObs = ko.observable(17);
    const kComp = ko.computed(() => kObs() * 2);
    const gObs = observable("foo");

    // Check that multiple calls to wrap don't create different observables.
    const gWrap = fromKo(kObs);
    assert.strictEqual(fromKo(kObs), gWrap);

    const stub = sinon.spy((a: any) => a);
    const gComp = pureComputed((use) => stub([use(kObs), use(kComp), use(gObs), use(gWrap)]));

    assert.deepEqual(gComp.get(), [17, 34, "foo", 17]);
    assertResetSingleCall(stub, undefined, [17, 34, "foo", 17]);

    gObs.set("bar");
    sinon.assert.notCalled(stub);
    assert.deepEqual(gComp.get(), [17, 34, "bar", 17]);
    assertResetSingleCall(stub, undefined, [17, 34, "bar", 17]);

    // A change to an observable happens to first trigger kComp, ultimately triggering gComp
    // twice. This is sucky, but is normal for knockout.
    kObs(5);
    sinon.assert.notCalled(stub);
    assert.deepEqual(gComp.get(), [5, 10, "bar", 5]);
    assertResetSingleCall(stub, undefined, [5, 10, "bar", 5]);

    // We can avoid multiple changes at the level of Grain.js observables using bundleChanges().
    bundleChanges(() => kObs(6));
    assert.deepEqual(gComp.get(), [6, 12, "bar", 6]);
    assertResetSingleCall(stub, undefined, [6, 12, "bar", 6]);

    // If we dispose the computed, there are no more calls to it.
    gComp.dispose();
    gObs.set("foo");
    kObs(17);
    sinon.assert.notCalled(stub);
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

  it("should not create unnecessary subscriptions", function() {
    const kObs: IKnockoutObservable<string> = ko.observable("a");
    const gObs = fromKo(kObs);

    // Ensure there is no subscription if it's not needed yet.
    assert.equal(kObs.getSubscriptionsCount(), 0);
    assert.equal(gObs.get(), "a");
    kObs("b");
    assert.equal(gObs.get(), "b");
    assert.equal(kObs.getSubscriptionsCount(), 0);

    // Add a subscription, check that it works.
    const spy = sinon.spy((a: any) => a);
    const lis = gObs.addListener(spy);
    assert.equal(kObs.getSubscriptionsCount(), 1);
    kObs("c");
    assert.equal(gObs.get(), "c");
    assertResetSingleCall(spy, undefined, "c", "b");

    // Add another subscription to fromKo(kObs) in the form of a computed, using use(kObs).
    const spyComp = sinon.spy((a: any) => a);
    const gComp = computed((use) => spyComp(use(kObs) + use(kObs)));
    assertResetSingleCall(spyComp, undefined, "cc");
    assert.equal(gComp.get(), "cc");
    sinon.assert.notCalled(spyComp);

    // Check that both subscriptions notice changes.
    kObs("d");
    assertResetSingleCall(spy, undefined, "d", "c");
    assertResetSingleCall(spyComp, undefined, "dd");
    assert.equal(gObs.get(), "d");
    assert.equal(gComp.get(), "dd");

    // There should be only one wrapper, so still only one subscription to kObs itself.
    assert.equal(kObs.getSubscriptionsCount(), 1);

    // Dispose one (second remains).
    lis.dispose();
    assert.equal(kObs.getSubscriptionsCount(), 1);

    // Check computed still reacts to changes.
    kObs("e");
    assertResetSingleCall(spyComp, undefined, "ee");
    assert.equal(gObs.get(), "e");
    assert.equal(gComp.get(), "ee");
    sinon.assert.notCalled(spy);

    // Dispose the other subscription, ensure kObs is now unused.
    gComp.dispose();
    assert.equal(kObs.getSubscriptionsCount(), 0);

    // We should still be able get its value via gObs though.
    kObs("f");
    assert.equal(gObs.get(), "f");
    assert.equal(gComp.get(), null);
    sinon.assert.notCalled(spy);
    sinon.assert.notCalled(spyComp);
  });

  it('should not create unnecessary subscriptions with computeds', function() {
    const kObsA = ko.observable("a");
    const kObsB = ko.observable("b");
    const spyA = sinon.spy((a: any) => a);
    const spyB = sinon.spy((a: any) => a);
    const gObsA = computed((use) => spyA(use(kObsA)));
    const gObsB = pureComputed((use) => spyB(use(kObsB)));

    // A computed notices a change immediately.
    assertResetSingleCall(spyA, undefined, "a");
    assert.equal(gObsA.get(), "a");
    kObsA("A");
    assertResetSingleCall(spyA, undefined, "A");
    assert.equal(gObsA.get(), "A");
    sinon.assert.notCalled(spyA);

    // pureComputed notices a change only when looked at.
    sinon.assert.notCalled(spyB);
    assert.equal(gObsB.get(), "b");
    assertResetSingleCall(spyB, undefined, "b");
    kObsB("B");
    sinon.assert.notCalled(spyB);
    assert.equal(gObsB.get(), "B");
    assertResetSingleCall(spyB, undefined, "B");

    // This is the crux of the matter: kObsB does not have a subscription.
    assert.equal(kObsA.getSubscriptionsCount(), 1);
    assert.equal(kObsB.getSubscriptionsCount(), 0);     // pureComputed doesn't subscribe when inactive

    // Now subscribe to both gObs computeds.
    const spyA2 = sinon.spy((a: any) => a);
    const spyB2 = sinon.spy((a: any) => a);
    const lisA = gObsA.addListener(spyA2);
    const lisB = gObsB.addListener(spyB2);
    assertResetSingleCall(spyB, undefined, "B");

    // Now pureComputed acts as computed and subscribes too.
    assert.equal(kObsA.getSubscriptionsCount(), 1);
    assert.equal(kObsB.getSubscriptionsCount(), 1);

    kObsA("aa");
    assertResetSingleCall(spyA, undefined, "aa");
    assertResetSingleCall(spyA2, undefined, "aa", "A");
    kObsB("bb");
    assertResetSingleCall(spyB, undefined, "bb");
    assertResetSingleCall(spyB2, undefined, "bb", "B");

    // When we unsubscribe, count should go back to 0.
    lisA.dispose();
    lisB.dispose();
    assert.equal(kObsA.getSubscriptionsCount(), 1);
    assert.equal(kObsB.getSubscriptionsCount(), 0);

    kObsA("AA");
    assertResetSingleCall(spyA, undefined, "AA");
    sinon.assert.notCalled(spyA2);
    kObsB("bb");
    sinon.assert.notCalled(spyB);
    sinon.assert.notCalled(spyB2);
  });

  describe("dom", function() {
    useJsDomWindow();

    it('should play well with dom bindings', function() {
      const kObs = ko.observable(17);
      const gObs = observable(17); // fromKo(kObs);
      const elem = dom('input', dom.prop('value', gObs)) as HTMLInputElement;
      assert.equal(elem.value, '17');
      gObs.set(20);
      assert.equal(elem.value, '20');
      kObs(25);
      assert.equal(elem.value, '20');
    });
  });
});
