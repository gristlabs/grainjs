/**
 * General INPUT widget.
 */
import {bundleChanges, dom, IDomArgs, Observable, subscribe} from '../../index';

export interface IInputOptions {
  onInput?: boolean;      // If set, update the observable on every keystroke.

  // If given, this observable will be set whenever email is set, to elem.validity.valid boolean;
  // see https://developer.mozilla.org/en-US/docs/Web/API/ValidityState.
  isValid?: Observable<boolean>;
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
 * visible content may differ from the observable until the element loses focus or Enter is hit.
 *
 * Example usage:
 *    input(obs, {}, {type: 'text', placeholder: 'Your name...'});
 *    input(obs, {isValid: isValidObs}, {type: 'email', placeholder: 'Your email...'});
 *    input(obs, {onInput: true}, {type: 'text'});
 */
export function input(
  obs: Observable<string>, options: IInputOptions, ...args: IDomArgs<HTMLInputElement>
): HTMLInputElement {

  const isValid = options.isValid;

  function setValue(elem: HTMLInputElement) {
    bundleChanges(() => {
      obs.set(elem.value);
      if (isValid) { isValid.set(elem.validity.valid); }
    });
  }

  return dom('input', ...args,
    dom.prop('value', obs),
    (isValid ?
      (elem) => dom.autoDisposeElem(elem,
        subscribe(obs, (use) => isValid.set(elem.checkValidity()))) :
      null),
    options.onInput ? dom.on('input', (e, elem) => setValue(elem)) : null,
    dom.on('change', (e, elem) => setValue(elem)),
    dom.onKeyPress({Enter: (e, elem) => setValue(elem)}),
  );
}
