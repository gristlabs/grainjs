import {assert} from 'chai';
import * as sinon from 'sinon';
import {Computed, MultiHolder, Observable} from '../../index';

describe('computed', function() {

  it('should be possible to create with .create', function() {
    // Create four observables, and a computed that depends on them statically or dynamically.
    const holder = MultiHolder.create(null);
    const x = Observable.create(holder, "x");
    const y = Observable.create(null, "y");       // Not owned, just for kicks.
    const z = Observable.create(holder, "z");

    const spy1 = sinon.spy((a: any) => a);
    const spy2 = sinon.spy((a: any) => a);
    const comp1 = Computed.create(holder, (use) => spy1(use(x) + use(y) + use(z)));
    const comp2 = Computed.create(holder, x, y, (use, _x, _y) => spy2(_x + _y + use(z)));

    assert.strictEqual(comp1.get(), "xyz");
    assert.strictEqual(comp2.get(), "xyz");
    assert.strictEqual(spy1.callCount, 1);
    assert.strictEqual(spy2.callCount, 1);

    // Change different observables, and ensure it reacts to each of them.
    x.set("X");
    y.set("Y");
    z.set("Z");
    assert.strictEqual(comp1.get(), "XYZ");
    assert.strictEqual(comp2.get(), "XYZ");
    assert.strictEqual(spy1.callCount, 4);
    assert.strictEqual(spy2.callCount, 4);

    // Verify that the computed is really owned by the owner.
    assert.deepEqual([comp1, comp2, x, y, z].map((a) => a.isDisposed()), [false, false, false, false, false]);
    holder.dispose();
    assert.deepEqual([comp1, comp2, x, y, z].map((a) => a.isDisposed()), [true, true, true, false, true]);

    // Verify that after disposal, it no longer reacts to dependencies.
    assert.strictEqual(x.get(), undefined);
    assert.strictEqual(y.get(), "Y");
    assert.strictEqual(z.get(), undefined);
    assert.strictEqual(comp1.get(), undefined);
    assert.strictEqual(comp2.get(), undefined);
    y.set("y");
    assert.strictEqual(spy1.callCount, 4);   // No new calls
    assert.strictEqual(spy2.callCount, 4);   // No new calls
  });
});
