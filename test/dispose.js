"use strict";

/* global describe, it */

const dispose = require('../lib/dispose.js');
const { consoleCapture } = require('./testutil.js');

const assert = require('chai').assert;
const sinon = require('sinon');

describe('dispose', function() {

  function Bar() {
    this.dispose = sinon.spy();
    this.destroy = sinon.spy();
  }

  describe("Disposable", function() {
    it("should dispose objects passed to autoDispose", function() {
      var bar = new Bar();
      var baz = new Bar();
      var baz2 = new Bar();
      var disposer = sinon.spy();
      var cleanup1 = sinon.spy();
      var cleanup2 = sinon.spy();

      class Foo extends dispose.Disposable(Object) {
        constructor() {
          super();
          this.bar = this.autoDispose(bar);
          this.baz = this.autoDisposeWithMethod('destroy', baz);
          this.baz2 = this.autoDisposeWith(disposer, baz2);
          this.autoDisposeCallback(cleanup1);
        }
      }

      var foo = new Foo();
      assert(!foo.isDisposed());
      assert(foo.bar instanceof Bar);
      assert.equal(foo.constructor.name, "Foo");
      assert.equal(Object.getPrototypeOf(Foo).name, "Disposable:Object");

      // We can also use disposal methods outside the constructor.
      foo.autoDisposeCallback(cleanup2);

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
      assert(disposer.calledOn(foo));
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

    it("should mixin with any base class", function() {
      class Foo {
        constructor() {
          this.hello = "hello";
        }
      }
      var cleanup = sinon.spy();
      class Bar extends dispose.Disposable(Foo) {
        constructor() {
          super();
          this.autoDisposeCallback(cleanup);
        }
      }
      var bar = Bar.create();
      assert(!bar.isDisposed());
      assert.equal(bar.hello, "hello");
      assert.equal(bar.constructor.name, "Bar");
      assert.equal(Object.getPrototypeOf(Bar).name, "Disposable:Foo");
      bar.dispose();
      assert.equal(cleanup.callCount, 1);
      assert(cleanup.calledOn(bar));
      assert(bar.isDisposed());
    });

    it("should wipe object, only when requested", function() {
      var bar1 = new Bar();
      var bar2 = new Bar();
      class Foo extends dispose.Disposable(Object) {
        constructor() {
          super();
          this.bar = this.autoDispose(bar1);
        }
      }
      class FooWiped extends dispose.Disposable(Object) {
        constructor() {
          super();
          this.wipeOnDispose();
          this.bar = this.autoDispose(bar2);
        }
      }

      var foo1 = Foo.create();
      var foo2 = FooWiped.create();
      foo1.dispose();
      foo2.dispose();
      assert(foo1.isDisposed());
      assert(foo2.isDisposed());
      assert.strictEqual(foo1.bar, bar1);
      assert.strictEqual(foo2.bar, null);
      assert.equal(bar1.dispose.callCount, 1);
      assert.equal(bar2.dispose.callCount, 1);
    });
  });

  describe("create", function() {
    var bar = new Bar();
    var baz = new Bar();

    class Foo extends dispose.Disposable(Object) {
      constructor(throwWhen) {
        super();
        if (throwWhen === 0) { throw new Error("test-error"); }
        this.bar = this.autoDispose(bar);
        if (throwWhen === 1) { throw new Error("test-error"); }
        this.baz = this.autoDispose(baz);
        if (throwWhen === 2) { throw new Error("test-error"); }
      }
    }

    it("should dispose partially constructed objects", function() {
      consoleCapture(['error'], messages => {
        var foo;
        // If we throw right away, no surprises, nothing gets called.
        assert.throws(function() { foo = Foo.create(0); }, /test-error/);
        assert.strictEqual(foo, undefined);
        assert.equal(bar.dispose.callCount, 0);
        assert.equal(baz.dispose.callCount, 0);

        // If we constructed one object, that one object should have gotten disposed.
        assert.throws(function() { foo = Foo.create(1); }, /test-error/);
        assert.strictEqual(foo, undefined);
        assert.equal(bar.dispose.callCount, 1);
        assert.equal(baz.dispose.callCount, 0);
        bar.dispose.reset();

        // If we constructed two objects, both should have gotten disposed.
        assert.throws(function() { foo = Foo.create(2); }, /test-error/);
        assert.strictEqual(foo, undefined);
        assert.equal(bar.dispose.callCount, 1);
        assert.equal(baz.dispose.callCount, 1);
        assert(baz.dispose.calledBefore(bar.dispose));
        bar.dispose.reset();
        baz.dispose.reset();

        // If we don't throw, then nothing should get disposed until we call .dispose().
        assert.doesNotThrow(function() { foo = Foo.create(3); });
        assert(!foo.isDisposed());
        assert.equal(bar.dispose.callCount, 0);
        assert.equal(baz.dispose.callCount, 0);
        foo.dispose();
        assert(foo.isDisposed());
        assert.equal(bar.dispose.callCount, 1);
        assert.equal(baz.dispose.callCount, 1);
        assert(baz.dispose.calledBefore(bar.dispose));
        bar.dispose.reset();
        baz.dispose.reset();

        assert.deepEqual(messages, [
          "error: Error constructing Foo: Error: test-error",
          "error: Error constructing Foo: Error: test-error",
          "error: Error constructing Foo: Error: test-error",
        ]);
      });
    });

    it("should dispose on propagated errors", function() {
      consoleCapture(['error'], messages => {
        var bar2 = new Bar();
        class Foo2 extends dispose.Disposable(Object) {
          constructor() {
            super();
            this.bar2 = this.autoDispose(bar2);
            this.foo = this.autoDispose(Foo.create(1));
          }
        }
        var foo2;
        assert.throws(function() { foo2 = Foo2.create(); }, /test-error/);
        assert.strictEqual(foo2, undefined);
        assert.equal(bar.dispose.callCount, 1);
        assert.equal(baz.dispose.callCount, 0);
        assert.equal(bar2.dispose.callCount, 1);
        bar.dispose.reset();
        baz.dispose.reset();

        assert.deepEqual(messages, [
          "error: Error constructing Foo: Error: test-error"
        ]);
      });
    });
  });
});
