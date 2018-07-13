/**
 * Select dropdown widget.
 */
import {dom, MaybeObsArray, Observable, subscribe} from '../../index';

export interface IOptionFull<T> {
  value: T;
  label: string;
  disabled?: boolean;
}

// For string options, we can use a string for label and value, without wrapping into an object.
export type IOption<T> = (T & string) | IOptionFull<T>;

function unwrapMaybeObsArray<T>(array: MaybeObsArray<T>): T[] {
  return Array.isArray(array) ? array : array.get();
}

function getOptionValue<T>(option: IOption<T>): T {
  return (typeof option === "string") ?
    option : (option as IOptionFull<T>).value;
}

/**
 * Creates a select dropdown widget. The observable `obs` reflects the value of the selected
 * option, and `optionArray` is an array (regular or observable) of option values and labels.
 * These may be either strings, or {label, value, disabled} objects.
 *
 * The type of value may be any type at all; it is opaque to this widget.
 *
 * If obs is set to an invalid or disabled value, then defLabel option is used to determine the
 * label that the select box will show, blank by default.
 *
 * Usage:
 *    const fruit = observable("apple");
 *    select(fruit, ["apple", "banana", "mango"]);
 *
 *    const employee = observable(17);
 *    const employees = obsArray<IOption<number>>([
 *      {value: 12, label: "Bob", disabled: true},
 *      {value: 17, label: "Alice"},
 *      {value: 21, label: "Eve"},
 *    ]);
 *    select(employee, employees, {defLabel: "Select employee:"});
 */
export function select<T>(obs: Observable<T>, optionArray: MaybeObsArray<IOption<T>>,
                          options: {defLabel?: string} = {}) {
  const {defLabel = ""} = options;
  return dom('select',
    // Include a hidden option to represent a default value. This one gets shown when none of the
    // options are selected. This is more consistent when showing the first valid option.
    dom('option', dom.hide(true), defLabel),

    // Create all the option elements.
    dom.forEach(optionArray, (option) => {
      const obj: IOptionFull<T> = (typeof option === "string") ?
        {value: option, label: option} : (option as IOptionFull<T>);
      // Note we only set 'selected' when an <option> is created; we are not subscribing to obs.
      // This is to reduce the amount of subscriptions, esp. when number of options is large.
      return dom('option', {
        disabled: obj.disabled,
        selected: obj.value === obs.get(),
      }, obj.label);
    }),

    // When obs changes, update select's value; we do it after <options> have been created.
    // Note that autoDisposeElem ensures the subscription is disposed with the 'select' element.
    (elem: Element) => dom.autoDisposeElem(elem, subscribe(obs, (use, obsValue) => {
      const arr = unwrapMaybeObsArray(optionArray);
      const index = arr.findIndex((item) => getOptionValue(item) === obsValue);
      (elem as HTMLSelectElement).selectedIndex = index + 1;    // +1 for default option
    })),

    // When user picks a new item, use its value to update the observable.
    dom.on('change', (e, elem) => {
      const index = (elem as HTMLSelectElement).selectedIndex;
      const item = unwrapMaybeObsArray(optionArray)[index - 1];   // -1 for default option
      // It should be impossible for the user to select an invalid option, but check just in case.
      if (item !== undefined) {
        obs.set(getOptionValue(item));
      }
    }),
  );
}
