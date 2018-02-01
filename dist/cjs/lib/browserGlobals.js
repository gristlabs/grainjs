"use strict";
/**
 * Module that allows client-side code to use browser globals (such as `document` or `Node`) in a
 * way that allows those globals to be replaced by mocks in browser-less tests.
 *
 *    import {G} from 'browserGlobals';
 *    ... use G.document
 *    ... use G.Node
 *
 * Initially, the global `window` object, is the source of the global values.
 *
 * To use a mock of globals in a test, use:
 *
 *    import {pushGlobals, popGlobals} as G from 'browserGlobals';
 *    before(function() {
 *      pushGlobals(mockWindow);    // e.g. jsdom.jsdom(...).defaultView
 *    });
 *    after(function() {
 *      popGlobals();
 *    });
 */
Object.defineProperty(exports, "__esModule", { value: true });
function _updateGlobals(dest, source) {
    dest.DocumentFragment = source.DocumentFragment;
    dest.Element = source.Element;
    dest.Node = source.Node;
    dest.document = source.document;
    dest.window = source.window;
}
// The initial IBrowserGlobals object.
const initial = {};
_updateGlobals(initial, (typeof window !== 'undefined' ? window : {}));
// The globals G object strats out with a copy of `initial`.
exports.G = Object.assign({}, initial);
// The stack of globals that always has the intial object, but which may be overridden.
const _globalsStack = [initial];
/**
 * Replace globals with those from the given object. Use popGlobals() to restore previous values.
 */
function pushGlobals(globals) {
    _globalsStack.push(globals);
    _updateGlobals(exports.G, globals);
}
exports.pushGlobals = pushGlobals;
/**
 * Restore the values of globals to undo the preceding pushGlobals() call.
 */
function popGlobals() {
    if (_globalsStack.length > 1) {
        _globalsStack.pop();
    }
    _updateGlobals(exports.G, _globalsStack[_globalsStack.length - 1]);
}
exports.popGlobals = popGlobals;
