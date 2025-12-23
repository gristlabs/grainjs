/**
 * Test types using tsd. See README in this directory.
 *
 * This test verifies that styled() wrappers around DOM-building functions preserve useful type
 * info, and let it be inferred for their arguments.
 */
import { expectError, expectType } from 'tsd';
import { dom, DomElementArg, input, observable, styled } from '../../index';

// Styled with a tag name should produce dom-creators with same arg types as DOM.
const div = styled('div', '...');
const button = styled('input', '...');

expectType<HTMLDivElement>(
  div('hello', (elem) => {
    expectType<HTMLDivElement>(elem);
  })
);

// Callbacks get correct type of element, and events get correct type of event.
// $ExpectType HTMLInputElement
button(
  (elem) => {
    expectType<HTMLInputElement>(elem);
  },
  dom.on('click', (ev, elem) => {
    expectType<MouseEvent>(ev);
    expectType<HTMLInputElement>(elem);
  }),
  dom.onKeyPress({Escape: (ev, elem) => {
    expectType<KeyboardEvent>(ev);
    expectType<HTMLInputElement>(elem);
  }}),
);

// Try using styled to wrap dom-creating functions.
function icon(name: 'foo'|'bar', arg: DomElementArg, arg2?: number): HTMLElement {
  return null as any;
}

const cssIcon = styled(icon, '...');
expectError(cssIcon('test'));
expectType<HTMLElement>(cssIcon('foo'));
expectType<HTMLElement>(cssIcon('foo', null, 4));
expectType<HTMLElement>(cssIcon('foo', (elem) => {
  expectType<HTMLElement>(elem);
}));

const cssButton = styled(button, '...');
expectType<HTMLInputElement>(
  cssButton({type: 'button'}, (elem) => {
    expectType<HTMLInputElement>(elem);
  })
);

const cssLabelText = styled(input, '...');
expectType<HTMLInputElement>(cssLabelText(observable(""), {}, "foo"));

// TODO This is not actually what we expect.
const menuItem1: (action: () => void, ...args: DomElementArg[]) => Element = null as any;
const menuItem2 = styled(menuItem1, '...');
expectType<Element>(menuItem1(() => undefined, (elem) => {
  expectType<HTMLElement>(elem);
}));
expectType<Element>(menuItem2(() => undefined, (elem) => {
  expectType<HTMLElement>(elem);
}));
