import {dom} from '../../lib/dom';
import {Disposable} from '../../lib/dispose';
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

  it('should dispose owned objects', function() {
    const fooConstruct = sinon.spy();
    const fooDispose = sinon.spy();
    class Foo extends Disposable {
      constructor(public val: string) {
        super();
        fooConstruct.call(this, val);
        this.onDispose(fooDispose, this);
      }
      public render() { return ["world:", this.val]; }
    }
    const obs = observable('foo');
    let f!: Foo;
    const elem = dom('div', 'Hello',
      dom.domComputedOwned(obs, (owner, val) => val && (f = Foo.create(owner, val)).render()));

    const f1 = f;
    assertResetSingleCall(fooConstruct, f1, "foo");
    sinon.assert.notCalled(fooDispose);
    assert.equal(f1.isDisposed(), false);
    assert.equal(elem.innerHTML, 'Hello<!--a-->world:foo<!--b-->');

    obs.set('BAR');
    assert.notEqual(f, f1);      // New object was created
    const f2 = f;
    assertResetSingleCall(fooDispose, f1);
    assertResetSingleCall(fooConstruct, f2, "BAR");
    assert.equal(f1.isDisposed(), true);
    assert.equal(f2.isDisposed(), false);
    assert.equal(elem.innerHTML, 'Hello<!--a-->world:BAR<!--b-->');

    obs.set('');
    assert.strictEqual(f, f2);    // No new object was created
    assertResetSingleCall(fooDispose, f2);
    sinon.assert.notCalled(fooConstruct);
    assert.equal(f2.isDisposed(), true);
    assert.equal(elem.innerHTML, 'Hello<!--a--><!--b-->');

    obs.set('FOO');
    assert.notEqual(f, f2);       // New object was created
    const f3 = f;
    assertResetSingleCall(fooConstruct, f3, "FOO");
    sinon.assert.notCalled(fooDispose);
    assert.equal(f3.isDisposed(), false);
    assert.equal(elem.innerHTML, 'Hello<!--a-->world:FOO<!--b-->');

    dom.domDispose(elem);
    assertResetSingleCall(fooDispose, f3);
    sinon.assert.notCalled(fooConstruct);
    assert.equal(f3.isDisposed(), true);
  });
});
