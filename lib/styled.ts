/**
 * Inspired by Reacts Styled Components.
 *
 * Usage:
 *    const Title = styled('h1', `
 *      font-size: 1.5em;
 *      text-align: center;
 *      color: palevioletred;
 *    `);
 *    const Wrapper = styled('section', `
 *      padding: 4em;
 *      background: papayawhip;
 *    `);
 *
 *    Wrapper(Title('Hello world'))
 *    // Equivalent to dom(`section.${Wrapper.cls}`, dom(`h1.${Title.cls}`, 'Hello world'));
 *
 * Calls to styled() should happen at the top level, at load time, to set up. Actual work happens
 * the first time a style is needed. Calling styled() elsewhere than at top level is wasteful and
 * terrible for performance.
 *
 * You may create a style that incorporates other styles by passing an extra second argument which
 * lists existing styles to extend, e.g.
 *
 *    const Title2 = styled('h2', [Title, Foo, Bar], `font-size: 1rem; color: red;`);
 *
 * You may use pseudo-classes or combinations with other components by adding an object that maps
 * a css selector to a block of css rules, where the css selector must use "&" to refer to the
 * current style's auto-generated selector. For example:
 *
 *    const Title = styled('h1', `font-size: 1.5rem; color: blue`, {
 *      "&:hover": `color: red`
 *    });
 *
 * To combine with an enclosing element, use the computed property notation and the "&" reference:
 *
 *    const Title = styled('h1', `font-size: 1.5rem; color: blue`, {
 *      [`.${Wrapper.cls}:hover &`]: `color: red`,
 *      "&::after": `content: '>>>'`,
 *    });
 */

// Changed syntax:
//  h2 = styled('h2', `styles...`)
//  styled(select, `styles...`)
//  styled(select, `${h2.css} styles...`)
import {dom, DomElementArg, DomElementMethod} from 'index';
type DomCreateFunc0 = (...args: DomElementArg[]) => Element;
type DomCreateFunc1<T> = (a: T, ...args: DomElementArg[]) => Element;
type DomCreateFunc2<T, U> = (a: T, b: U, ...args: DomElementArg[]) => Element;
type DomCreateFunc3<T, U, W> = (a: T, b: U, c: W, ...args: DomElementArg[]) => Element;

export interface IClsName {
  cls: string;
}

// In os: export function dom(tagString: string, ...args: DomElementArg[]): HTMLElement {
export function styled(tag: string|DomCreateFunc0, styles: string): DomCreateFunc0 & IClsName;
export function styled<T>(creator: DomCreateFunc1<T>, styles: string): DomCreateFunc1<T> & IClsName;
export function styled<T, U>(creator: DomCreateFunc2<T, U>, styles: string): DomCreateFunc2<T, U> & IClsName;
export function styled<T, U, W>(creator: DomCreateFunc3<T, U, W>, styles: string): DomCreateFunc3<T, U, W> & IClsName;
export function styled(creator: any, styles: string): any {
  const style = new StylePiece(styles);
  return Object.assign((typeof creator === 'string') ?
    (...args: DomElementArg[]) => dom(creator, ...args, style.use()) :
    (...args: any[]) => creator(...args, style.use()),
    {cls: style.cls});
}

function createCssRules(className: string, styles: string) {
  const nestedRules: string[] = [];
  const mainRules = styles.replace(/([^;]*)\s*{([^}]*)\s*}/g, (match, selector, rules) => {
    const fullSelector = selector.replace(/&/g, '.' + className);
    nestedRules.push(`${fullSelector} {${rules}}`);
    return '';
  });
  return `.${className} {${mainRules}}\n` + nestedRules.join('\n');
}

class StylePiece {
  private static _next: number = 1;
  private static _unmounted = new Set<StylePiece>();

  private static _nextClassName() { return `_grist_class_${this._next++}`; }

  private static _mountAll(): void {
    const sheet = Array.from(this._unmounted, (p) => createCssRules(p._className, p._styles))
    .join('\n\n');

    document.head.appendChild(dom('style', sheet));
    for (const piece of this._unmounted) {
      piece._mounted = true;
    }
    this._unmounted.clear();
  }

  private _className: string;
  private _mounted: boolean = false;

  constructor(private _styles: string) {
    this._className = StylePiece._nextClassName();
    StylePiece._unmounted.add(this);
  }

  public use(): DomElementMethod {
    if (!this._mounted) { StylePiece._mountAll(); }
    return (elem) => { elem.classList.add(this._className); };
  }

  public get cls(): string { return this._className; }
}
