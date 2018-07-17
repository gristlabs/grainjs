import {computed} from '../../lib/computed';
import {Disposable} from '../../lib/dispose';
import {observable} from '../../lib/observable';
import {assertResetSingleCall} from './testutil2';

import {assert} from 'chai';
import * as sinon from 'sinon';

describe('computedHolder', function() {

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
    const obs = observable("a");
    const comp = computed<Foo>((use) => Foo.create(use.owner, use(obs)));

    let f = comp.get();
    assert.isOk(f);
    assertResetSingleCall(fooConstruct, f, "a");
    sinon.assert.notCalled(fooDispose);

    obs.set("b");     // This should trigger a re-evaluation of comp.
    const g = comp.get();
    assertResetSingleCall(fooConstruct, g, "b");
    assertResetSingleCall(fooDispose, f);
    assert.isTrue(f.isDisposed());
    assert.isFalse(g.isDisposed());

    obs.set("b");     // This should not trigger anything.
    sinon.assert.notCalled(fooConstruct);
    sinon.assert.notCalled(fooDispose);
    assert.strictEqual(comp.get(), g);

    obs.set("x");     // Triggers another reevaluation.
    f = comp.get();
    assert.isOk(f);
    assertResetSingleCall(fooConstruct, f, "x");
    assertResetSingleCall(fooDispose, g);
    assert.isFalse(f.isDisposed());
    assert.isTrue(g.isDisposed());

    comp.dispose();
    sinon.assert.notCalled(fooConstruct);
    assertResetSingleCall(fooDispose, f);
    assert.isTrue(f.isDisposed());
    assert.isTrue(g.isDisposed());
  });

  it('should work with nulls', function() {
    let f: Foo|null;
    let g: Foo|null;
    const obs = observable("");
    const comp = computed(obs, (use, val) => val ? Foo.create(use.owner, val) : null);
    f = comp.get();
    assert.strictEqual(f, null);
    sinon.assert.notCalled(fooConstruct);
    sinon.assert.notCalled(fooDispose);

    obs.set("b");     // This should trigger a re-evaluation of comp.
    g = comp.get();
    assertResetSingleCall(fooConstruct, g, "b");
    sinon.assert.notCalled(fooDispose);

    obs.set("");    // Triggers another reevaluation.
    f = comp.get();
    assert.strictEqual(f, null);
    sinon.assert.notCalled(fooConstruct);
    assertResetSingleCall(fooDispose, g);
    assert.isTrue(g && g.isDisposed());

    comp.dispose();
    sinon.assert.notCalled(fooConstruct);
    sinon.assert.notCalled(fooDispose);
  });
});
