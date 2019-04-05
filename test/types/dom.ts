import { dom } from '../../lib/dom';

dom('div', dom.text('hello'));    // $ExpectType HTMLElement
dom('div', dom.hide(true));       // $ExpectType HTMLElement
dom('div', {title: 'hello'});     // $ExpectType HTMLElement
dom.frag(dom.text('hello'));      // $ExpectType DocumentFragment
dom.frag(dom.hide(true));         // $ExpectError
dom.frag({title: 'hello'});       // $ExpectError
