/**
 * In-code styling for DOM components, inspired by Reacts Styled Components.
 *
 * Usage:
 *    const title = styled('h1', `
 *      font-size: 1.5em;
 *      text-align: center;
 *      color: palevioletred;
 *    `);
 *
 *    const wrapper = styled('section', `
 *      padding: 4em;
 *      background: papayawhip;
 *    `);
 *
 *    wrapper(title('Hello world'))
 *
 * This generates class names for title and wrapper, adds the styles to the document on first use,
 * and the result is equivalent to:
 *
 *    dom(`section.${wrapper.className}`, dom(`h1.${title.className}`, 'Hello world'));
 *
 * Calls to styled() should happen at the top level, at import time, in order to register all
 * styles upfront. Actual work happens the first time a style is needed to create an element.
 * Calling styled() elsewhere than at top level is wasteful and bad for performance.
 *
 * You may create a style that modifies an existing styled() or other component, e.g.
 *
 *    const title2 = styled(title, `font-size: 1rem; color: red;`);
 *
 * Calling title2('Foo') becomes equivalent to dom(`h1.${title.className}.${title2.className}`).
 *
 * Styles may incorporate other related styles by nesting them under the main one as follows:
 *
 *     const myButton = styled('button', `
 *       border-radius: 0.5rem;
 *       border: 1px solid grey;
 *       font-size: 1rem;
 *
 *       &:active {
 *         background: lightblue;
 *       }
 *       &-small {
 *         font-size: 0.6rem;
 *       }
 *     `);
 *
 * In nested styles, ampersand (&) gets replaced with the generated .className of the main element.
 *
 * The resulting styled component provides a .cls() helper to simplify using prefixed classes. It
 * behaves as dom.cls(), but prefixes the class names with the generated className of the main
 * element. E.g. for the example above,
 *
 *      myButton(myButton.cls('-small'), 'Test')
 *
 * creates a button with both the myButton style above, and the style specified under "&-small".
 */

// Use the browser globals in a way that allows replacing them with mocks in tests.
import {G} from './browserGlobals';
import {dom, DomElementArg, DomElementMethod} from './dom';

type DomCreateFunc0<R> = (...args: DomElementArg[]) => R;
type DomCreateFunc1<R, T> = (a: T, ...args: DomElementArg[]) => R;
type DomCreateFunc2<R, T, U> = (a: T, b: U, ...args: DomElementArg[]) => R;
type DomCreateFunc3<R, T, U, W> = (a: T, b: U, c: W, ...args: DomElementArg[]) => R;

// The value returned by styled() matches the input (first argument), and also implements IClsName
// interface.
export interface IClsName {
  className: string;      // Name of the generated class.
  cls: typeof dom.cls;    // Helper like dom.cls(), but which prefixes classes by className.
}

// See module documentation for details.
export function styled<R>(tag: string, styles: string): DomCreateFunc0<Element> & IClsName;
export function styled<R>(creator: DomCreateFunc0<R>, styles: string): DomCreateFunc0<R> & IClsName;
export function styled<R, T>(creator: DomCreateFunc1<R, T>, styles: string): DomCreateFunc1<R, T> & IClsName;
export function styled<R, T, U>(
  creator: DomCreateFunc2<R, T, U>, styles: string): DomCreateFunc2<R, T, U> & IClsName;
export function styled<R, T, U, W>(
  creator: DomCreateFunc3<R, T, U, W>, styles: string): DomCreateFunc3<R, T, U, W> & IClsName;
export function styled(creator: any, styles: string): IClsName {
  // Note that we intentionally minimize the work done when styled() is called; it's better to do
  // any needed work on first use. That's when we will actually build the css rules.
  const style = new StylePiece(styles);

  // Creator function reflects the input, with only the addition of style.use() at the end. Note
  // that it needs to be at the end because creator() might take special initial arguments.
  const newCreator = (typeof creator === 'string') ?
    (...args: DomElementArg[]) => dom(creator, ...args, style.use()) :
    (...args: any[]) => creator(...args, style.use());
  return Object.assign(newCreator, {
    className: style.className,
    cls: dom.clsPrefix.bind(null, style.className),
  });
}

function createCssRules(className: string, styles: string) {
  const nestedRules: string[] = [];

  // Parse out nested styles. Replacing them by empty string in the main section, and add them to
  // nestedRules array to be joined up at the end. Replace & with .className.
  const mainRules = styles.replace(/([^;]*)\s*{([^}]*)\s*}/g, (match, selector, rules) => {
    const fullSelector = selector.replace(/&/g, '.' + className);
    nestedRules.push(`${fullSelector} {${rules}}`);
    return '';
  });

  // Actual styles to include into the generated stylesheet.
  return `.${className} {${mainRules}}\n` + nestedRules.join('\n');
}

class StylePiece {
  // Index of next auto-generated css class name.
  private static _next: number = 1;

  // Set of all StylePieces created but not yet mounted.
  private static _unmounted = new Set<StylePiece>();

  // Generate a new css class name.
  private static _nextClassName() { return `_grain${this._next++}`; }

  // Mount all unmounted StylePieces, and clear the _unmounted map.
  private static _mountAll(): void {
    const sheet = Array.from(this._unmounted, (p) => createCssRules(p.className, p._styles))
    .join('\n\n');

    G.document.head.appendChild(dom('style', sheet));
    for (const piece of this._unmounted) {
      piece._mounted = true;
    }
    this._unmounted.clear();
  }

  public readonly className: string;
  private _mounted: boolean = false;

  constructor(private _styles: string) {
    this.className = StylePiece._nextClassName();
    StylePiece._unmounted.add(this);
  }

  public use(): DomElementMethod {
    if (!this._mounted) { StylePiece._mountAll(); }
    return (elem) => { elem.classList.add(this.className); };
  }
}
