import {Disposable} from '../lib/dispose';
import {observable, obsHolder} from '../lib/observable';
import {assertResetSingleCall} from './testutil2';

import {assert} from 'chai';
import * as sinon from 'sinon';

describe('obsHolder', function() {
  const fooConstruct = sinon.spy();
  const fooDispose = sinon.spy();

  class Foo extends Disposable {
    constructor(...args: any[]) {
      super();
      fooConstruct.call(this, ...args);
      this.onDispose(fooDispose, this);
    }
  }

  beforeEach(function() {
    fooConstruct.resetHistory();
    fooDispose.resetHistory();
  });

  it('should dispose owned values', function() {
    let f: Foo;
    let g: Foo;
    const obs = obsHolder<Foo>(f = Foo.create(null));
    assert.strictEqual(obs.get(), f);
    assertResetSingleCall(fooConstruct, f);
    assert.isFalse(f.isDisposed());

    g = Foo.create(obs, "x");
    assert.strictEqual(obs.get(), g);

    assertResetSingleCall(fooConstruct, g, "x");
    assertResetSingleCall(fooDispose, f);
    assert.isTrue(f.isDisposed());
    assert.isFalse(g.isDisposed());

    f = Foo.create(obs);
    assert.strictEqual(obs.get(), f);
    assertResetSingleCall(fooConstruct, f);
    assertResetSingleCall(fooDispose, g);
    assert.isFalse(f.isDisposed());
    assert.isTrue(g.isDisposed());

    // Using .autoDispose() is equivalent to using obs as an owner.
    g = obs.autoDispose(Foo.create(null, "y"));
    assertResetSingleCall(fooConstruct, g, "y");
    assertResetSingleCall(fooDispose, f);
    assert.isTrue(f.isDisposed());
    assert.isFalse(g.isDisposed());

    obs.dispose();
    assertResetSingleCall(fooDispose, g);
    assert.isTrue(f.isDisposed());
    assert.isTrue(g.isDisposed());
  });

  it('should work with nulls', function() {
    const obs = observable<Foo|null>(null);
    let f = Foo.create(obs);

    obs.set(null);
    assertResetSingleCall(fooDispose, f);
    assert.isTrue(f.isDisposed());

    const g = Foo.create(obs);
    sinon.assert.notCalled(fooDispose);

    f = Foo.create(obs);
    assertResetSingleCall(fooDispose, g);
    assert.isFalse(f.isDisposed());
    assert.isTrue(g.isDisposed());

    obs.dispose();
    assertResetSingleCall(fooDispose, f);
    assert.isTrue(f.isDisposed());
    assert.isTrue(g.isDisposed());
  });

  it('should allow setting unowned values', function() {
    // If we don't use autoDispose and don't use the observable as a IDisposableOwner, then it
    // doesn't take ownership of its values.
    let f: Foo;
    let g: Foo;
    const obs = obsHolder<Foo>(f = Foo.create(null));
    assertResetSingleCall(fooConstruct, f);
    assert.strictEqual(obs.get(), f);
    assert.isFalse(f.isDisposed());

    obs.set(g = Foo.create(null, "x"));
    assertResetSingleCall(fooConstruct, g, "x");
    assert.strictEqual(obs.get(), g);

    assertResetSingleCall(fooDispose, f);
    assert.isTrue(f.isDisposed());
    assert.isFalse(g.isDisposed());

    obs.set(f = Foo.create(null));
    assert.strictEqual(obs.get(), f);
    sinon.assert.notCalled(fooDispose);
    assert.isFalse(f.isDisposed());
    assert.isFalse(g.isDisposed());

    obs.dispose();
    sinon.assert.notCalled(fooDispose);
    assert.isFalse(f.isDisposed());
    assert.isFalse(g.isDisposed());
  });

  it('should allow setting self-owned values', function() {
    // Using obs as an owner, and then calling .set() is a redundant usage, but should work.
    let f: Foo;
    let g: Foo;
    const obs = obsHolder<Foo>(f = Foo.create(null));
    assert.strictEqual(obs.get(), f);
    assert.isFalse(f.isDisposed());

    obs.set(g = Foo.create(obs));
    assert.strictEqual(obs.get(), g);

    assertResetSingleCall(fooDispose, f);
    assert.isTrue(f.isDisposed());
    assert.isFalse(g.isDisposed());

    obs.set(f = Foo.create(obs));
    assert.strictEqual(obs.get(), f);
    assertResetSingleCall(fooDispose, g);
    assert.isFalse(f.isDisposed());
    assert.isTrue(g.isDisposed());

    obs.dispose();
    assertResetSingleCall(fooDispose, f);
    assert.isTrue(f.isDisposed());
    assert.isTrue(g.isDisposed());
  });
});
