"use strict";

/* global describe, it */

var browserGlobals = require('../lib/browserGlobals');

var assert = require('chai').assert;

describe('browserGlobals', function() {

  it('should maintain a stack of globals', function() {
    const G = browserGlobals.G;
    assert.strictEqual(G.window, undefined);
    assert.strictEqual(G.document, undefined);

    let win1 = ['foo'], doc1 = ['bar'];
    browserGlobals.pushGlobals({window: win1, document: doc1});
    assert.strictEqual(G.window, win1);
    assert.strictEqual(G.document, doc1);

    browserGlobals.pushGlobals({window: 'win2', document: 'doc2'});
    assert.strictEqual(G.window, 'win2');
    assert.strictEqual(G.document, 'doc2');

    browserGlobals.popGlobals();
    assert.strictEqual(G.window, win1);
    assert.strictEqual(G.document, doc1);

    browserGlobals.popGlobals();
    assert.strictEqual(G.window, undefined);
    assert.strictEqual(G.document, undefined);

    // Extraneous popGlobals() calls stay at top level without failing.
    browserGlobals.popGlobals();
    browserGlobals.popGlobals();
    browserGlobals.popGlobals();
    assert.strictEqual(G.window, undefined);
    assert.strictEqual(G.document, undefined);
  });
});
