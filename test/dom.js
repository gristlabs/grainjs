"use strict";

/* global describe, before, after, it */

const {dom} = require('../lib/dom');
const {observable} = require('../lib/observable');
const {computed} = require('../lib/computed');
const {G, pushGlobals, popGlobals} = require('../lib/browserGlobals');
const { assertResetSingleCall, consoleCapture } = require('./testutil');

const assert = require('chai').assert;
const { JSDOM } = require('jsdom');
const sinon = require('sinon');

describe('dom', function() {
  let jsdomDoc;

  before(function() {
    jsdomDoc = new JSDOM("<!doctype html><html><body>" +
      "<div id='a'></div>" +
      "</body></html>");
    pushGlobals(jsdomDoc.window);
  });

  after(function() {
    popGlobals();
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

  describe("dom.domDispose", function() {
    it("should call disposers on elem and descendants", function() {
      let spy1 = sinon.spy(), spy2 = sinon.spy(), spy3 = sinon.spy();
      let div, span, b, u;
      div = dom('div', dom.onDispose(spy1),
        span = dom('span', dom.onDispose(spy2),
          b = dom('b', 'hello'),
          u = dom('u', 'world', dom.onDispose(spy3))));

      dom.domDispose(div);
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

      dom.domDispose(div);
      sinon.assert.calledOnce(spy1);
      sinon.assert.calledWithExactly(spy1, div);
      sinon.assert.calledOnce(spy2);
      sinon.assert.calledWithExactly(spy2, span);
      sinon.assert.calledOnce(spy3);
      sinon.assert.calledWithExactly(spy3, span);
      assert(spy3.calledBefore(spy2));
      assert(spy2.calledBefore(spy1));
    });

    it("should call disposers when a function argument throws exception", function() {
      let spy1 = sinon.spy(), spy2 = sinon.spy(), spy3 = sinon.spy(), spy4 = sinon.spy();
      let div, span, input;
      assert.throws(() =>
        div = dom('div', dom.onDispose(spy1),
          span = dom('span',
            dom.onDispose(spy2),
            input = dom('input', dom.onDispose(spy3)),
            elem => { throw new Error("fake"); },
            dom.onDispose(spy4))),
        /fake/);
      // We don't have div and span set, but they are still passed to dispose functions.
      sinon.assert.notCalled(spy1);
      sinon.assert.calledOnce(spy2);
      sinon.assert.calledWithExactly(spy2, sinon.match.has('tagName', 'SPAN'));
      sinon.assert.calledOnce(spy3);
      sinon.assert.calledWithExactly(spy3, sinon.match.has('tagName', 'INPUT'));
      sinon.assert.notCalled(spy4);
      assert.isTrue(spy3.calledBefore(spy2));
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

    it('should support associating data with DOM', function() {
      let val = {1:2};
      let obs1 = observable('bar');
      let obs2 = observable(val);
      let elem = dom('div',
        dom.data('obs1', obs1),
        dom.data('obs2', obs2));
      assert.strictEqual(dom.getData(elem, 'obs1'), 'bar');
      assert.strictEqual(dom.getData(elem, 'obs2'), val);

      obs1.set('foo');
      assert.strictEqual(dom.getData(elem, 'obs1'), 'foo');
      assert.strictEqual(dom.getData(elem, 'obs2'), val);

      val = {3:4};
      obs2.set(val);
      assert.strictEqual(dom.getData(elem, 'obs1'), 'foo');
      assert.strictEqual(dom.getData(elem, 'obs2'), val);

      obs1.set(undefined);
      assert.strictEqual(dom.getData(elem, 'obs1'), undefined);
      obs1.set('foo');
      assert.strictEqual(dom.getData(elem, 'obs1'), 'foo');

      dom.domDispose(elem);
      obs1.set('bar');
      assert.strictEqual(dom.getData(elem, 'obs1'), undefined);
      assert.strictEqual(dom.getData(elem, 'obs2'), undefined);
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

      // Check that DOM gets updated and computed-functions called.
      assert.equal(elem.getAttribute('aaa'), 'bar');
      assert.equal(elem.bbb, 'bbbbar');
      assert.equal(elem.style.ccc, 'BAR');
      assert.equal(elem.hasAttribute('bool'), false);
      assertResetSingleCall(spy1, undefined, "BAR");
      assertResetSingleCall(spy2, undefined, "bbbbar");
      assertResetSingleCall(spy3, undefined, false);

      // Once disposed, check that computed-functions do not get called.
      dom.domDispose(elem);
      obs.set('foo');
      sinon.assert.notCalled(spy1);   // comp doesn't get called because of dom.autoDispose(comp).
      sinon.assert.notCalled(spy2);
      sinon.assert.notCalled(spy3);
    });
  });

  describe("component", function() {
    class Comp extends dom.Component {
      render(arg, spies) {
        spies.onConstruct(arg);
        this.onDispose(() => spies.onDispose());
        this.fakeAttr = "fakeAttr";   // This should NOT become an attribute.
        return dom('div', dom.toggleClass(arg.toUpperCase(), true),
          spies.onRender,
          dom.onDispose(spies.onDomDispose));
      }
    }

    function makeSpies() {
      return {
        onConstruct: sinon.spy(),
        onDispose: sinon.spy(),
        onRender: sinon.spy(),
        onDomDispose: sinon.spy(),
      };
    }

    it("should call render and disposers correctly", function() {
      let spies1 = makeSpies(), spies2 = makeSpies();

      let elem = dom('div', 'Hello',
        dom.create(Comp, 'foo', spies1),
        dom.create(Comp, 'bar', spies2),
        { realattr: "a" },
        'World');

      assertResetSingleCall(spies1.onConstruct, spies1, 'foo');
      assertResetSingleCall(spies2.onConstruct, spies2, 'bar');
      assertResetSingleCall(spies1.onRender, undefined, sinon.match.has('className', 'FOO'));
      assertResetSingleCall(spies2.onRender, undefined, sinon.match.has('className', 'BAR'));
      dom.domDispose(elem);
      assertResetSingleCall(spies1.onDispose, spies1);
      assertResetSingleCall(spies2.onDispose, spies2);
      assertResetSingleCall(spies1.onDomDispose, undefined, sinon.match.has('className', 'FOO'));
      assertResetSingleCall(spies2.onDomDispose, undefined, sinon.match.has('className', 'BAR'));

      // This verifies, in particular, that we don't treat the component as an object with a bunch
      // of attributes, but do treat plain objects as attributes.
      assert.equal(elem.outerHTML,
        '<div realattr="a">Hello<!--A--><div class="FOO"></div><!--B-->' +
        '<!--A--><div class="BAR"></div><!--B-->World</div>');
    });

    it('should dispose even on a later exception', function() {
      let spies1 = makeSpies(), spies2 = makeSpies();
      spies2.onConstruct = sinon.stub().throws(new Error('ctor throw'));

      consoleCapture(['error'], messages => {
        assert.throws(() =>
          dom('div', 'Hello',
            dom.create(Comp, 'foo', spies1),
            dom.create(Comp, 'bar', spies2),
            'World'
          ),
          /ctor throw/
        );
      });
      assertResetSingleCall(spies1.onConstruct, spies1, 'foo');
      assertResetSingleCall(spies1.onRender, undefined, sinon.match.has('className', 'FOO'));
      assertResetSingleCall(spies1.onDispose, spies1);
      assertResetSingleCall(spies1.onDomDispose, undefined, sinon.match.has('className', 'FOO'));
      // The second component has an exception during construction.
      assertResetSingleCall(spies2.onConstruct, spies2, 'bar');
      sinon.assert.notCalled(spies2.onRender);
      sinon.assert.notCalled(spies2.onDispose);
      sinon.assert.notCalled(spies2.onDomDispose);
    });

    it('should solve an issue with inline construction', function() {
      // Test the NOT-recommended way, to explain the problem with it.
      // [Keep this case identical to the above except for how components are constructed!]
      let spies1 = makeSpies(), spies2 = makeSpies();
      spies2.onConstruct = sinon.stub().throws(new Error('ctor throw'));

      // Simulate the explanatory example in the comment to createElem() to show the problem, and
      // compare with the previous test case. The approach here is to create a class that can be
      // separately created and inserted into DOM by reusing the code for a real Component. So we
      // override _mount() to do nothing, and call the original _mount() separately.
      class Comp2 extends Comp {
        constructor(...args) { super(null, ...args); }
        _mount(elem, content) { this._content = content; }
        mount(elem) { super._mount(elem, this._content); }
      }
      function _insert_(component) {
        return elem => component.mount(elem);
      }

      consoleCapture(['error'], messages => {
        assert.throws(() =>
          dom('div', 'Hello',
            _insert_(new Comp2('foo', spies1)),
            _insert_(new Comp2('bar', spies2)),
            'World'
          ),
          /ctor throw/
        );
      });
      // Note the problem: the first component gets constructed but not disposed on an exception.
      assertResetSingleCall(spies1.onConstruct, spies1, 'foo');
      assertResetSingleCall(spies1.onRender, undefined, sinon.match.has('className', 'FOO'));
      sinon.assert.notCalled(spies1.onDispose);     // This (and the next) are the problem-lines!
      sinon.assert.notCalled(spies1.onDomDispose);
      assertResetSingleCall(spies2.onConstruct, spies2, 'bar');
      sinon.assert.notCalled(spies2.onRender);
      sinon.assert.notCalled(spies2.onDispose);
      sinon.assert.notCalled(spies2.onDomDispose);
    });

    it('should support createInit', function() {
      let spies1 = makeSpies(), spies2 = makeSpies();
      let spy1 = sinon.spy();
      let spy2 = sinon.stub().throws(new Error('init throw'));
      let elem = dom('div', 'Hello',
        dom.createInit(Comp, 'foo', spies1, c => { spy1(c); })
      );

      assertResetSingleCall(spies1.onConstruct, spies1, 'foo');
      assert.isTrue(spies1.onRender.calledBefore(spy1));
      assertResetSingleCall(spies1.onRender, undefined, sinon.match.has('className', 'FOO'));
      assertResetSingleCall(spy1, undefined, sinon.match.instanceOf(Comp));
      dom.domDispose(elem);
      assertResetSingleCall(spies1.onDispose, spies1);
      assertResetSingleCall(spies1.onDomDispose, undefined, sinon.match.has('className', 'FOO'));

      // Now check that in case of an exception, already-constructed parts get disposed. 
      assert.throws(() =>
        dom('div', 'Hello',
          dom.createInit(Comp, 'foo', spies1, c => { spy1(c); }),
          dom.createInit(Comp, 'bar', spies2, c => { spy2(c); })
        ),
        /init throw/);

      assertResetSingleCall(spies1.onConstruct, spies1, 'foo');
      assertResetSingleCall(spies1.onRender, undefined, sinon.match.has('className', 'FOO'));
      assertResetSingleCall(spy1, undefined, sinon.match.instanceOf(Comp));
      assertResetSingleCall(spies1.onDispose, spies1);
      assertResetSingleCall(spies1.onDomDispose, undefined, sinon.match.has('className', 'FOO'));
      // The second component has an exception after construction, in init callback.
      assertResetSingleCall(spies2.onConstruct, spies2, 'bar');
      assertResetSingleCall(spies2.onRender, undefined, sinon.match.has('className', 'BAR'));
      assertResetSingleCall(spy2, undefined, sinon.match.instanceOf(Comp));
      assertResetSingleCall(spies2.onDispose, spies2);
      assertResetSingleCall(spies2.onDomDispose, undefined, sinon.match.has('className', 'BAR'));
    });

    it('should support render() returning any number of children', function() {
      let components = [];
      class Comp extends dom.Component {
        render(arg, spies) {
          spies.onConstruct(arg);
          this.onDispose(() => spies.onDispose());
          components.push(this);
          return [
            dom('div', '(', dom.text(arg.toLowerCase()), ')'),
            dom('span', '[', dom.text(arg.toUpperCase()), ']'),
            spies.onRender,
            // A disposer like this is only run when the DOM containing this Component is
            // disposed, it doesn't get run when the component itself is disposed.
            dom.onDispose(spies.onDomDispose)
          ];
        }
      }

      let spies1 = makeSpies(), spies2 = makeSpies();

      let elem = dom('div.parent', 'Hello',
        dom.create(Comp, 'Xx', spies1),
        dom.create(Comp, 'Yy', spies2),
        'World');

      assertResetSingleCall(spies1.onConstruct, spies1, 'Xx');
      assertResetSingleCall(spies2.onConstruct, spies2, 'Yy');
      assertResetSingleCall(spies1.onRender, undefined, sinon.match.same(elem));
      assertResetSingleCall(spies2.onRender, undefined, sinon.match.same(elem));
      assert.equal(elem.innerHTML, 'Hello<!--A--><div>(xx)</div><span>[XX]</span><!--B-->' +
        '<!--A--><div>(yy)</div><span>[YY]</span><!--B-->World');

      // We don't make it easy to get a handle to a created component, but if we manage to, and
      // dispose it, its DOM should get removed.
      components[0].dispose();
      assert.equal(elem.innerHTML, 'Hello<!--A--><div>(yy)</div><span>[YY]</span><!--B-->World');
      assertResetSingleCall(spies1.onDispose, spies1);
      // This isn't a great behavior, but it makes sense: a disposer returned as part of an array
      // is attached to the parent containing the Component, and not called until THAT's disposed.
      sinon.assert.notCalled(spies1.onDomDispose);

      // If we dispose the parent, the DOM doesn't need to be modified, but disposers get called.
      dom.domDispose(elem);
      // Check that DOM isn't modified (that would be wasteful).
      assert.equal(elem.innerHTML, 'Hello<!--A--><div>(yy)</div><span>[YY]</span><!--B-->World');
      assertResetSingleCall(spies2.onDispose, spies2);
      assertResetSingleCall(spies2.onDomDispose, undefined, sinon.match.same(elem));
      assertResetSingleCall(spies1.onDomDispose, undefined, sinon.match.same(elem));
    });
  });


  describe('computed', function() {

    it('should work for comparative examples in documentation', function() {
      let nlinesObs = observable(1);
      let spy1 = sinon.spy(), spy2 = sinon.spy(), spy3 = sinon.spy();
      const textareaHTML = '<!--a--><textarea></textarea><!--b-->';
      const inputHTML = '<!--a--><input><!--b-->';

      // Example 1: Here dom.domComputed() listens to nlinesObs directly, but rebuilds DOM when it
      // changes between 2 and 3.
      let elem1 = dom('div', dom.domComputed(nlinesObs, nlines => nlines > 1 ?
        dom('textarea', dom.onDispose(spy1)) : dom('input', dom.onDispose(spy1))));

      // Example 2: The recommended way; dom.domComputed() takes a function whose value only
      // changes when DOM needs to be rebuilt.
      let elem2 = dom('div', dom.domComputed(use => use(nlinesObs) > 1, isTall => isTall ?
        dom('textarea', dom.onDispose(spy2)) : dom('input', dom.onDispose(spy2))));

      // Example 3: The computed returns DOM omitting last arg. Makes it too easy to do things
      // the wrong way, and suffers here from unnecessary rebuilding, as Example 1.
      let elem3 = dom('div', dom.domComputed(use => use(nlinesObs) > 1 ?
        dom('textarea', dom.onDispose(spy3)) : dom('input', dom.onDispose(spy3))));

      function checkDispose(spy, tagName) {
        if (tagName) {
          assertResetSingleCall(spy, undefined, sinon.match.has('tagName', tagName));
        } else {
          sinon.assert.notCalled(spy);
        }
      }
      function checkAllDispose(tagName) {
        checkDispose(spy1, tagName);
        checkDispose(spy2, tagName);
        checkDispose(spy3, tagName);
      }
      function checkAllHTML(html) {
        assert.equal(elem1.innerHTML, html);
        assert.equal(elem2.innerHTML, html);
        assert.equal(elem3.innerHTML, html);
      }

      // All examples get correct DOM initially.
      checkAllHTML(inputHTML);

      // All dispose previous DOM, and build new one correctly when observable changes.
      nlinesObs.set(2);
      checkAllHTML(textareaHTML);
      checkAllDispose('INPUT');

      // Here all examples have correct HTML, but only the second one avoids rebuilding DOM unnecessarily.
      nlinesObs.set(3);
      checkAllHTML(textareaHTML);
      checkDispose(spy1, 'TEXTAREA');
      checkDispose(spy2, null);
      checkDispose(spy3, 'TEXTAREA');

      // All examples have to rebuild DOM and correctly dispose previous DOM.
      nlinesObs.set(1);
      checkAllHTML(inputHTML);
      checkAllDispose('TEXTAREA');

      // Check that disposing the parent calls disposers but doesn't change HTML.
      dom.domDispose(elem1);
      dom.domDispose(elem2);
      dom.domDispose(elem3);
      checkAllHTML(inputHTML);
      checkAllDispose('INPUT');

      // Check that after disposal, changes to the observable are ignored.
      nlinesObs.set(2);
      checkAllHTML(inputHTML);
      checkAllDispose(null);
    });

    it('should be able to depend on several observables', function() {
      let readonlyObs = observable(false);
      let nlinesObs = observable(1);
      let spy = sinon.spy();
      const textareaHTML = '<!--a--><textarea></textarea><!--b-->';
      const inputHTML = '<!--a--><input><!--b-->';
      const divHTML = '<!--a--><div></div><!--b-->';

      let elem = dom('div', dom.domComputed(use => use(readonlyObs) ?
        dom('div', dom.onDispose(spy)) :
        (use(nlinesObs) > 1 ?
          dom('textarea', dom.onDispose(spy)) :
          dom('input', dom.onDispose(spy)))));

      function checkDispose(tagName) {
        if (tagName) {
          assertResetSingleCall(spy, undefined, sinon.match.has('tagName', tagName));
        } else {
          sinon.assert.notCalled(spy);
        }
      }
      function checkHTML(html) {
        assert.equal(elem.innerHTML, html);
      }

      checkHTML(inputHTML);

      nlinesObs.set(2);
      checkHTML(textareaHTML);
      checkDispose('INPUT');

      nlinesObs.set(3);
      checkHTML(textareaHTML);      // still the same
      checkDispose('TEXTAREA');     // suboptimal: disposes unnecessarily

      readonlyObs.set(true);
      checkHTML(divHTML);
      checkDispose('TEXTAREA');

      // At this point, there is no subscription to nlinesObs, so changes should be ignored.
      nlinesObs.set(1);
      checkHTML(divHTML);
      checkDispose(null);

      // After resetting readonlyObs, nlinesObs is used again.
      readonlyObs.set(false);
      checkHTML(inputHTML);
      checkDispose('DIV');

      // Check that disposing the parent calls disposers but doesn't change HTML.
      dom.domDispose(elem);
      checkHTML(inputHTML);
      checkDispose('INPUT');

      // Check that after disposal, changes to the observable are ignored.
      readonlyObs.set(true);
      nlinesObs.set(2);
      checkHTML(inputHTML);
      checkDispose(null);

    });

    it('should work for non-observable values', function() {
      // This examples shows how to use dom.domComputed() for plain values, but recommeds against it.
      // This example ALSO tests that the dom.domComputed() callback may return an array.
      let listValue = [1,2,3];
      let listObs = observable([1,2,3]);
      let elem1 = dom('div', dom.domComputed(listObs,    list => list.map(x => dom('div', x))));
      let elem2 = dom('div', dom.domComputed(listValue,  list => list.map(x => dom('div', x))));
      let elem3 = dom('div', listValue.map(x => dom('div', x)));

      let html = '<div>1</div><div>2</div><div>3</div>';
      assert.equal(elem1.innerHTML, `<!--a-->${html}<!--b-->`);
      assert.equal(elem2.innerHTML, `<!--a-->${html}<!--b-->`);
      assert.equal(elem3.innerHTML, html);

      // Only changes to the observable value cause the DOM to change.
      let htmlNew = '<div>A</div><div>B</div>';
      listValue = ['A', 'B'];
      listObs.set(['A', 'B']);
      assert.equal(elem1.innerHTML, `<!--a-->${htmlNew}<!--b-->`);
      assert.equal(elem2.innerHTML, `<!--a-->${html}<!--b-->`);
      assert.equal(elem3.innerHTML, html);
    });

    it("should handle any number of children", function() {
      var obs = observable();
      var elem = dom('div', 'Hello', dom.domComputed(obs), 'World');
      assert.equal(elem.innerHTML, 'Hello<!--a--><!--b-->World');
      obs.set("Foo");
      assert.equal(elem.innerHTML, 'Hello<!--a-->Foo<!--b-->World');
      obs.set([]);
      assert.equal(elem.innerHTML, 'Hello<!--a--><!--b-->World');
      obs.set(["Foo", "Bar"]);
      assert.equal(elem.innerHTML, 'Hello<!--a-->FooBar<!--b-->World');
      obs.set(null);
      assert.equal(elem.innerHTML, 'Hello<!--a--><!--b-->World');
      obs.set([dom.frag("Foo", dom("span", "Bar")), dom("div", "Baz")]);
      assert.equal(elem.innerHTML, 'Hello<!--a-->Foo<span>Bar</span><div>Baz</div><!--b-->World');
    });

    it("should cope with children getting removed outside", function() {
      var obs = observable();
      var elem = dom('div', 'Hello', dom.domComputed(obs), 'World');
      assert.equal(elem.innerHTML, 'Hello<!--a--><!--b-->World');

      obs.set(dom.frag(dom('div', 'Foo'), dom('div', 'Bar')));
      assert.equal(elem.innerHTML, 'Hello<!--a--><div>Foo</div><div>Bar</div><!--b-->World');
      elem.removeChild(elem.childNodes[2]);
      assert.equal(elem.innerHTML, 'Hello<!--a--><div>Bar</div><!--b-->World');
      obs.set(null);
      assert.equal(elem.innerHTML, 'Hello<!--a--><!--b-->World');

      obs.set(dom.frag(dom('div', 'Foo'), dom('div', 'Bar')));
      elem.removeChild(elem.childNodes[3]);
      assert.equal(elem.innerHTML, 'Hello<!--a--><div>Foo</div><!--b-->World');
      obs.set(dom.frag(dom('div', 'Foo'), dom('div', 'Bar')));
      assert.equal(elem.innerHTML, 'Hello<!--a--><div>Foo</div><div>Bar</div><!--b-->World');

      // Remove all children including the marker elements.
      while (elem.firstChild) {
        elem.removeChild(elem.firstChild);
      }
      assert.equal(elem.innerHTML, '');
      // We can't expect anything good if we lost the markers, but it shouldn't cause errors.
      obs.set('Foo');
      assert.equal(elem.innerHTML, '');
    });
  });


  describe("maybe", function() {

    it("should handle any number of children", function() {
      var obs = observable(0);
      var elem = dom('div',
        'Hello',
        dom.maybe(use => use(obs) > 0, () => dom('span', 'Foo')),
        dom.maybe(use => use(obs) > 1, () => [dom('span', 'Foo'), dom('span', 'Bar')]),
        'World');
      assert.equal(elem.textContent, "HelloWorld");
      assert.equal(elem.innerHTML, "Hello<!--a--><!--b--><!--a--><!--b-->World");
      obs.set(1);
      assert.equal(elem.textContent, "HelloFooWorld");
      assert.equal(elem.innerHTML, "Hello<!--a--><span>Foo</span><!--b--><!--a--><!--b-->World");
      obs.set(2);
      assert.equal(elem.textContent, "HelloFooFooBarWorld");
      assert.equal(elem.innerHTML, "Hello<!--a--><span>Foo</span><!--b-->" +
        "<!--a--><span>Foo</span><span>Bar</span><!--b-->World");
      obs.set(0);
      assert.equal(elem.textContent, "HelloWorld");
      assert.equal(elem.innerHTML, "Hello<!--a--><!--b--><!--a--><!--b-->World");
    });

    it("should pass truthy values to the content function", function() {
      var obs = observable(null);
      var elem = dom('div', 'Hello', dom.maybe(obs, x => x), 'World');
      assert.equal(elem.innerHTML, 'Hello<!--a--><!--b-->World');
      obs.set(dom('span', 'Foo'));
      assert.equal(elem.innerHTML, 'Hello<!--a--><span>Foo</span><!--b-->World');
      obs.set(dom('span', 'Bar'));
      assert.equal(elem.innerHTML, 'Hello<!--a--><span>Bar</span><!--b-->World');
      obs.set(0);   // Falsy values should destroy the content
      assert.equal(elem.innerHTML, 'Hello<!--a--><!--b-->World');
    });
  });

  describe("find", function() {
    before(function() {
      jsdomDoc = new JSDOM("<!doctype html><html><body>" +
        "<div id='a' class='x'></div>" +
        "<div id='b' class='x y'></div>" +
        "<div id='c' class='x y z'></div>" +
        "</body></html>");
      pushGlobals(jsdomDoc.window);
    });

    after(function() {
      popGlobals();
    });

    it("should find the first matching element", function() {
      assert.equal(dom.find('#a').id, 'a');
      assert.equal(dom.find('#b').id, 'b');
      assert.equal(dom.find('.x').id, 'a');
      assert.equal(dom.find('.y').id, 'b');
      assert.equal(dom.find('.z').id, 'c');
      assert.equal(dom.find('#a.x').id, 'a');
      assert.equal(dom.find('.x.z').id, 'c');
      assert.equal(dom.find('div').id, 'a');
    });

    it("should find all matching elements with findAll", function() {
      assert.deepEqual(Array.from(dom.findAll('#a'), e => e.id), ['a']);
      assert.deepEqual(Array.from(dom.findAll('#b'), e => e.id), ['b']);
      assert.deepEqual(Array.from(dom.findAll('.x'), e => e.id), ['a', 'b', 'c']);
      assert.deepEqual(Array.from(dom.findAll('.y'), e => e.id), ['b', 'c']);
      assert.deepEqual(Array.from(dom.findAll('.z'), e => e.id), ['c']);
      assert.deepEqual(Array.from(dom.findAll('#a.x'), e => e.id), ['a']);
      assert.deepEqual(Array.from(dom.findAll('.x.z'), e => e.id), ['c']);
      assert.deepEqual(Array.from(dom.findAll('div'), e => e.id), ['a', 'b', 'c']);
    });
  });
});
