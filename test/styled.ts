import {G, popGlobals, pushGlobals} from '../lib/browserGlobals';
import {observable} from '../lib/observable';
import {styled} from '../lib/styled';

import {assert} from 'chai';
import {JSDOM} from 'jsdom';

describe('styles', function() {
  let jsdomDoc;

  beforeEach(function() {
    jsdomDoc = new JSDOM("<!doctype html><html><body></body></html>");
    pushGlobals(jsdomDoc.window);
  });

  afterEach(function() {
    popGlobals();
  });

  it('should add basic styling', () => {
    const sdiv = styled('div', `color: red; font-size: 27px`);
    const elem = G.document.body.appendChild(sdiv('hello world')) as HTMLElement;
    assert.equal(elem.tagName, 'DIV');

    // Check that styles got applies.
    const style = G.window.getComputedStyle(elem);
    assert.equal(style.color, 'red');
    assert.equal(style.fontSize, '27px');

    // Check that we have a single class set, and that styles are not set directly.
    assert.lengthOf(elem.classList, 1);
    assert.equal(elem.style.color, '');
    assert.equal(elem.style.fontSize, '');
  });

  it('should process nested styles', () => {
    const sdiv = styled('div', `
      color: red;
      font-size: 27px;

      &-green { color: green; }
      &-blue { color: blue; }
      &-highlight { border: 2px solid blue; }
    `);

    const highlight = observable(false);
    const colorClass = observable('blue');

    const elem = G.document.body.appendChild(
      sdiv(
        sdiv.cls('-highlight', highlight),
        sdiv.cls((use) => '-' + use(colorClass)),
        'hello world')) as HTMLElement;

    // Check that highlight observable toggles class and computed style.
    assert.notInclude(elem.className, '-highlight');
    assert.equal(G.window.getComputedStyle(elem).border, '');

    highlight.set(true);
    assert.include(elem.className, '-highlight');
    assert.equal(G.window.getComputedStyle(elem).border, '2px solid blue');

    // Check that colorClass observable switches class and computed style.
    assert.include(elem.className, '-blue');
    assert.notInclude(elem.className, '-green');
    assert.equal(G.window.getComputedStyle(elem).color, 'blue');

    colorClass.set('green');
    assert.notInclude(elem.className, '-blue');
    assert.include(elem.className, '-green');
    assert.equal(G.window.getComputedStyle(elem).color, 'green');

    colorClass.set('unknown');
    assert.notInclude(elem.className, '-blue');
    assert.notInclude(elem.className, '-green');
    assert.include(elem.className, '-unknown');
    assert.equal(G.window.getComputedStyle(elem).color, 'red');  // From main element.
  });

  it('should allow wrapping existing components', () => {
    const sspan = styled('span', `color: red; font-size: 27px`);
    const sspan2 = styled(sspan, `color: green; background-color: yellow`);

    const elem = G.document.body.appendChild(sspan2('hello world')) as HTMLElement;
    assert.equal(elem.tagName, 'SPAN');

    // Check that styles got applies.
    const style = G.window.getComputedStyle(elem);
    assert.equal(style.color, 'green');
    assert.equal(style.fontSize, '27px');
    assert.equal(style.backgroundColor, 'yellow');

    // Check that we have two classes set, and that styles are not set directly.
    assert.lengthOf(elem.classList, 2);
    assert.equal(elem.style.color, '');
    assert.equal(elem.style.fontSize, '');
    assert.equal(elem.style.backgroundColor, '');
  });

  it('should not normally add more than one style element', () => {
    const sspan = styled('span', `color: red; font-size: 27px`);
    const sspan2 = styled(sspan, `color: green; background-color: yellow`);
    const sdiv = styled('div', `background-color: blue`);

    // No <style> elements added to <head> yet.
    assert.lengthOf(G.document.head.querySelectorAll('style'), 0);

    sspan2('Hello');

    // Should now have a single <style> element with 3 rules (three CSS classes).
    assert.lengthOf(G.document.head.querySelectorAll('style'), 1);
    assert.lengthOf((G.document.head.querySelector('style')!.sheet as CSSStyleSheet).cssRules, 3);

    G.document.body.appendChild(sdiv('another element', sspan('and'), sspan2('more')));

    // Should still be a single <style> element with 3 rules.
    assert.lengthOf(G.document.head.querySelectorAll('style'), 1);
    assert.lengthOf((G.document.head.querySelector('style')!.sheet as CSSStyleSheet).cssRules, 3);
  });
});
