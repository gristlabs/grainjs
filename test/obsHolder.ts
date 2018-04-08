import {computed} from '../lib/computed';
import {Disposable} from '../lib/dispose';
import {observable, Observable} from '../lib/observable';
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

  describe('obsHolder', function() {
    it('should dispose owned values', function() {
      let f: Foo;
      let g: Foo;
      const obs = Observable.holder<Foo>(f = Foo.create(null));
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
      assertResetSingleCall(fooDispose, g);
      assert.isFalse(f.isDisposed());
      assert.isTrue(g.isDisposed());

      obs.dispose();
      assertResetSingleCall(fooDispose, f);
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
      // This isn't the recommended usage, but should work correctly.
      let f: Foo;
      let g: Foo;
      const obs = Observable.holder<Foo>(f = Foo.create(null));
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
      // This is a redundant usage, but should work.
      let f: Foo;
      let g: Foo;
      const obs = Observable.holder<Foo>(f = Foo.create(null));
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

  describe('computedHolder', function() {
    it('should dispose owned values', function() {
      const obs = observable("a");
      const comp = computed<Foo>((use) => Foo.create(use.owner as any /* TODO */, use(obs)));

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
      const comp = computed(obs, (use, val) => val ? Foo.create(use.owner as any /* TODO */, val) : null);
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
});
