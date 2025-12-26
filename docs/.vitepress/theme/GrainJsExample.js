/**
 * Turns a code block into an example with a preview.
 *
 * Renders the preview in an iframe (that's not same-origin) to allow it to render examples
 * written by users too, reasonably safely.
 */
import {dom, Observable, styled} from '../../..';

const iframeSandbox = [
  'allow-scripts',
  'allow-downloads',
  'allow-modals',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-top-navigation-by-user-activation',
];

let colorSchemeObs = null;
let observer = null;

export function prepareExample(elem, heightRem) {
  if (!observer) {
    // We watch for changes to <html> element's classes, because we need to manually update previews
    // for changes to light/dark mode (because the previews are in iframes).
    const getColorScheme = () => getComputedStyle(document.documentElement).colorScheme;
    colorSchemeObs = Observable.create(null, getColorScheme());
    observer = new MutationObserver((mutations) => { colorSchemeObs.set(getColorScheme()); });
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
  }

  const pre = elem.previousElementSibling?.querySelector('pre');
  let code = pre?.innerText;
  if (code) {
    dom.update(elem,
      cssResult.cls(''),
      cssIframe({sandbox: iframeSandbox.join(' '), style: `height: ${heightRem}rem`},
        dom.prop('srcdoc', use => `
<!DOCTYPE html><html style="color-scheme: ${use(colorSchemeObs)}"><body>
  <script src='https://cdn.jsdelivr.net/npm/grainjs@1/dist/grain-full.min.js'></script>
  <script>
  ${code}
  </script>
</body></html>`
        ),
      )
    );
  }
}

const cssResult = styled('div', `
  position: relative;
  margin-top: -24px;
  display: flex;
  background-color: var(--vp-button-alt-bg);
  border: 1px solid var(--vp-c-divider);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  color: var(--vp-code-lang-color);

  &::before {
    content: "»";
    width: 16px;
    text-align: center;
  }
`);

const cssIframe = styled('iframe', `
  border: none;
  flex: auto;
  background-color: var(--vp-c-bg);
  border-bottom-right-radius: 8px;
`);
