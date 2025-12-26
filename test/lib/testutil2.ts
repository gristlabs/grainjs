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

export function assertResetSingleCallStrict(spy: sinon.SinonSpy, context: any, ...args: any[]): void {
  assertResetSingleCall(spy, context, ...args.map((a) => sinon.match.same(a)));
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
      "</body></html>",
      {
        url: "http://localhost",
      });
    pushGlobals(dom.window);
  });

  after(function() {
    popGlobals();
  });
}

export type ConsoleMethod = 'log' | 'error' | 'warn' | 'debug' | 'info';
/**
 * Capture console output in the enclosed function. Usage:
 *
 *    return consoleCapture(['log', 'warn'], messages => {
 *      ...
 *      assert.deepEqual(messages, [...]);
 *    });
 *
 * @param methodNames: An array of console's method names to capture, e.g. ['log']
 *    The method name is always prefixed to the captured messages as "method: ".
 *
 * Note that captured messages are an approximation of what console would output: only %s and %d
 * get interpolated in the format string.
 */
export function consoleCapture(methodNames: ConsoleMethod[],
                               bodyFunc: (messages: string[]) => void) {
  const messages: string[] = [];
  methodNames.forEach((m) => sinon.stub(console, m).callsFake(
    (msg?: unknown, ...args) => _capture(messages, m, msg, ...args)));
  try {
    return bodyFunc(messages);
  } finally {
    methodNames.forEach((m) => (console[m] as sinon.SinonStub).restore());
  }
}

function _capture(messages: string[], methodName: string, format: any, ...args: any[]) {
  // Format the message, nice and simple.
  let i = 0;
  if (typeof format === 'string') {
    format = format.replace(/%s|%d/g, () => args[i++]);
  }
  let message = methodName + ': ' + format;
  for (; i < args.length; i++) {
    message += ' ' + args[i];
  }
  messages.push(message);
}
