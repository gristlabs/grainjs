"use strict";

/* global describe, it, before */

const assert = require('chai').assert;
const testutil = require('./testutil.js');

describe('testutil', function() {
  describe('consoleCapture', function() {
    it('should capture formatted messages', () => {
      let ret = testutil.consoleCapture(messages => {
        function Foo() {}
        console.log('test1 %d: %s; %s', 17, "Hello world", new Foo());
        console.log('test2 %d: %s.', 17, ['hello', 'world'], {hello: 'world'}, 18);
        console.log('test3', 17, ['hello', 'world']);
        console.log(17, 'test4', ['hello', 'world']);
        console.log({'foo%s': 'bar'}, 17, new Foo());
        assert.deepEqual(messages, [
          "log: test1 17: Hello world; [object Object]",
          "log: test2 17: hello,world. [object Object] 18",
          "log: test3 17 hello,world",
          "log: 17 test4 hello,world",
          "log: [object Object] 17 [object Object]",
        ]);
        return 'foo';
      });
      assert.strictEqual(ret, 'foo');
    });

    it('should respect the first argument', () => {
      testutil.consoleCapture(['log', 'warn', 'error'], messages => {
        function Foo() {}
        console.warn('test1 %d: %s; %s', 17, "Hello world", new Foo());
        console.error('test2 %d: %s.', 17, ['hello', 'world'], {hello: 'world'}, 18);
        console.log({'foo%s': 'bar'}, 17, new Foo());
        assert.deepEqual(messages, [
          "warn: test1 17: Hello world; [object Object]",
          "error: test2 17: hello,world. [object Object] 18",
          "log: [object Object] 17 [object Object]",
        ]);
      });
    });
  });

  describe('measureMemoryUsage', function() {
    this.timeout(60000);

    before(function() {
      testutil.skipWithoutGC(this);
    });

    it('should measure simple things correctly', function() {
      return testutil.measureMemoryUsage(100000, { createItem: (i) => [i] })
      .then(ret => {
        assert.closeTo(ret.bytesCreated, 60, 40);
        assert.closeTo(ret.bytesDestroyed, 0, 5);
        assert.closeTo(ret.bytesAtFinish, 0, 5);
      })
      .then(() => testutil.measureMemoryUsage(100000, { createItem: (i) => ({a: i}) }))
      .then(ret => {
        assert.closeTo(ret.bytesCreated, 60, 40);
        assert.closeTo(ret.bytesDestroyed, 0, 5);
        assert.closeTo(ret.bytesAtFinish, 0, 5);
      });
    });

    it('should detect when values are not garbage-collected', function() {
      let array = [];
      class FooPlain {
        constructor(i) {
          this.value = i;
        }
      }
      class FooWithLeak {
        constructor(i) {
          this.value = i;
          array.push(this);
        }
      }

      return testutil.measureMemoryUsage(10000, {
        createItem: (i) => new FooPlain(i),
        after: () => { array = []; }
      })
      .then(ret => {
        assert.closeTo(ret.bytesCreated, 60, 40);
        assert.closeTo(ret.bytesDestroyed, 0, 5);
        assert.closeTo(ret.bytesAtFinish, 0, 5);
      })
      .then(() => testutil.measureMemoryUsage(10000, {
        createItem: (i) => new FooWithLeak(i),
        after: () => { array = []; }
      }))
      .then(ret => {
        assert.closeTo(ret.bytesCreated, 60, 40);
        assert.closeTo(ret.bytesDestroyed, 60, 40);
        assert.closeTo(ret.bytesAtFinish, 0, 5);
      });
    });
  });

});
