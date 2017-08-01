"use strict";

/* global describe, before, after, it */

const dom = require('../lib/dom.js');
const browserGlobals = require('../lib/browserGlobals.js');
const G = browserGlobals.use('document', 'window', 'DocumentFragment');

const assert = require('chai').assert;
const jsdom = require('jsdom');
const sinon = require('sinon');

describe('dom', function() {
  var jsdomDoc;

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
      var elem = dom('div', "Hello world");
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
      var elem = dom('a', { title: "foo", id: "bar" });
      assert.equal(elem.title, "foo");
      assert.equal(elem.id, "bar");
    });

    it("should set children", function() {
      var elem = dom('div',
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
      var values = ['apple', 'orange', ['banana', 'mango']];
      var elem = dom('ul',
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
      var elem = dom('div',
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
      var elem = dom('div',
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
      var spy1 = sinon.spy(), spy2 = sinon.spy(), spy3 = sinon.spy();
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
      var spy1 = sinon.spy(), spy2 = sinon.spy(), spy3 = sinon.spy();
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
      var elem1 = dom.frag("hello", "world");
      assert(elem1 instanceof G.DocumentFragment);
      assert.equal(elem1.childNodes.length, 2);
      assert.equal(elem1.childNodes[0].data, "hello");
      assert.equal(elem1.childNodes[1].data, "world");

      // Same, but using an array.
      var elem2 = dom.frag(["hello", "world"]);
      assert(elem2 instanceof G.DocumentFragment);
      assert.equal(elem2.childNodes.length, 2);
      assert.equal(elem2.childNodes[0].data, "hello");
      assert.equal(elem2.childNodes[1].data, "world");

      // A more complicated structure.
      var elem3 = dom.frag(dom("div"), [dom("span"), "hello"], "world");
      assert.equal(elem3.childNodes.length, 4);
      assert.equal(elem3.childNodes[0].tagName, "DIV");
      assert.equal(elem3.childNodes[1].tagName, "SPAN");
      assert.equal(elem3.childNodes[2].data, "hello");
      assert.equal(elem3.childNodes[3].data, "world");
    });
  });

  describe("dom.methods", function() {
    it("should all be tested, but lets leave it for when they support observables");
  });

});
