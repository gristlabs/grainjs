"use strict";
/* global describe, before, it */

const ko = require('knockout');
const assert = require('chai').assert;
const {Emitter} = require('../lib/emit');
const {observable} = require('../lib/observable');
const {computed} = require('../lib/computed');
const {pureComputed} = require('../lib/pureComputed');
const testutil = require('./testutil');

const N = 5000;

function updateTestTitle(test, memUsage) {
  assert.isBelow(memUsage.bytesAtFinish, 8);
  const extra = memUsage.bytesDestroyed < 8 ? "" : `, ${memUsage.bytesDestroyed} leaked`;
  test.title += ` [MEM ${memUsage.bytesCreated} bytes/item${extra}]`;
}

describe('memory', function() {
  this.timeout(30000);
  before(function() { testutil.skipWithoutGC(this); });

  it('should measure memory of ko.computed', function() {
    const kObs = ko.observable(17);
    return testutil.measureMemoryUsage(N, {
      createItem: (i) => ko.computed(() => kObs()),
      destroyItem: (k) => k.dispose(),
    })
    .then(ret => updateTestTitle(this.test, ret));
  });
  it('should measure memory of ko.pureComputed', function() {
    let obs = ko.observable(17);
    return testutil.measureMemoryUsage(N, {
      createItem: (i) => ko.pureComputed(() => obs()),
      destroyItem: (k) => k.dispose(),
    })
    .then(ret => updateTestTitle(this.test, ret));
  });

  it('should measure memory of computed', function() {
    const obs = observable(17);
    return testutil.measureMemoryUsage(N, {
      createItem: (i) => computed(use => use(obs)),
      destroyItem: (c) => c.dispose(),
    })
    .then(ret => updateTestTitle(this.test, ret));
  });

  it('should measure memory of pureComputed', function() {
    const obs = observable(17);
    return testutil.measureMemoryUsage(N, {
      createItem: (i) => pureComputed(use => use(obs)),
      destroyItem: (c) => c.dispose(),
    })
    .then(ret => updateTestTitle(this.test, ret));
  });

  it('should measure memory of Emitter', function() {
    return testutil.measureMemoryUsage(N, {
      createItem: (i) => new Emitter(),
      destroyItem: (e) => e.dispose(),
    })
    .then(ret => updateTestTitle(this.test, ret));
  });
});
