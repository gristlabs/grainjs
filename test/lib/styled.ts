import {G, popGlobals, pushGlobals} from '../../lib/browserGlobals';
import {observable} from '../../lib/observable';
import {keyframes, styled} from '../../lib/styled';

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

  it('should support keyframes', () => {
    const rotate = keyframes(`
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    `);
    const spinDiv = styled('div', `
      border: 1px solid red;
      animation: ${rotate} 1.5s infinite linear;

      &-foo { animation: ${rotate} 1.5s infinite linear; }
      &-bar { animation: bar-frame 1.5s infinite linear; }

      @keyframes bar-frame {
        20% { transform: rotate(20deg); }
        80% { transform: rotate(50deg); }
      }
    `);

    const elem1 = G.document.body.appendChild(spinDiv());
    const elem2 = G.document.body.appendChild(spinDiv(spinDiv.cls('-foo')));
    const elem3 = G.document.body.appendChild(spinDiv(spinDiv.cls('-bar')));

    const cssRules = (G.document.head.querySelector('style')!.sheet as CSSStyleSheet).cssRules;

    // Select just the CSSKeyframesRules, and store them in a map by name.
    const framesRules = Array.from(cssRules).filter((rule) =>
      rule.constructor.name === 'CSSKeyframesRule') as CSSKeyframesRule[];
    const framesMap = new Map(framesRules.map<[string, CSSKeyframesRule]>((r) => [r.name, r]));

    function getKeytext(rule: CSSKeyframesRule) {
      return Array.from(rule.cssRules, (r) => (r as CSSKeyframeRule).keyText);
    }

    const anim1 = G.window.getComputedStyle(elem1).animation!.split(' ')[0];
    assert.isTrue(framesMap.has(anim1));
    assert.deepEqual(getKeytext(framesMap.get(anim1)!), ["0%", "100%"]);

    const anim2 = G.window.getComputedStyle(elem2).animation!.split(' ')[0];
    assert.isTrue(framesMap.has(anim2));
    assert.deepEqual(getKeytext(framesMap.get(anim2)!), ["0%", "100%"]);

    const anim3 = G.window.getComputedStyle(elem3).animation!.split(' ')[0];
    assert.isTrue(framesMap.has(anim3));
    assert.deepEqual(getKeytext(framesMap.get(anim3)!), ["20%", "80%"]);
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

  function getSelectorsInPage(): Set<string> {
    const selectors = new Set<string>();
    for (const s of G.document.head.querySelectorAll('style')) {
      for (const r of Array.from((s.sheet as CSSStyleSheet).cssRules)) {
        selectors.add((r as CSSStyleRule).selectorText);
      }
    }
    return selectors;
  }

  it('should avoid class-name conflicts with multiple copies of the library', () => {
    // We force a reload of styled.ts module, and make sure that style names don't repeat.
    delete require.cache[require.resolve('../../lib/styled')];
    const module1 = require('../../lib/styled');

    const sspan = module1.styled('span', `color: red`);
    const elemSpan = sspan('Hello');
    assert.lengthOf(G.document.head.querySelectorAll('style'), 1);
    assert.equal(G.window.getComputedStyle(elemSpan).color, 'red');

    const selectorSet1 = getSelectorsInPage();

    // We force a reload of styled.ts module, and make sure that style names don't repeat.
    delete require.cache[require.resolve('../../lib/styled')];
    const module2 = require('../../lib/styled');

    // Specifically, check that style actually gets respected.
    const sdiv = module2.styled('span', `color: blue`);
    const elemDiv = sdiv('World');
    assert.lengthOf(G.document.head.querySelectorAll('style'), 2);
    assert.equal(G.window.getComputedStyle(elemDiv).color, 'blue');
    assert.equal(G.window.getComputedStyle(elemSpan).color, 'red');

    // And check that a new style actually got added.
    const selectorSet2 = getSelectorsInPage();
    assert.equal(selectorSet2.size, selectorSet1.size + 1);
  });
});
