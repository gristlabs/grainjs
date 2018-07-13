import {IOption, IOptionFull, select} from 'lib/widgets/select';
import {dom, obsArray, observable} from '../../../index';

function testDom() {
  const value = observable("apple");
  const choices = obsArray<IOption<string>>(["acorn", "apple", "orange", "papaya"]);

  let textarea: HTMLTextAreaElement;

  function parseChoices() {
    choices.set(textarea.value.trim().split("\n"));
  }

  const richChoices: Array<IOptionFull<object>> = [
    {value: {a: 1}, label: "A1"},
    {value: {b: 2}, label: "B2", disabled: true},
    {value: {c: 3}, label: "C3"},
  ];
  const richValue = observable(richChoices[2].value);

  return [
    dom('div#test_main',
      select(value, choices, {defLabel: "Select a fruit:"}),
      dom('div', "Current value: ",
        dom('input#test_value', {type: 'text'}, dom.prop('value', value),
          dom.on('input', (e, elem) => value.set((elem as HTMLInputElement).value))),
      ),
      textarea = dom('textarea', {rows: "10"}, choices.get().join("\n"),
        dom.on('blur', parseChoices),
      ) as HTMLTextAreaElement,
      dom('div',
        dom('input', {type: 'button', value: 'Update'}, dom.on('click', parseChoices)),
      ),
    ),
    dom('div#test_array',
      select(value, ["apple", "cherry", "tomato", "orange"]),
      dom('div', "Current value: ", dom('br'),
        dom('b', dom.text(value))),
    ),
    dom('div#test_rich',
      select(richValue, richChoices),
      dom('div#test_rich_value', "Current value:", dom('br'),
        dom('b', dom.text((use) => JSON.stringify(use(richValue))))),
    ),
  ];
}

dom.update(document.body, testDom());
