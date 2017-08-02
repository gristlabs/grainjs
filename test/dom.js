"use strict";

/* global describe, before, after, it */

const dom = require('../lib/dom.js');
const observable = require('../lib/observable.js');
const computed = require('../lib/computed.js');
const browserGlobals = require('../lib/browserGlobals.js');
const { assertResetSingleCall } = require('./testutil.js');
const G = browserGlobals.use('document', 'window', 'DocumentFragment');

const assert = require('chai').assert;
const jsdom = require('jsdom');
const sinon = require('sinon');

describe('dom', function() {
  let jsdomDoc;

  before(function() {
    jsdomDoc = jsdom.jsdom("<!doctype html><html><body>" +
      "<div id='a'></div>" +
      "</body></html>");
    browserGlobals.pushGlobals(jsdomDoc.defaultView);
  });

  after(function() {
    browserGlobals.popGlobals();
  });

  describe("construction", function() {
    it("should create elements with the right tag name, class and ID", function() {
      let elem = dom('div', "Hello world");
      assert.equal(elem.tagName, "DIV");
      assert(!elem.className);
      assert(!elem.id);
      assert.equal(elem.textContent, "Hello world");

      elem = dom('span#foo.bar.baz', "Hello world");
      assert.equal(elem.tagName, "SPAN");
      assert.equal(elem.className, "bar baz");
      assert.equal(elem.id, "foo");
      assert.equal(elem.textContent, "Hello world");
    });

    it("should set attributes", function() {
      let elem = dom('a', { title: "foo", id: "bar" });
      assert.equal(elem.title, "foo");
      assert.equal(elem.id, "bar");
    });

    it("should set children", function() {
      let elem = dom('div',
                     "foo", dom('a#a'),
                     [dom('a#b'), "bar", dom('a#c')],
                     dom.frag(dom('a#d'), "baz", dom('a#e')));
      assert.equal(elem.childNodes.length, 8);
      assert.equal(elem.childNodes[0].data, "foo");
      assert.equal(elem.childNodes[1].id, "a");
      assert.equal(elem.childNodes[2].id, "b");
      assert.equal(elem.childNodes[3].data, "bar");
      assert.equal(elem.childNodes[4].id, "c");
      assert.equal(elem.childNodes[5].id, "d");
      assert.equal(elem.childNodes[6].data, "baz");
      assert.equal(elem.childNodes[7].id, "e");
    });

    it('should flatten nested arrays and arrays returned from functions', function() {
      let values = ['apple', 'orange', ['banana', 'mango']];
      let elem = dom('ul',
        values.map(value => dom('li', value)),
        [
          dom('li', 'pear'),
          [ dom('li', 'peach'), dom('li', 'cranberry') ],
          dom('li', 'date')
        ]
      );

      assert.equal(elem.outerHTML, "<ul><li>apple</li><li>orange</li>" +
        "<li>bananamango</li><li>pear</li><li>peach</li><li>cranberry</li>" +
        "<li>date</li></ul>");

      elem = dom('ul',
        (el) => [ dom('li', 'plum'), dom('li', 'pomegranate') ],
        (el) => (el2) => [ dom('li', 'strawberry'), dom('li', 'blueberry') ]
      );
      assert.equal(elem.outerHTML, "<ul><li>plum</li><li>pomegranate</li>" +
        "<li>strawberry</li><li>blueberry</li></ul>");
    });

    it("should append append values returned from functions except undefined", function() {
      let elem = dom('div',
        function(divElem) {
          divElem.classList.add('yogurt');
          return dom('div', 'sneakers');
        },
        dom('span', 'melon')
      );

      assert.equal(elem.outerHTML, '<div class="yogurt">' +
        '<div>sneakers</div><span>melon</span></div>',
        'function shold have applied new class to outer div');

      elem = dom('div', function(divElem) {});
      assert.equal(elem.outerHTML, '<div></div>',
        "undefined returned from a function should not be added to the DOM tree");
    });

    it('should not append nulls', function() {
      let elem = dom('div',
        [ "hello", null, "world", null, "jazz" ],
        'hands', null
      );
      assert.equal(elem.childNodes.length, 4,
        "undefined returned from a function should not be added to the DOM tree");
      assert.equal(elem.childNodes[0].data, "hello");
      assert.equal(elem.childNodes[1].data, "world");
      assert.equal(elem.childNodes[2].data, "jazz");
      assert.equal(elem.childNodes[3].data, "hands");
    });
  });

  describe("dom.dispose", function() {
    it("should call disposers on elem and descendants", function() {
      let spy1 = sinon.spy(), spy2 = sinon.spy(), spy3 = sinon.spy();
      let div, span, b, u;
      div = dom('div', dom.onDispose(spy1),
        span = dom('span', dom.onDispose(spy2),
          b = dom('b', 'hello'),
          u = dom('u', 'world', dom.onDispose(spy3))));

      dom.dispose(div);
      sinon.assert.calledOnce(spy1);
      sinon.assert.calledWithExactly(spy1, div);
      sinon.assert.calledOnce(spy2);
      sinon.assert.calledWithExactly(spy2, span);
      sinon.assert.calledOnce(spy3);
      sinon.assert.calledWithExactly(spy3, u);
      assert(spy3.calledBefore(spy2));
      assert(spy2.calledBefore(spy1));
    });

    it("should call multiple disposers on a single element", function() {
      let spy1 = sinon.spy(), spy2 = sinon.spy(), spy3 = sinon.spy();
      let div, span;
      div = dom('div', dom.onDispose(spy1),
        span = dom('span', dom.onDispose(spy2), dom.onDispose(spy3)));

      dom.dispose(div);
      sinon.assert.calledOnce(spy1);
      sinon.assert.calledWithExactly(spy1, div);
      sinon.assert.calledOnce(spy2);
      sinon.assert.calledWithExactly(spy2, span);
      sinon.assert.calledOnce(spy3);
      sinon.assert.calledWithExactly(spy3, span);
      assert(spy3.calledBefore(spy2));
      assert(spy2.calledBefore(spy1));
    });
  });

  describe("dom.svg", function() {
    it("should create svg elements", function() {
      let elem = dom.svg('svg#foo.bar.baz');
      assert.equal(elem.tagName, 'svg');
      assert.equal(elem.namespaceURI, 'http://www.w3.org/2000/svg');
      assert.equal(elem.id, 'foo');
      assert.deepEqual(Array.from(elem.classList), ['bar', 'baz']);
    });
  });

  describe("dom.frag", function() {
    it("should create DocumentFragments", function() {
      let elem1 = dom.frag("hello", "world");
      assert(elem1 instanceof G.DocumentFragment);
      assert.equal(elem1.childNodes.length, 2);
      assert.equal(elem1.childNodes[0].data, "hello");
      assert.equal(elem1.childNodes[1].data, "world");

      // Same, but using an array.
      let elem2 = dom.frag(["hello", "world"]);
      assert(elem2 instanceof G.DocumentFragment);
      assert.equal(elem2.childNodes.length, 2);
      assert.equal(elem2.childNodes[0].data, "hello");
      assert.equal(elem2.childNodes[1].data, "world");

      // A more complicated structure.
      let elem3 = dom.frag(dom("div"), [dom("span"), "hello"], "world");
      assert.equal(elem3.childNodes.length, 4);
      assert.equal(elem3.childNodes[0].tagName, "DIV");
      assert.equal(elem3.childNodes[1].tagName, "SPAN");
      assert.equal(elem3.childNodes[2].data, "hello");
      assert.equal(elem3.childNodes[3].data, "world");
    });
  });

  describe("simple methods", function() {
    it("should update dynamically", function() {
      let obs = observable('bar');
      let width = observable(17);
      let child1, child2;
      let elem = dom('div',
                     dom.attr('a1', 'foo'),
                     dom.attr('a2', obs),
                     dom.attr('a3', use => "a3" + use(obs)),
                     dom.boolAttr('b1', obs),
                     dom.prop('value', use => "prop" + use(obs) + use(width)),
                     dom.text(obs),
                     dom.style('width', use => use(width) + 'px'),
                     dom.toggleClass('isbar', use => use(obs) === 'bar'),
                     dom.cssClass(use => 'class' + use(obs)),
                     child1 = dom('span', dom.hide(use => use(width) < 10)),
                     child2 = dom('span', dom.show(use => use(width) < 10)));

      assert.equal(elem.getAttribute('a1'), 'foo');
      assert.equal(elem.getAttribute('a2'), 'bar');
      assert.equal(elem.getAttribute('a3'), 'a3bar');
      assert.equal(elem.getAttribute('b1'), '');
      assert.equal(elem.value, 'propbar17');
      assert.equal(elem.textContent, 'bar');
      assert.equal(elem.style.width, '17px');
      assert.equal(elem.className, 'isbar classbar');
      assert.equal(child1.style.display, '');
      assert.equal(child2.style.display, 'none');

      obs.set('BAZ');
      width.set('34');
      assert.equal(elem.getAttribute('a1'), 'foo');
      assert.equal(elem.getAttribute('a2'), 'BAZ');
      assert.equal(elem.getAttribute('a3'), 'a3BAZ');
      assert.equal(elem.getAttribute('b1'), '');
      assert.equal(elem.value, 'propBAZ34');
      assert.equal(elem.textContent, 'BAZ');
      assert.equal(elem.style.width, '34px');
      assert.equal(elem.className, 'classBAZ');

      obs.set('');
      assert.equal(elem.hasAttribute('b1'), false);
      assert.equal(elem.value, 'prop34');

      obs.set('bar');
      assert.equal(elem.hasAttribute('b1'), true);
      assert.equal(elem.value, 'propbar34');
      assert.equal(elem.className, 'classbar isbar');
      assert.equal(child1.style.display, '');
      assert.equal(child2.style.display, 'none');

      width.set(5);
      assert.equal(elem.style.width, '5px');
      assert.equal(elem.value, 'propbar5');
      assert.equal(child1.style.display, 'none');
      assert.equal(child2.style.display, '');
    });

    it('should auto-dispose subscriptions', function() {
      let spy1 = sinon.stub().returnsArg(0),
          spy2 = sinon.stub().returnsArg(0),
          spy3 = sinon.stub().returnsArg(0);
      let obs = observable('foo');
      let comp = computed(obs, (use, obs) => spy1(obs.toUpperCase()));
      let elem = dom('div',
                     dom.attr('aaa', obs),
                     dom.prop('bbb', use => spy2("bbb" + use(obs))),
                     dom.style('ccc', comp),
                     dom.autoDispose(comp),
                     dom.boolAttr('bool', use => spy3(use(comp) === "FOO")));

      assert.equal(elem.getAttribute('aaa'), 'foo');
      assert.equal(elem.bbb, 'bbbfoo');
      assert.equal(elem.style.ccc, 'FOO');
      assert.equal(elem.hasAttribute('bool'), true);
      assertResetSingleCall(spy1, undefined, "FOO");
      assertResetSingleCall(spy2, undefined, "bbbfoo");
      assertResetSingleCall(spy3, undefined, true);

      obs.set('bar');
      assert.equal(comp.get(), 'BAR');

      assert.equal(elem.getAttribute('aaa'), 'bar');
      assert.equal(elem.bbb, 'bbbbar');
      assert.equal(elem.style.ccc, 'BAR');
      assert.equal(elem.hasAttribute('bool'), false);
      assertResetSingleCall(spy1, undefined, "BAR");
      assertResetSingleCall(spy2, undefined, "bbbbar");
      assertResetSingleCall(spy3, undefined, false);

      dom.dispose(elem);
      obs.set('foo');
      sinon.assert.notCalled(spy1);
      sinon.assert.notCalled(spy2);
      sinon.assert.notCalled(spy3);
    });
  });
});
