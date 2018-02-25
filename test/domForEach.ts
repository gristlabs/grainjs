import {popGlobals, pushGlobals} from '../lib/browserGlobals';
import {dom} from '../lib/dom';
import {obsArray} from '../lib/obsArray';
import {observable} from '../lib/observable';
import {assertResetFirstArgs} from './testutil';

import {assert} from 'chai';
import {JSDOM} from 'jsdom';
import * as sinon from 'sinon';

describe("foreach", function() {
  let jsdomDoc;

  before(function() {
    jsdomDoc = new JSDOM("<!doctype html><html><body></body></html>");
    pushGlobals(jsdomDoc.window);
  });

  after(function() {
    popGlobals();
  });

  it("should work with obsArray", function() {
    const model = obsArray<string>(["a", "b", "c"]);
    const spy = sinon.spy((item: string) => dom('span', ':', item));

    // Make sure the loop notices elements already in the model.
    const elem = dom('div', "[", dom.forEach(model, spy), "]");

    assert.equal(elem.textContent, "[:a:b:c]");
    assertResetFirstArgs(spy, "a", "b", "c");

    // Delete all elements.
    model.splice(0);
    assert.equal(elem.textContent, "[]");
    assertResetFirstArgs(spy);

    // Test push.
    model.push("hello");
    assert.equal(elem.textContent, "[:hello]");
    assertResetFirstArgs(spy, "hello");
    model.push("world");
    assert.equal(elem.textContent, "[:hello:world]");
    assertResetFirstArgs(spy, "world");

    // Test splice that replaces some elements with more.
    model.splice(0, 1, "foo", "bar", "baz");
    assert.equal(elem.textContent, "[:foo:bar:baz:world]");
    assertResetFirstArgs(spy, "foo", "bar", "baz");

    // Test splice which removes some elements.
    model.splice(-3, 2);
    assert.equal(elem.textContent, "[:foo:world]");
    assertResetFirstArgs(spy);

    // Test splice which adds some elements in the middle.
    model.splice(1, 0, "test2", "test3");
    assert.equal(elem.textContent, "[:foo:test2:test3:world]");
    assertResetFirstArgs(spy, "test2", "test3");
  });

  it("should work when items disappear from under it", function() {
    const elements = [dom('span', 'a'), dom('span', 'b'), dom('span', 'c')];
    const model = obsArray<Node>([...elements]);    // Clone the array on creation.
    const elem = dom('div', '[', dom.forEach(model, (item) => item), ']');
    assert.equal(elem.textContent, "[abc]");

    // Plain splice out.
    let removed = model.splice(1, 1);
    assert.deepEqual(removed, [elements[1]]);
    assert.deepEqual(model.get(), [elements[0], elements[2]]);
    assert.equal(elem.textContent, "[ac]");

    // Splice it back in.
    model.splice(1, 0, elements[1]);
    assert.equal(elem.textContent, "[abc]");

    // Now remove the element from DOM manually.
    elem.removeChild(elements[1]);
    assert.equal(elem.textContent, "[ac]");
    assert.deepEqual(model.get(), elements);

    // Use splice again, and make sure it still does the right thing.
    removed = model.splice(2, 1);
    assert.deepEqual(removed, [elements[2]]);
    assert.deepEqual(model.get(), [elements[0], elements[1]]);
    assert.equal(elem.textContent, "[a]");

    removed = model.splice(0, 2);
    assert.deepEqual(removed, [elements[0], elements[1]]);
    assert.deepEqual(model.get(), []);
    assert.equal(elem.textContent, "[]");
  });

  it("should work when items are null", function() {
    const model = obsArray<string|null>([]);
    const elem = dom('div', '[',
      dom.forEach(model, (item) => item === null ? null : dom('span', item)),
      ']');
    assert.equal(elem.textContent, "[]");

    model.push("a", "b", "c");
    assert.equal(elem.textContent, "[abc]");

    const childCount = elem.childNodes.length;
    model.splice(1, 1, null);
    assert.equal(elem.childNodes.length, childCount - 1);   // One child removed, none added.
    assert.equal(elem.textContent, "[ac]");

    model.splice(1, 0, "x");
    assert.equal(elem.textContent, "[axc]");

    model.splice(3, 0, "y");
    assert.equal(elem.textContent, "[axyc]");

    model.splice(1, 2);
    assert.equal(elem.textContent, "[ayc]");

    model.splice(0, 3);
    assert.equal(elem.textContent, "[]");
  });

  it("should call domDispose for removed items", function() {
    const model = obsArray<string>(["a", "b", "c"]);
    const dspy = sinon.spy();

    // Make sure the loop notices elements already in the model.
    const elem = dom('div', "[",
      dom.forEach(model, (item: string) => dom('span', ':', item, dom.onDispose((el) => dspy(el.textContent)))),
      "]");

    assert.equal(elem.textContent, "[:a:b:c]");

    // Delete all elements.
    model.splice(0);
    assert.equal(elem.textContent, "[]");
    assertResetFirstArgs(dspy, ":a", ":b", ":c");

    // Test push.
    model.push("hello", "world");
    assert.equal(elem.textContent, "[:hello:world]");
    assertResetFirstArgs(dspy);

    // Test splice that replaces some elements with more.
    model.splice(0, 1, "foo", "bar", "baz");
    assert.equal(elem.textContent, "[:foo:bar:baz:world]");
    assertResetFirstArgs(dspy, ":hello");

    // Test splice which removes some elements.
    model.splice(-3, 2);
    assert.equal(elem.textContent, "[:foo:world]");
    assertResetFirstArgs(dspy, ":bar", ":baz");

    // Test splice which adds some elements in the middle.
    model.splice(1, 0, "test2", "test3");
    assert.equal(elem.textContent, "[:foo:test2:test3:world]");
    assertResetFirstArgs(dspy);
  });

  it("should dispose subscribables for detached nodes", function() {
    const obs = observable("AAA");
    const spy = sinon.spy((x: string) => x);
    const data = obsArray([observable("foo"), observable("bar")]);

    const elem = dom('div', dom.forEach(data, (item) =>
      dom('div', dom.text((use) => spy(use(item) + ":" + use(obs))))));

    assert.equal(elem.innerHTML, '<!--a--><div>foo:AAA</div><div>bar:AAA</div><!--b-->');
    obs.set("BBB");
    assert.equal(elem.innerHTML, '<!--a--><div>foo:BBB</div><div>bar:BBB</div><!--b-->');
    data.splice(1, 1);
    assert.equal(elem.innerHTML, '<!--a--><div>foo:BBB</div><!--b-->');
    spy.resetHistory();
    // Below is the core of the test: we are checking that the computed observable created for
    // the second item of the array ("bar") does NOT trigger a call to the spy.
    obs.set("CCC");
    assert.equal(elem.innerHTML, '<!--a--><div>foo:CCC</div><!--b-->');
    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, "foo:CCC");
  });
});
