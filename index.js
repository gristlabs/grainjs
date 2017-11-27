"use strict";

const modComputed = require('./lib/computed');
exports.dispose = require('./lib/dispose');
exports.dom = require('./lib/dom');
exports.domevent = require('./lib/domevent');
exports.emit = require('./lib/emit');
exports.kowrap = require('./lib/kowrap');
const modObservable = require('./lib/observable');
exports.subscribe = require('./lib/subscribe');
exports.util = require('./lib/util');

exports.Disposable = exports.dispose.Disposable;
exports.Emitter = exports.emit.Emitter;
exports.computed = modComputed.computed;
exports.Computed = modComputed.Computed;
exports.observable = modObservable.observable;
exports.Observable = modObservable.Observable;
exports.bundleChanges = modObservable.bundleChanges;
