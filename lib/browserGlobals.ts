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

export interface IBrowserGlobals {
  DocumentFragment: typeof DocumentFragment;
  Element: typeof Element;
  Node: typeof Node;
  document: typeof document;
  window: typeof window;
}

function _updateGlobals(dest: IBrowserGlobals, source: IBrowserGlobals): void {
  dest.DocumentFragment  = source.DocumentFragment;
  dest.Element           = source.Element;
  dest.Node              = source.Node;
  dest.document          = source.document;
  dest.window            = source.window;
}

// The initial IBrowserGlobals object.
const initial: IBrowserGlobals = {} as IBrowserGlobals;
_updateGlobals(initial, (typeof window !== 'undefined' ? window as any : {}));

// The globals G object strats out with a copy of `initial`.
export const G: IBrowserGlobals = { ...initial };

// The stack of globals that always has the intial object, but which may be overridden.
const _globalsStack: IBrowserGlobals[] = [initial];

/**
 * Replace globals with those from the given object. Use popGlobals() to restore previous values.
 */
export function pushGlobals(globals: IBrowserGlobals): void {
  _globalsStack.push(globals);
  _updateGlobals(G, globals);
}

/**
 * Restore the values of globals to undo the preceding pushGlobals() call.
 */
export function popGlobals(): void {
  if (_globalsStack.length > 1) {
    _globalsStack.pop();
  }
  _updateGlobals(G, _globalsStack[_globalsStack.length - 1]);
}
