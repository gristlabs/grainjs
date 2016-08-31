"use strict";

/* global describe, it */

var browserGlobals = require('../lib/browserGlobals.js');

var assert = require('chai').assert;

describe('browserGlobals', function() {

  it('should maintain a stack of globals', function() {
    const g1 = browserGlobals.use('foo', 'bar');
    const g2 = browserGlobals.use('foo');
    const g3 = browserGlobals.use('bar');
    assert.strictEqual(g1.foo, undefined);
    assert.strictEqual(g1.bar, undefined);
    assert.strictEqual(g2.foo, undefined);
    assert.strictEqual(g2.bar, undefined);
    assert.strictEqual(g3.foo, undefined);
    assert.strictEqual(g3.bar, undefined);

    let foo1 = ['foo'], bar1 = ['bar'];
    browserGlobals.pushGlobals({foo: foo1, bar: bar1});

    assert.strictEqual(g1.foo, foo1);
    assert.strictEqual(g1.bar, bar1);
    assert.strictEqual(g2.foo, foo1);
    assert.strictEqual(g2.bar, undefined);
    assert.strictEqual(g3.foo, undefined);
    assert.strictEqual(g3.bar, bar1);

    browserGlobals.pushGlobals({foo: 'foo2', bar: 'bar2'});

    assert.strictEqual(g1.foo, 'foo2');
    assert.strictEqual(g1.bar, 'bar2');
    assert.strictEqual(g2.foo, 'foo2');
    assert.strictEqual(g2.bar, undefined);
    assert.strictEqual(g3.foo, undefined);
    assert.strictEqual(g3.bar, 'bar2');

    browserGlobals.popGlobals();

    assert.strictEqual(g1.foo, foo1);
    assert.strictEqual(g1.bar, bar1);
    assert.strictEqual(g2.foo, foo1);
    assert.strictEqual(g2.bar, undefined);
    assert.strictEqual(g3.foo, undefined);
    assert.strictEqual(g3.bar, bar1);

    browserGlobals.popGlobals();

    assert.strictEqual(g1.foo, undefined);
    assert.strictEqual(g1.bar, undefined);
    assert.strictEqual(g2.foo, undefined);
    assert.strictEqual(g2.bar, undefined);
    assert.strictEqual(g3.foo, undefined);
    assert.strictEqual(g3.bar, undefined);
  });
});
