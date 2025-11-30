const {dom, styled} = grainjs;

// TODO: this should soon be made available as dom.onReady().
function onReady(handler) {
  if (document.readyState !== 'loading'){
    requestAnimationFrame(() => handler(null));
  } else {
    document.addEventListener('DOMContentLoaded', (ev) => handler(ev));
  }
}

onReady(() => {
  for (const elem of document.querySelectorAll('.grainjs-example')) {
    const height = elem.dataset.resultHeightRem;
    const pre = elem.nextElementSibling?.querySelector('pre');
    const code = pre.innerText;
    if (code) {
      const colorScheme = getComputedStyle(pre).colorScheme;
      const srcdoc = `
<!DOCTYPE html><html style="color-scheme: ${colorScheme}"><body>
<script src='https://cdn.jsdelivr.net/npm/grainjs@1.0.2/dist/grain-full.min.js'></script>
<script>
${code}
</script>
</body>
</html>
`;
      pre.after(
        cssIframe({sandbox: 'allow-scripts', srcdoc, style: `height: ${height}rem`})
      );
    }
  }
});

const cssIframe = styled('iframe', `
  border: none;
  border-top: 1px solid var(--vp-c-divider);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  width: 100%;
`);
