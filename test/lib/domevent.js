"use strict";

/* global describe, before, after, it */

const domevent = require('../../lib/domevent');
const {dom} = require('../../lib/dom');
const {pushGlobals, popGlobals} = require('../../lib/browserGlobals');
const { assertResetSingleCallStrict } = require('./testutil2');

const assert = require('assert');
const { JSDOM } = require('jsdom');
const sinon = require('sinon');

describe('domevent', function() {
  let jsdomDoc, window, document;

  before(function() {
    jsdomDoc = new JSDOM("<!doctype html><html><body>" +
      "<div id='a'>" +
      "<div id='b'>x</div>" +
      "<div id='c'>y</div>" +
      "</div>" +
      "</body></html>");
    window = jsdomDoc.window;
    document = window.document;
    pushGlobals(jsdomDoc.window);
  });

  after(function() {
    popGlobals();
  });

  function makeEvent(eventType) {
    return new window.MouseEvent(eventType, {view: window, bubbles: true, cancelable: true});
  }

  describe('onElem', function() {
    it("should subscribe callback to events", function() {
      let elemA = document.getElementById('a');
      let elemB = document.getElementById('b');
      let stubA = sinon.stub(), stubB = sinon.stub();

      domevent.onElem(elemA, 'click', stubA);
      let lisB = domevent.onElem(elemB, 'click', stubB);

      // B is inside of A. If we dispatch event on A, listeners on B shouldn't see it.
      let e1 = makeEvent('click');
      elemA.dispatchEvent(e1);
      assertResetSingleCallStrict(stubA, undefined, e1, elemA);
      sinon.assert.notCalled(stubB);

      // If we dispatch event on B, it should bubble to A listeners too. (It's more of a test of
      // jsdom at this point.)
      let e2 = makeEvent('click');
      elemB.dispatchEvent(e2);
      assert(stubB.calledBefore(stubA));
      assertResetSingleCallStrict(stubB, undefined, e2, elemB);
      assertResetSingleCallStrict(stubA, undefined, e2, elemA);

      // If a listener returns false, it does NOT prevent the event from bubbling.
      stubB.returns(false);
      let e3 = makeEvent('click');
      elemB.dispatchEvent(e3);
      assertResetSingleCallStrict(stubA, undefined, e3, elemA);
      assertResetSingleCallStrict(stubB, undefined, e3, elemB);

      // If listener calls e.stopPropagation(), that does prevent the event from bubbling.
      stubB.callsFake(ev => ev.stopPropagation());
      let e4 = makeEvent('click');
      elemB.dispatchEvent(e4);
      sinon.assert.notCalled(stubA);
      assertResetSingleCallStrict(stubB, undefined, e4, elemB);

      // If lisB is disposed, it stops listening.
      lisB.dispose();
      let e5 = makeEvent('click');
      elemB.dispatchEvent(e5);
      assertResetSingleCallStrict(stubA, undefined, e5, elemA);
      sinon.assert.notCalled(stubB);

    });
  });

  describe('onMatchElem', function() {
    it("should subscribe callback to delegated events", function() {
      let elemA = document.getElementById('a');
      let elemB = document.getElementById('b');
      let elemC = document.getElementById('c');
      let stubA = sinon.stub(), stubB = sinon.stub(), stubDelB = sinon.stub();

      domevent.onElem(elemA, 'click', stubA);
      domevent.onElem(elemB, 'click', stubB);
      domevent.onMatchElem(elemA, '#b', 'click', stubDelB);

      // B is inside of A. If we dispatch event on A, listeners on B shouldn't see it.
      let e1 = makeEvent('click');
      elemA.dispatchEvent(e1);
      assertResetSingleCallStrict(stubA, undefined, e1, elemA);
      sinon.assert.notCalled(stubB);
      sinon.assert.notCalled(stubDelB);

      // If we dispatch event on B, it should trigger direct and delegated B listeners, as well as
      // bubble to A listeners.
      let e2 = makeEvent('click');
      elemB.dispatchEvent(e2);
      assert(stubB.calledBefore(stubA));
      assertResetSingleCallStrict(stubA, undefined, e2, elemA);
      assertResetSingleCallStrict(stubB, undefined, e2, elemB);
      assertResetSingleCallStrict(stubDelB, undefined, e2, elemB);

      // If we dispatch event on C, it should bubble up to A, but not trigger direct or delegated
      // B listeners.
      let e4 = makeEvent('click');
      elemC.dispatchEvent(e4);
      sinon.assert.notCalled(stubB);
      sinon.assert.notCalled(stubDelB);
      assertResetSingleCallStrict(stubA, undefined, e4, elemA);
    });
  });

  describe('onKey', function() {
    it("should dispatch keypress event based on key", function() {
      const elemA = document.getElementById('a');
      const stubEnter = sinon.stub(), stubDel = sinon.stub();

      domevent.onKeyElem(elemA, 'keypress', {
        Enter: stubEnter,
        Delete: stubDel
      });

      const e1 = new window.KeyboardEvent('keypress', {key: 'Enter'});
      elemA.dispatchEvent(e1);
      assertResetSingleCallStrict(stubEnter, undefined, e1, elemA);
      sinon.assert.notCalled(stubDel);

      const e2 = new window.KeyboardEvent('keypress', {key: 'Delete'});
      elemA.dispatchEvent(e2);
      sinon.assert.notCalled(stubEnter);
      assertResetSingleCallStrict(stubDel, undefined, e2, elemA);

      const e3 = new window.KeyboardEvent('keypress', {key: 'Escape'});
      elemA.dispatchEvent(e3);
      sinon.assert.notCalled(stubEnter);
      sinon.assert.notCalled(stubDel);
    });

    it("should let events bubble only with $ suffix", function() {
      const elemA = document.getElementById('a');
      const elemB = document.getElementById('b');
      const stubAEnter = sinon.stub(), stubADel = sinon.stub(), stubAEsc = sinon.stub();
      const stubBEnter = sinon.stub(), stubBDel = sinon.stub();

      domevent.onKeyElem(elemA, 'keydown', {
        Enter: stubAEnter,
        Delete: stubADel,
        Escape: stubAEsc,
      });
      domevent.onKeyElem(elemB, 'keydown', {
        Enter: stubBEnter,
        Delete$: stubBDel,
      });

      const e1 = new window.KeyboardEvent('keydown', {key: 'Enter', bubbles: true});
      elemB.dispatchEvent(e1);
      assertResetSingleCallStrict(stubBEnter, undefined, e1, elemB);
      sinon.assert.notCalled(stubAEnter);

      const e2 = new window.KeyboardEvent('keydown', {key: 'Delete', bubbles: true});
      elemB.dispatchEvent(e2);
      assertResetSingleCallStrict(stubBDel, undefined, e2, elemB);
      assertResetSingleCallStrict(stubADel, undefined, e2, elemA);

      const e3 = new window.KeyboardEvent('keydown', {key: 'Escape', bubbles: true});
      elemB.dispatchEvent(e3);
      assertResetSingleCallStrict(stubAEsc, undefined, e3, elemA);
      sinon.assert.notCalled(stubBEnter);
      sinon.assert.notCalled(stubBDel);
      sinon.assert.notCalled(stubAEnter);
      sinon.assert.notCalled(stubADel);
    });

    it("should work as a method to dom()", function() {
      const stubEnter = sinon.stub(), stubDel = sinon.stub();
      const elem = dom('input#test', {type: 'text'},
        dom.onKeyPress({Enter: stubEnter, Delete: stubDel}));

      const e1 = new window.KeyboardEvent('keypress', {key: 'Enter'});
      elem.dispatchEvent(e1);
      assertResetSingleCallStrict(stubEnter, undefined, e1, elem);
      sinon.assert.notCalled(stubDel);
    });
  });
});
