import {dom, obsArray, observable, styled} from 'index';
import {IOption, IOptionFull, select} from 'lib/widgets/select';

function testDom() {
  const value = observable("apple");
  const choices = obsArray<IOption<string>>(["acorn", "apple", "orange", "papaya"]);

  let textarea: HTMLTextAreaElement;

  function parseChoices() {
    choices.set(textarea.value.trim().split("\n"));
  }

  const numChoices: Array<IOptionFull<number>> = [
    {value: 1.5, label: "A1"},
    {value: 2.1, label: "B2", disabled: true},
    {value: 3.9, label: "C3"},
  ];
  const numValue = observable(numChoices[2].value);

  return cssTest(
    dom('div#test_main',
      select(value, choices, {defLabel: "Select a fruit:"}),
      dom('div', "Current value: ",
        dom('input#test_value', {type: 'text'}, dom.prop('value', value),
          dom.on('input', (e, elem) => value.set((elem as HTMLInputElement).value))),
      ),
      textarea = dom('textarea', {rows: "10"}, choices.get().join("\n"),
        dom.on('blur', parseChoices),
      ),
      dom('div',
        dom('input', {type: 'button', value: 'Update'}, dom.on('click', parseChoices)),
      ),
    ),
    dom('div#test_array',
      select(value, ["apple", "cherry", "tomato", "orange"]),
    ),
    dom('div#test_num',
      select(numValue, numChoices),
      dom('div', "Current value:", dom('br'),
        dom('input#test_num_value', {type: 'text', size: "6"}, dom.prop('value', numValue),
          dom.on('input', (e, elem) => {
            const val = (elem as HTMLInputElement).value;
            const n = parseFloat(val);
            if (!isNaN(n)) { numValue.set(n); }
          })),
        " type: ",
        dom('b#test_num_type', dom.text((use) => String(typeof use(numValue)))),
      ),
    ),
  );
}

const cssTest = styled('div', `
  display: flex;
  & > div { border: 1px solid grey; margin: 0.5rem; padding: 0.5rem; }
`);

dom.update(document.body, testDom());
