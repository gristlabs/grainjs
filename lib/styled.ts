// Use the browser globals in a way that allows replacing them with mocks in tests.
import {G} from './browserGlobals';
import {dom, IDomArgs, TagElem, TagName} from './domImpl';
import {cls, clsPrefix} from './domMethods';

// The value returned by styled() matches the input (first argument), and also implements IClsName
// interface.
export interface IClsName {
  className: string;      // Name of the generated class.
  cls: typeof cls;        // Helper like dom.cls(), but which prefixes classes by className.
}

export type DomCreateFunc<R, Args extends IDomArgs<R> = IDomArgs<R>> = (...args: Args) => R;

/**
 * In-code styling for DOM components, inspired by Reacts Styled Components.
 *
 * Usage:
 * ```ts
 * const cssTitle = styled('h1', `
 *   font-size: 1.5em;
 *   text-align: center;
 *   color: palevioletred;
 * `);
 *
 * const cssWrapper = styled('section', `
 *   padding: 4em;
 *   background: papayawhip;
 * `);
 *
 * cssWrapper(cssTitle('Hello world'))
 * ```
 *
 * This generates class names for `cssTitle` and `cssWrapper`, adds the styles to the document on
 * first use, and the result is equivalent to:
 * ```ts
 * dom(`section.${cssWrapper.className}`, dom(`h1.${cssTitle.className}`, 'Hello world'));
 * ```
 *
 * What `styled(tag)` returns is a function that takes the same arguments `...args` as
 * `dom(tag, ...args)`. In particular, you may call it with all the arguments that
 * [`dom()`](#dom) takes: content, DOM methods, event handlers, etc.
 *
 * Calls to `styled()` should happen at the top level, at import time, in order to register all
 * styles upfront. Actual work happens the first time a style is needed to create an element.
 * Calling `styled()` elsewhere than at top level is wasteful and bad for performance.
 *
 * You may create a style that modifies an existing `styled()` or other component, e.g.
 * ```ts
 * const cssTitle2 = styled(cssTitle, `font-size: 1rem; color: red;`);
 * ```
 *
 * Now calling `cssTitle2('Foo')` becomes equivalent to
 * `dom('h1', {className: cssTitle.className + ' ' + cssTitle2.className})`.
 *
 * Styles may incorporate other related styles by nesting them under the main one as follows:
 * ```ts
 * const myButton = styled('button', `
 *   border-radius: 0.5rem;
 *   border: 1px solid grey;
 *   font-size: 1rem;
 *
 *   &:active {
 *     background: lightblue;
 *   }
 *   &-small {
 *     font-size: 0.6rem;
 *   }
 * `);
 * ```
 *
 * In nested styles, ampersand (&) gets replaced with the generated .className of the main element.
 *
 * The resulting styled component provides a `.cls()` helper to simplify using prefixed classes. It
 * behaves as `dom.cls()`, but prefixes the class names with the generated className of the main
 * element. E.g. for the example above,
 * ```ts
 * myButton(myButton.cls('-small'), 'Test')
 * ```
 *
 * creates a button with both the `myButton` style above, and the style specified under "&-small".
 */
// See module documentation for details.
export function styled<Tag extends TagName>(tag: Tag, styles: string): DomCreateFunc<TagElem<Tag>> & IClsName;
export function styled<Args extends any[], R extends Element>(
  creator: (...args: Args) => R, styles: string): typeof creator & IClsName;
export function styled(creator: any, styles: string): IClsName {
  // Note that we intentionally minimize the work done when styled() is called; it's better to do
  // any needed work on first use. That's when we will actually build the css rules.
  const style = new StylePiece(styles);

  // Creator function reflects the input, with only the addition of style.use() at the end. Note
  // that it needs to be at the end because creator() might take special initial arguments.
  const newCreator = (typeof creator === 'string') ?
    (...args: any[]) => style.addToElem(dom(creator, ...args)) :
    (...args: any[]) => style.addToElem(creator(...args));
  return Object.assign(newCreator, {
    className: style.className,
    cls: clsPrefix.bind(null, style.className),
  });
}

/**
 * Animations with `@keyframes` may be created with a unique name by using the keyframes() helper:
 * ```ts
 * const rotate360 = keyframes(`
 *   from { transform: rotate(0deg); }
 *   to { transform: rotate(360deg); }
 * `);
 *
 * const Rotate = styled('div', `
 *   display: inline-block;
 *   animation: ${rotate360} 2s linear infinite;
 * `);
 * ```
 *
 * This function returns simply a string with the generated name. Note that keyframes do not
 * support nesting or ampersand (&) handling, like `styled()` does, since these would be difficult
 * and are entirely unneeded.
 */
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

  public addToElem<T extends Element>(elem: T): T {
    if (!this._mounted) { StylePiece._mountAll(); }
    elem.classList.add(this.className);
    return elem;
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
