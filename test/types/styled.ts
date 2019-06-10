/**
 * Test types using dtslint. See README in this directory.
 *
 * This test verifies that styled() wrappers around DOM-building functions preserve useful type
 * info, and let it be inferred for their arguments.
 */
import { dom, DomElementArg, input, observable, styled } from '../../index';

// Styled with a tag name should produce dom-creators with same arg types as DOM.
const div = styled('div', '...');
const button = styled('input', '...');

div('hello', (elem) => {          // $ExpectType HTMLDivElement
  elem;                           // $ExpectType HTMLDivElement
});

// Callbacks get correct type of element, and events get correct type of event.
// $ExpectType HTMLInputElement
button(
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

// Try using styled to wrap dom-creating functions.
function icon(name: 'foo'|'bar', arg: DomElementArg, arg2?: number): HTMLElement {
  return null as any;
}

const cssIcon = styled(icon, '...');
cssIcon('test');                    // $ExpectError
cssIcon('foo');                     // $ExpectType HTMLElement
cssIcon('foo', null, 4);            // $ExpectType HTMLElement
cssIcon('foo', (elem) => {          // $ExpectType HTMLElement
  elem;                             // $ExpectType HTMLElement
});

const cssButton = styled(button, '...');
cssButton({type: 'button'}, (elem) => {   // $ExpectType HTMLInputElement
  elem;                                   // $ExpectType HTMLInputElement
});

const cssLabelText = styled(input, '...');
cssLabelText(observable(""), {}, "foo");  // $ExpectType HTMLInputElement

// TODO This is not actually what we expect.
const menuItem1: (action: () => void, ...args: DomElementArg[]) => Element = null as any;
const menuItem2 = styled(menuItem1, '...');
menuItem1(() => undefined, (elem) => {    // $ExpectType Element
  elem; });                               // $ExpectType HTMLElement
menuItem2(() => undefined, (elem) => {    // $ExpectType Element
  elem; });                               // $ExpectType HTMLElement
