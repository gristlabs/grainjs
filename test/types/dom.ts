/**
 * Test types using dtslint. See README in this directory.
 */
import { dom, DomArg, DomElementArg } from '../../lib/dom';

dom('div', dom.text('hello'));    // $ExpectType HTMLDivElement
dom('div', dom.hide(true));       // $ExpectType HTMLDivElement
dom('a', {title: 'hello'});       // $ExpectType HTMLAnchorElement
dom.frag(dom.text('hello'));      // $ExpectType DocumentFragment
dom.frag(dom.hide(true));         // $ExpectError
dom.frag({title: 'hello'});       // $ExpectError

// Using tag name produces elements of the correct types.
dom('span', (elem) => {           // $ExpectType HTMLSpanElement
  elem;                           // $ExpectType HTMLSpanElement
});

// Callbacks get correct type of element, and events get correct type of event.
dom('input',
  (elem) => {
    elem;                           // $ExpectType HTMLInputElement
  },
  dom.on('click', (ev, elem) => {
    ev;                             // $ExpectType MouseEvent
    elem;                           // $ExpectType HTMLInputElement
  }),
  dom.onKeyPress({Escape: (ev, elem) => {
    ev;                             // $ExpectType KeyboardEvent
    elem;                           // $ExpectType HTMLInputElement
  }}),
);

// Illustrate the note in dom()'s documentation about the drawback of #id syntax:
// it prevents typescript from matching the tag name.
dom('input', {id: 'foo'}, (elem) => {     // $ExpectType HTMLInputElement
  elem; });                               // $ExpectType HTMLInputElement
dom('input#foo', (elem) => {              // $ExpectType HTMLElement
  elem; });                               // $ExpectType HTMLElement

// Check that DomElementArg may be assigned to DomArg<HTMLInputElement>, but not vice versa.
((a: DomArg<HTMLInputElement>) => null)(null as DomElementArg);
((a: DomElementArg) => null)(null as DomArg<HTMLInputElement>);  // $ExpectError

// Check that DomArg may be assigned to DomElementArg, but not vice versa.
((a: DomElementArg) => null)(null as DomArg);
((a: DomArg) => null)(null as DomElementArg);                   // $ExpectError

// dom.update() should also preserve types.
dom.update(dom('div'), (elem) => {        // $ExpectType HTMLDivElement
  elem; });                               // $ExpectType HTMLDivElement

// Passing a DomArg<Node> to dom.update() shouldn't confuse type-inference.
dom.update(document.body, null as DomArg, {style: '...'});    // $ExpectType HTMLElement
