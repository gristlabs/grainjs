/**
 * General INPUT widget.
 */
import {dom, DomElementArg, Observable} from '../../index';

export interface IInputOptions {
  onInput?: boolean;      // If set, update the observable on every keystroke.
  onlyIfValid?: boolean;  // If set, only update the observable when `validity.valid` is true
                          // (see https://developer.mozilla.org/en-US/docs/Web/API/ValidityState)
}

/**
 * Creates a input element tied to the given observable. The required options argument allows
 * controlling the behavior, see IInputOptions for details.
 *
 * This is intended for string input elements, with "type" such as text, email, url, password,
 * number, tel.
 *
 * Note that every change to the observable will affect the input element, but not every change to
 * the input element will affect the observable. Specifically, unless {onInput: true} is set, the
 * visible content may differ from the observable until the element loses focus (or Enter is hit).
 * When {ifValid: true} is set, the visible content, when invalid, may differ from the observable
 * even after losing focus (when the browser shows the element as invalid).
 *
 * Example usage:
 *    input(obs, {}, {type: 'text', placeholder: 'Your name...'});
 *    input(obs, {onlyIfValid: true}, {type: 'email', placeholder: 'Your email...'});
 *    input(obs, {onInput: true}, {type: 'text'});
 */
export function input(obs: Observable<string>, options: IInputOptions, ...args: DomElementArg[]): HTMLInputElement {
  function setValue(_elem: Element) {
    const elem = _elem as HTMLInputElement;
    if (!options.onlyIfValid || elem.validity.valid) { obs.set(elem.value); }
  }

  return dom('input', ...args,
    dom.prop('value', obs),
    options.onInput ? dom.on('input', (e, elem) => setValue(elem)) : null,
    dom.on('change', (e, elem) => setValue(elem)),
    dom.on('keypress', (e, elem) => {
      if ((e as KeyboardEvent).key === 'Enter') { setValue(elem); }
    }),
  ) as HTMLInputElement;
}
