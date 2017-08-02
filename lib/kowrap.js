/**
 * Grain.js observables and computeds are similar to (and mostly inspired by) those in
 * Knockout.js. In fact, they can work together:
 *
 *  kowrap(koObservable)
 *
 * returns a Grain.js observable that mirrors the passed-in Knockout observable (which may be a
 * computed as well). Similarly,
 *
 *  kowrap.ko(observable)
 *
 * returns a Knockout.js observable that mirrows the passed-in Grain observable or computed.
 *
 * In both cases, calling wrap/koWrap twice on the same observable will return the same wrapper,
 * and subscriptions and disposal are appropriately set up to make usage seamless.
 */
"use strict";

const ko = require('knockout');
const observable = require('./observable.js');

const _grainWrapper = Symbol('_grainWrapper');
const _koWrapper = Symbol('_koWrapper');

// Implementation note. Both wrappers are implemented in the same way.
// Regarding disposal: the wrapper is always subscribed to the underlying observable. The
// underlying has a reference to the wrapper. So does any listener to the wrapper. The wrapper can
// be garbage-collected once it has no listeners and the underlying observable is disposed or
// unreferenced.

/**
 * Returns a Grain.js observable which mirrors a Knockout observable.
 */
function fromKnockout(koObservable) {
  let obs = koObservable[_grainWrapper];
  if (!obs) {
    koObservable[_grainWrapper] = obs = observable(koObservable.peek());
    koObservable.subscribe(val => obs.set(val));
  }
  return obs;
}


/**
 * Returns a Knockout observable which mirrors a Grain.js observable.
 */
function toKnockout(observable) {
  let koObs = observable[_koWrapper];
  if (!koObs) {
    observable[_koWrapper] = koObs = ko.observable(observable.get());
    observable.addListener(val => koObs(val));
  }
  return koObs;
}

/**
 * Creates and returns the value of a Knockout observable mirroring the given Grain one.
 * Equivalent to `kowrap.ko(observable)()`.
 */
function koUnwrap(observable) {
  return toKnockout(observable)();
}

module.exports = fromKnockout;
module.exports.ko = toKnockout;
module.exports.koUnwrap = koUnwrap;
