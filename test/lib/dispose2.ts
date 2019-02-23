import {Disposable, Holder} from '../../lib/dispose';

import {assert} from 'chai';
import noop = require('lodash/noop');
import * as sinon from 'sinon';
import {assertResetSingleCall, consoleCapture} from './testutil2';

describe('dispose2', function() {
  const fooDisposed: sinon.SinonSpy = sinon.spy();

  beforeEach(function() {
    fooDisposed.resetHistory();
  });

  class Foo extends Disposable {
    constructor(public a: number, callback: (owner: Disposable) => void) {
      super();
      this.onDispose(fooDisposed, this);
      callback(this);
    }
  }

  describe("Disposable", function() {
    it("should be safe to use new directly", function() {
      const foo = new Foo(17, noop);
      assert.equal(foo.a, 17);
      sinon.assert.notCalled(fooDisposed);
      foo.dispose();
      assertResetSingleCall(fooDisposed, foo);
    });

    it("should be safe to use new from inside Disposable constructor", function() {
      let foo1: Foo = null!;    // assignment silences "used before assigned" warnings
      const foo2 = Foo.create(null, 10, (owner: Disposable) => {
        foo1 = new Foo(20, noop);
      });
      assert.equal(foo2.a, 10);
      assert.equal(foo1.a, 20);

      foo2.dispose();
      assertResetSingleCall(fooDisposed, foo2);
      assert.isTrue(foo2.isDisposed());
      assert.isFalse(foo1.isDisposed());

      foo1.dispose();
      assertResetSingleCall(fooDisposed, foo1);
      assert.isTrue(foo1.isDisposed());
      assert.isTrue(foo2.isDisposed());
    });

    it("should be better to use create from inside Disposable constructor", function() {
      // Same case as above, but done correctly, mainly to illustrate the difference.
      let foo1: Foo = null!;    // assignment silences "used before assigned" warnings
      const foo2 = Foo.create(null, 10, (owner: Disposable) => {
        foo1 = Foo.create(owner, 20, noop);
      });
      assert.equal(foo2.a, 10);
      assert.equal(foo1.a, 20);

      foo2.dispose();
      assert.deepEqual(fooDisposed.thisValues, [foo1, foo2]);
      assert.isTrue(foo2.isDisposed());
      assert.isTrue(foo1.isDisposed());
    });

    it("should complain without failing on duplicate disposal", function() {
      const foo = Foo.create(null, 17, noop);
      consoleCapture(['error'], (messages) => {
        foo.dispose();
        assert.deepEqual(messages, []);
      });
      consoleCapture(['error'], (messages) => {
        foo.dispose();
        assert.deepEqual(messages, ["error: Error disposing Foo which is already disposed"]);
      });
    });
  });

  describe("Holder", function() {
    it("should dispose previously held object", function() {
      const holder = Holder.create<Foo>(null);
      assert.isTrue(holder.isEmpty());
      assert.strictEqual(holder.get(), null);

      const foo = Foo.create(holder, 17, noop);
      assert.isFalse(holder.isEmpty());
      sinon.assert.notCalled(fooDisposed);
      assert.strictEqual(holder.get(), foo);

      const bar = Foo.create(holder, 28, noop);
      assert.isFalse(holder.isEmpty());
      assertResetSingleCall(fooDisposed, foo);
      assert.strictEqual(holder.get(), bar);
      assert.strictEqual(holder.get()!.a, 28);

      holder.clear();
      assert.isTrue(holder.isEmpty());
      assertResetSingleCall(fooDisposed, bar);
      assert.strictEqual(holder.get(), null);

      const baz = Foo.create(holder, 39, noop);
      assert.isFalse(holder.isEmpty());
      sinon.assert.notCalled(fooDisposed);
      assert.strictEqual(holder.get(), baz);

      holder.dispose();
      assertResetSingleCall(fooDisposed, baz);
    });

    it("should notice when a Disposable gets disposed outside", function() {
      const holder = Holder.create(null);
      const foo = Foo.create(holder, 16, noop);
      assert.strictEqual(holder.get(), foo);

      foo.dispose();
      assertResetSingleCall(fooDisposed, foo);
      assert.isTrue(holder.isEmpty());
      assert.strictEqual(holder.get(), null);

      holder.clear();
      sinon.assert.notCalled(fooDisposed);
    });

    it("should release fully when holding a Disposable", function() {
      const holder = Holder.create(null);
      const foo = Foo.create(holder, 16, noop);
      assert.strictEqual(holder.get(), foo);

      assert.strictEqual(holder.release(), foo);
      assert.isTrue(holder.isEmpty());
      assert.strictEqual(holder.get(), null);

      const bar = Foo.create(holder, 27, noop);
      assert.isFalse(holder.isEmpty());
      assert.strictEqual(holder.get(), bar);

      // Holder used to listen to foo's disposal, but it's been released, so foo's disposal should
      // no longer affect the holder.
      foo.dispose();
      assertResetSingleCall(fooDisposed, foo);
      assert.isFalse(holder.isEmpty());
      assert.strictEqual(holder.get(), bar);

      holder.dispose();
      assertResetSingleCall(fooDisposed, bar);
    });
  });
});
