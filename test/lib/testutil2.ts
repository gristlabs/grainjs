import {assert} from 'chai';
import {JSDOM} from 'jsdom';
import * as sinon from 'sinon';
import {popGlobals, pushGlobals} from '../../lib/browserGlobals';

/**
 * Assert that the given spy was called once with a certain context and arguments, and resets its
 * history. Also works for stubs.
 */
export function assertResetSingleCall(spy: sinon.SinonSpy, context: any, ...args: any[]): void {
  sinon.assert.calledOnce(spy);
  sinon.assert.calledOn(spy, context);
  sinon.assert.calledWithExactly(spy, ...args);
  spy.resetHistory();
}

/**
 * Assert the list of first args with which the given spy was called; then resets its history.
 */
export function assertResetFirstArgs(spy: sinon.SinonSpy, ...expFirstArgs: any[]): void {
  assert.deepEqual(spy.args.map((callArgs) => callArgs[0]), expFirstArgs);
  spy.resetHistory();
}

/**
 * Use within a describe() suite to set browserGlobals to a new JSDOM window, and restore at the
 * end of that suite.
 */
export function useJsDomWindow(html?: string) {
  before(function() {
    const dom = new JSDOM(html || "<!doctype html><html><body>" +
      "<div id='a'></div>" +
      "</body></html>");
    pushGlobals(dom.window);
  });

  after(function() {
    popGlobals();
  });
}
