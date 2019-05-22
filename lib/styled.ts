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
 *
 * Animations with @keyframes may be created with a unique name by using the keyframes() helper:
 *
 *    const rotate360 = keyframes(`
 *      from { transform: rotate(0deg); }
 *      to { transform: rotate(360deg); }
 *    `);
 *
 *    const Rotate = styled('div', `
 *      display: inline-block;
 *      animation: ${rotate360} 2s linear infinite;
 *    `);
 */

// Use the browser globals in a way that allows replacing them with mocks in tests.
import {G} from './browserGlobals';
import {dom, DomArg, DomElementArg, DomElementMethod, TagElem, TagName} from './domImpl';
import {cls, clsPrefix} from './domMethods';

type DomArgs<R> = Array<DomArg<R>>;

export type DomCreateFunc0<R, Args extends DomArgs<R> = DomArgs<R>> = (...args: Args) => R;
export type DomCreateFunc1<R, T, Args extends DomArgs<R>> = (a: T, ...args: Args) => R;
export type DomCreateFunc2<R, T, U, Args extends DomArgs<R>> = (a: T, b: U, ...args: Args) => R;
export type DomCreateFunc3<R, T, U, W, Args extends DomArgs<R>> = (a: T, b: U, c: W, ...args: Args) => R;

// The value returned by styled() matches the input (first argument), and also implements IClsName
// interface.
export interface IClsName {
  className: string;      // Name of the generated class.
  cls: typeof cls;        // Helper like dom.cls(), but which prefixes classes by className.
}

// See module documentation for details.
export function styled<Tag extends TagName>(
  tag: Tag, styles: string): DomCreateFunc0<TagElem<Tag>, DomArgs<TagElem<Tag>>> & IClsName;
export function styled<R extends Element, Args extends DomArgs<R>>(
  creator: DomCreateFunc0<R, Args>, styles: string): typeof creator & IClsName;
export function styled<R extends Element, T, Args extends DomArgs<R>>(
  creator: DomCreateFunc1<R, T, Args>, styles: string): typeof creator & IClsName;
export function styled<R extends Element, T, U, Args extends DomArgs<R>>(
  creator: DomCreateFunc2<R, T, U, Args>, styles: string): typeof creator & IClsName;
export function styled<R extends Element, T, U, W, Args extends DomArgs<R>>(
  creator: DomCreateFunc3<R, T, U, W, Args>, styles: string): typeof creator & IClsName;
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
    cls: clsPrefix.bind(null, style.className),
  });
}

// Keyframes produces simply a string with the generated name. Note that these does not support
// nesting or ampersand (&) handling, since these would be difficult and are entirely unneeded.
export function keyframes(styles: string): string {
  return (new KeyframePiece(styles)).className;
}

function createCssRules(className: string, styles: string) {
  // The first time we encounter a nested section, we know which are the "main" rules, and can
  // wrap them appropriately.
  const nestedStart = styles.search(/[^;]*\{/);
  const mainRules = nestedStart < 0 ? styles : styles.slice(0, nestedStart);
  const nestedRules = nestedStart < 0 ? "" : styles.slice(nestedStart);

  // At the end, replace all occurrences of & with ".className".
  return `& {${mainRules}\n}\n${nestedRules}`.replace(/&/g, className);
}

// Used by getNextStyleNum when running without a global window object (e.g. in tests).
const _global = {};

// Keep the counter for next class attached to the global window object rather than be a library
// global. This way if by some chance multiple instance of grainjs are loaded into the page, it
// still works without overwriting class names (which would be extremely confusing).
function getNextStyleNum() {
  const g: any = G.window || _global;
  return g._grainNextStyleNum = (g._grainNextStyleNum || 0) + 1;
}

class StylePiece {
  // Set of all StylePieces created but not yet mounted.
  private static _unmounted = new Set<StylePiece>();

  // Generate a new css class name. The suffix ensures that names like "&2" can't cause a conflict.
  private static _nextClassName() { return `_grain${getNextStyleNum()}_`; }

  // Mount all unmounted StylePieces, and clear the _unmounted map.
  private static _mountAll(): void {
    const sheet: string = Array.from(this._unmounted, (p) => p._createRules()).join("\n\n");

    G.document.head!.appendChild(dom('style', sheet));
    for (const piece of this._unmounted) {
      piece._mounted = true;
    }
    this._unmounted.clear();
  }

  public readonly className: string;
  private _mounted: boolean = false;

  constructor(protected _styles: string) {
    this.className = StylePiece._nextClassName();
    StylePiece._unmounted.add(this);
  }

  public use(): DomElementMethod {
    if (!this._mounted) { StylePiece._mountAll(); }
    return (elem) => { elem.classList.add(this.className); };
  }

  protected _createRules(): string {
    return createCssRules('.' + this.className, this._styles);
  }
}

class KeyframePiece extends StylePiece {
  protected _createRules(): string {
    return `@keyframes ${this.className} {${this._styles}}`;
  }
}
