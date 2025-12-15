
/**
 * This is a transformer for Shiki syntax highlighter; see https://shiki.style/guide/transformers.
 * It turns references in the code (particularly function signatures in the API reference) into
 * links to their definitions.
 *
 * The mapping of reference to link is specified by an extra property on the code block, written
 * by scripts/generate-api-md.js, in the format "refs=name1=link1|name2=link2|etc..."
 */

export const linkifyRefs = {
  name: 'linkify-refs',
  preprocess(code) {
    const rawMeta = this.options?.meta?.__raw ?? '';
    const m = rawMeta.match(/\brefs=([^ ]+)/);
    if (m) {
      this.linkifyMap = new Map(m[1].split('|').map(part => part.split("=")));
    }
    return code;
  },
  span(node) {
    if (!this.linkifyMap) { return node; }
    const children = node.children;
    if (children?.length === 1 && children[0].type === 'text') {
      const child = children[0];
      const parts = child.value.split(/\b(\w+)\b/);
      node.children = [];
      for (let i = 0; i < parts.length; i += 2) {
        node.children.push({...child, value: parts[i]});
        if (i + 1 < parts.length) {
          const value = parts[i + 1];
          const destination = this.linkifyMap.get(value);
          const newChild = {...child, value};
          let href = null;
          if (destination) {
            const match = extractCanonicalName(destination);
            if (match) {
              href = '#' + match;
            } else {
              href = destination
                .replace(/^tsutil#/, 'https://www.typescriptlang.org/docs/handbook/utility-types.html#')
                .replace(/^mdn#/, 'https://developer.mozilla.org/en-US/docs/Web/API/');
            }
          }
          if (href) {
            node.children.push({type: "element", tagName: "a", properties: {href}, children: [newChild]});
          } else {
            node.children.push(newChild);
          }
        }
      }
    }
  }
};

function extractCanonicalName(canonicalReference) {
  const match = canonicalReference.match(/^grainjs!([^:]+):(\w+).*$/);
  if (!match) { return null; }
  if (match[2] === 'constructor') { return match[1] + '#constructor'; }
  return match[1];
}
