/**
 * Test types using tsd. See README in this directory.
 */
import { expectType, expectError } from 'tsd';
import { dom, DomArg, DomElementArg } from '../../lib/dom';

expectType<HTMLDivElement>(dom('div', dom.text('hello')));
expectType<HTMLDivElement>(dom('div', dom.hide(true)));
expectType<HTMLAnchorElement>(dom('a', {title: 'hello'}));
expectType<DocumentFragment>(dom.frag(dom.text('hello')));
expectError(dom.frag(dom.hide(true)));
expectError(dom.frag(dom.hide(true)));
expectError(dom.frag({title: 'hello'}));

// Using tag name produces elements of the correct types.
expectType<HTMLSpanElement> (
  dom('span', (elem) => {
    expectType<HTMLSpanElement>(elem);
  })
);

// Callbacks get correct type of element, and events get correct type of event.
dom('input',
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

// Illustrate the note in dom()'s documentation about the drawback of #id syntax:
// it prevents typescript from matching the tag name.
expectType<HTMLInputElement>(
  dom('input', {id: 'foo'}, (elem) => {
    expectType<HTMLInputElement>(elem);
  })
);
expectType<HTMLElement>(
  dom('input#foo', (elem) => {
    expectType<HTMLElement>(elem);
  })
);

// Check that DomElementArg may be assigned to DomArg<HTMLInputElement>, but not vice versa.
((a: DomArg<HTMLInputElement>) => null)(null as DomElementArg);
expectError(((a: DomElementArg) => null)(null as DomArg<HTMLInputElement>));

// Check that DomArg may be assigned to DomElementArg, but not vice versa.
((a: DomElementArg) => null)(null as DomArg);
expectError(((a: DomArg) => null)(null as DomElementArg));

// dom.update() should also preserve types.
expectType<HTMLDivElement>(
  dom.update(dom('div'), (elem) => {
    expectType<HTMLDivElement>(elem);
  })
);

// Passing a DomArg<Node> to dom.update() shouldn't confuse type-inference.
expectType<HTMLElement>(dom.update(document.body, null as DomArg, {style: '...'}));
