"use strict";

/* global describe, it, afterEach */

const {Disposable} = require('../../lib/dispose');
const { consoleCapture } = require('./testutil');

const assert = require('chai').assert;
const sinon = require('sinon');

describe('dispose', function() {

  function Bar() {
    this.dispose = sinon.spy();
    this.destroy = sinon.spy();
  }

  describe("Disposable", function() {
    it("should dispose objects passed to autoDispose", function() {
      let bar = new Bar();
      let baz = new Bar();
      let baz2 = new Bar();
      let disposer = sinon.spy();
      let cleanup1 = sinon.spy();
      let cleanup2 = sinon.spy();

      class Foo extends Disposable {
        constructor() {
          super();
          this.bar = this.autoDispose(bar);
          this.baz = this.onDispose(baz.destroy, baz);
          this.baz2 = this.onDispose(() => disposer(baz2));
          this.onDispose(cleanup1, this);
        }
      }

      let foo = new Foo();
      assert(!foo.isDisposed());
      assert(foo.bar instanceof Bar);
      assert.equal(foo.constructor.name, "Foo");
      assert.equal(Object.getPrototypeOf(Foo).name, "Disposable");

      // We can also use disposal methods outside the constructor.
      foo.onDispose(cleanup2, foo);

      foo.dispose();
      assert(foo.isDisposed());
      assert.equal(bar.dispose.callCount, 1);
      assert.equal(bar.destroy.callCount, 0);
      assert(bar.dispose.calledOn(bar));
      assert(bar.dispose.calledWithExactly());

      assert.equal(baz.dispose.callCount, 0);
      assert.equal(baz.destroy.callCount, 1);
      assert(baz.destroy.calledOn(baz));
      assert(baz.destroy.calledWithExactly());

      assert.equal(disposer.callCount, 1);
      assert(disposer.calledWithExactly(baz2));

      assert.equal(cleanup1.callCount, 1);
      assert.equal(cleanup2.callCount, 1);
      assert(cleanup1.calledOn(foo));
      assert(cleanup1.calledWithExactly());
      assert(cleanup2.calledOn(foo));
      assert(cleanup2.calledWithExactly());

      // Verify that disposal is called in reverse order of autoDispose calls.
      assert(cleanup2.calledBefore(cleanup1));
      assert(cleanup1.calledBefore(disposer));
      assert(disposer.calledBefore(baz.destroy));
      assert(baz.destroy.calledBefore(bar.dispose));
    });

    it("should wipe object, only when requested", function() {
      let bar1 = new Bar();
      let barA = new Bar();
      let barB = new Bar();
      class Foo extends Disposable {
        constructor() {
          super();
          this.bar = this.autoDispose(bar1);
        }
      }
      class FooWiped extends Disposable {
        constructor() {
          super();
          this.barA = this.autoDispose(barA);
          this.wipeOnDispose();
          this.barB = this.autoDispose(barB);
        }
      }

      let foo1 = new Foo();
      let foo2 = new FooWiped();
      foo1.dispose();
      foo2.dispose();
      assert(foo1.isDisposed());
      assert(foo2.isDisposed());
      assert.strictEqual(foo1.bar, bar1);
      assert.strictEqual(foo2.barA, null);
      assert.strictEqual(foo2.barB, null);
      assert.equal(bar1.dispose.callCount, 1);
      assert.equal(barA.dispose.callCount, 1);
      assert.equal(barB.dispose.callCount, 1);
    });
  });

  describe("construct", function() {
    let bar = new Bar();
    let baz = new Bar();

    class Foo extends Disposable {
      constructor(throwWhen) {
        super();
        if (throwWhen === 0) { throw new Error("test-error"); }
        this.bar = this.autoDispose(bar);
        if (throwWhen === 1) { throw new Error("test-error"); }
        this.baz = this.autoDispose(baz);
        if (throwWhen === 2) { throw new Error("test-error"); }
      }
    }

    afterEach(function() {
      bar.dispose.resetHistory();
      baz.dispose.resetHistory();
    });

    it("should dispose partially constructed objects", function() {
      let foo;
      // If we throw right away, no surprises, nothing gets called.
      assert.throws(function() { foo = Foo.create(null, 0); }, /test-error/);
      assert.strictEqual(foo, undefined);
      assert.equal(bar.dispose.callCount, 0);
      assert.equal(baz.dispose.callCount, 0);

      // If we constructed one object, that one object should have gotten disposed.
      assert.throws(function() { foo = Foo.create(null, 1); }, /test-error/);
      assert.strictEqual(foo, undefined);
      assert.equal(bar.dispose.callCount, 1);
      assert.equal(baz.dispose.callCount, 0);
      bar.dispose.resetHistory();

      // If we constructed two objects, both should have gotten disposed.
      assert.throws(function() { foo = Foo.create(null, 2); }, /test-error/);
      assert.strictEqual(foo, undefined);
      assert.equal(bar.dispose.callCount, 1);
      assert.equal(baz.dispose.callCount, 1);
      assert(baz.dispose.calledBefore(bar.dispose));
      bar.dispose.resetHistory();
      baz.dispose.resetHistory();

      // If we don't throw, then nothing should get disposed until we call .dispose().
      assert.doesNotThrow(function() { foo = Foo.create(null, 3); });
      assert(!foo.isDisposed());
      assert.equal(bar.dispose.callCount, 0);
      assert.equal(baz.dispose.callCount, 0);
      foo.dispose();
      assert(foo.isDisposed());
      assert.equal(bar.dispose.callCount, 1);
      assert.equal(baz.dispose.callCount, 1);
      assert(baz.dispose.calledBefore(bar.dispose));
    });

    it("should dispose on propagated errors", function() {
      let bar2 = new Bar();
      class Foo2 extends Disposable {
        constructor() {
          super();
          this.bar2 = this.autoDispose(bar2);
          this.foo = Foo.create(this, 1);
        }
      }
      let foo2;
      assert.throws(function() { foo2 = Foo2.create(null); }, /test-error/);
      assert.strictEqual(foo2, undefined);
      assert.equal(bar.dispose.callCount, 1);
      assert.equal(baz.dispose.callCount, 0);
      assert.equal(bar2.dispose.callCount, 1);
    });

    class FailOnDispose extends Disposable {
      constructor() {
        super();
        this.bar = this.autoDispose(bar);
        this.foo = this.onDispose(() => { throw new Error("test-error-disposal"); });
      }
    }

    it("should catch but report exceptions during disposal", function() {
      consoleCapture(['error'], messages => {
        let fod = FailOnDispose.create(null);
        assert.equal(bar.dispose.callCount, 0);
        assert.doesNotThrow(() => fod.dispose());
        assert.equal(bar.dispose.callCount, 1);
        assert.deepEqual(messages, [
          "error: While disposing FailOnDispose, error disposing Function: Error: test-error-disposal"
        ]);
      });
    });

    it("should be helpful on exceptions cleaning partially-constructed objects", function() {
      class FailOnConstruct extends Disposable {
        constructor() {
          super();
          this.fod = FailOnDispose.create(this);
          throw new Error("test-error-construct");
        }
        dispose() {
          super.dispose();
          throw new Error("test-error-disposal2");
        }
      }
      consoleCapture(['error'], messages => {
        assert.equal(bar.dispose.callCount, 0);
        assert.throws(() => FailOnConstruct.create(null), /test-error-construct/);
        assert.equal(bar.dispose.callCount, 1);
        assert.deepEqual(messages, [
          "error: While disposing FailOnDispose, error disposing Function: Error: test-error-disposal",
          "error: Error disposing partially constructed FailOnConstruct: Error: test-error-disposal2"
        ]);
      });
    });
  });
});
