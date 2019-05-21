import {dom, observable} from 'index';
import {input} from 'lib/widgets/input';

function testDom() {
  const obs = observable("grain");
  const isValid = observable(false);
  return [
    dom('div#test1',
      input(obs, {}, {type: 'text', placeholder: 'Your name...'}),
    ),
    dom('div#test2',
      input(obs, {isValid}, {type: 'email', placeholder: 'Your email...'}),
      ' isValid: ', dom('b', dom.text((use) => String(use(isValid)))),
    ),
    dom('div#test3',
      input(obs, {onInput: true}, {type: 'text'}),
    ),
    "Current value: ", dom.text(obs),
  ];
}

dom.update(document.body, testDom());
