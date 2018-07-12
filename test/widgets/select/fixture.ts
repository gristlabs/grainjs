import {IOption, select} from 'lib/widgets/select/select';
import {dom, obsArray, observable} from '../../../index';

function createOption(val: string) {
  const colon = val.indexOf(":");
  if (colon === -1) { return val; }
  return {
    value: val.slice(0, colon),
    label: val.slice(colon + 1),
    disabled: val.startsWith("-"),
  };
}

function testDom() {
  const value = observable("apple");
  const choices = obsArray<IOption<string>>(["acorn", "apple", "orange", "papaya"]);

  let textarea: HTMLTextAreaElement;
  return dom('div#test_select',
    select(value, choices, {defLabel: "Select a fruit:"}),
    dom('div', "Current value: ",
      dom('input#test_value', {type: 'text'}, dom.prop('value', value),
        dom.on('input', (e, elem) => value.set((elem as HTMLInputElement).value))),
    ),
    textarea = dom('textarea', {rows: "10"}, choices.get().join("\n")) as HTMLTextAreaElement,
    dom('div',
      dom('input', {type: 'button', value: 'Update'},
        dom.on('click', () => choices.set(textarea.value.trim().split("\n").map(createOption))),
      ),
    ),
  );
}

dom.update(dom.find('#root')!, testDom());
