"use strict";

/* global describe, before, it */

var domevent = require('../lib/domevent.js');

var assert = require('assert');
var jsdom = require('jsdom');
var sinon = require('sinon');

describe('domevent', function() {
  var jsdomDoc, window, document;

  before(function() {
    jsdomDoc = jsdom.jsdom("<!doctype html><html><body>" +
      "<div id='a'>" +
      "<div id='b'>x</div>" +
      "<div id='c'>y</div>" +
      "</div>" +
      "</body></html>");
    window = jsdomDoc.defaultView;
    document = window.document;
  });

  function makeEvent(eventType) {
    return new window.MouseEvent(eventType, {view: window, bubbles: true, cancelable: true});
  }

  function assertResetSingleCall(spy, context, ...args) {
    sinon.assert.calledOnce(spy);
    sinon.assert.calledOn(spy, context);
    sinon.assert.calledWithExactly(spy, ...args);
    spy.reset();
  }

  describe('on', function() {
    it("should subscribe callback to events", function() {
      var elemA = document.getElementById('a');
      var elemB = document.getElementById('b');
      var stubA = sinon.stub(), stubB = sinon.stub();

      domevent.on(elemA, 'click', stubA);
      var lisB = domevent.on(elemB, 'click', stubB);

      // B is inside of A. If we dispatch event on A, listeners on B shouldn't see it.
      var e1 = makeEvent('click');
      elemA.dispatchEvent(e1);
      assertResetSingleCall(stubA, undefined, e1, elemA);
      sinon.assert.notCalled(stubB);

      // If we dispatch event on B, it should bubble to A listeners too. (It's more of a test of
      // jsdom at this point.)
      var e2 = makeEvent('click');
      elemB.dispatchEvent(e2);
      assert(stubB.calledBefore(stubA));
      assertResetSingleCall(stubB, undefined, e2, elemB);
      assertResetSingleCall(stubA, undefined, e2, elemA);

      // If a listener returns false, it should prevent the event from bubbling.
      stubB.returns(false);
      var e3 = makeEvent('click');
      elemB.dispatchEvent(e3);
      sinon.assert.notCalled(stubA);
      assertResetSingleCall(stubB, undefined, e3, elemB);

      // If lisB is disposed, it stops listening.
      lisB.dispose();
      var e4 = makeEvent('click');
      elemB.dispatchEvent(e4);
      assertResetSingleCall(stubA, undefined, e4, elemA);
      sinon.assert.notCalled(stubB);

    });
  });

  describe('onMatch', function() {
    it("should subscribe callback to delegated events", function() {
      var elemA = document.getElementById('a');
      var elemB = document.getElementById('b');
      var elemC = document.getElementById('c');
      var stubA = sinon.stub(), stubB = sinon.stub(), stubDelB = sinon.stub();

      domevent.on(elemA, 'click', stubA);
      domevent.on(elemB, 'click', stubB);
      domevent.onMatch(elemA, '#b', 'click', stubDelB);

      // B is inside of A. If we dispatch event on A, listeners on B shouldn't see it.
      var e1 = makeEvent('click');
      elemA.dispatchEvent(e1);
      assertResetSingleCall(stubA, undefined, e1, elemA);
      sinon.assert.notCalled(stubB);
      sinon.assert.notCalled(stubDelB);

      // If we dispatch event on B, it should trigger direct and delegated B listeners, as well as
      // bubble to A listeners.
      var e2 = makeEvent('click');
      elemB.dispatchEvent(e2);
      assert(stubB.calledBefore(stubA));
      assertResetSingleCall(stubA, undefined, e2, elemA);
      assertResetSingleCall(stubB, undefined, e2, elemB);
      assertResetSingleCall(stubDelB, undefined, e2, elemB);

      // If we dispatch event on C, it should bubble up to A, but not trigger direct or delegated
      // B listeners.
      var e4 = makeEvent('click');
      elemC.dispatchEvent(e4);
      sinon.assert.notCalled(stubB);
      sinon.assert.notCalled(stubDelB);
      assertResetSingleCall(stubA, undefined, e4, elemA);
    });
  });
});
