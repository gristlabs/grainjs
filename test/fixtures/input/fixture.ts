import {dom, observable} from 'index';
import {input} from 'lib/widgets/input';

function testDom() {
  const obs = observable("grain");
  return [
    dom('div#test1',
      input(obs, {}, {type: 'text', placeholder: 'Your name...'}),
    ),
    dom('div#test2',
      input(obs, {onlyIfValid: true}, {type: 'email', placeholder: 'Your email...'}),
    ),
    dom('div#test3',
      input(obs, {onInput: true}, {type: 'text'}),
    ),
    "Current value: ", dom.text(obs),
  ];
}

dom.update(document.body, testDom());
