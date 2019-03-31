import {dom} from '../../lib/dom';
import {observable} from '../../lib/observable';
import {assertResetSingleCall, useJsDomWindow} from './testutil2';

import {assert} from 'chai';
import * as sinon from 'sinon';

describe("domComputed", function() {
  useJsDomWindow();

  it("should be possible to nest", function() {
    const obs1 = observable("foo");
    const obs2 = observable("bar");
    const spyCreate = sinon.spy();
    const spyDispose = sinon.spy();
    const elem = dom('div', 'Hello',
      dom.domComputed(obs1, (val1) =>
        dom.domComputed(obs2, (val2) => {
          spyCreate(val1, val2);
          return dom('div',
            dom.onDispose(() => spyDispose(val1, val2)),
            val1, ":", val2,
          );
        }),
      ),
      'World',
    );

    assert.equal(elem.innerHTML, 'Hello<!--a--><!--a--><div>foo:bar</div><!--b--><!--b-->World');
    sinon.assert.notCalled(spyDispose);
    assertResetSingleCall(spyCreate, undefined, "foo", "bar");

    // This will cause a second call to the inner domComputed().
    obs1.set("FOO");
    assert.equal(elem.innerHTML, 'Hello<!--a--><!--a--><div>FOO:bar</div><!--b--><!--b-->World');
    assertResetSingleCall(spyDispose, undefined, "foo", "bar");
    assertResetSingleCall(spyCreate, undefined, "FOO", "bar");

    // If the second call to domComputed() doesn't clear the subscription created by the first
    // call, this will trigger two calls to spyCreate() rather than one.
    obs2.set("BAR");
    assert.equal(elem.innerHTML, 'Hello<!--a--><!--a--><div>FOO:BAR</div><!--b--><!--b-->World');
    assertResetSingleCall(spyDispose, undefined, "FOO", "bar");
    assertResetSingleCall(spyCreate, undefined, "FOO", "BAR");
  });

  it("should dispose even on a later exception", function() {
    const obs1 = observable("foo");
    const obs2 = observable("bar");
    const spyDispose = sinon.spy();
    assert.throws(() =>
      dom('div', 'Hello',
        dom.domComputed(obs1, (val1) => dom('p', dom.onDispose(() => spyDispose(val1)), val1)),
        dom.domComputed(obs2, (val2) => { throw new Error("fake-error"); }),
        'World',
      ),
      /fake-error/,
    );
    assertResetSingleCall(spyDispose, undefined, "foo");
  });
});
