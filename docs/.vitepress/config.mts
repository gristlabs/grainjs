import { defineConfig } from 'vitepress';
import escapeRegExp from 'lodash/escapeRegExp';
import multiMdTable from 'markdown-it-multimd-table';

export default defineConfig({
  title: 'GrainJS',
  description: 'GrainJS: a lightweight typescript frontend framework',
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/gristlabs/grainjs' },
    ],
    search: {
      provider: 'local'
    },
    outline: {
      level: [2, 3]
    },
    sidebar: [
      {
        text: 'Documentation',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Getting started', link: '/getting-started' },
          { text: 'DOM & Observables', link: '/basics' },
          { text: 'Disposables', link: '/dispose' },
          { text: 'DOM components', link: '/dom-components' },
          { text: 'Event Emitters', link: '/event-emitters' },
          { text: 'Knockout integration', link: '/knockout' },
          { text: 'More on observables', link: '/more-observables' },
          { text: 'More on computeds', link: '/more-computeds' },
          { text: 'API reference', link: '/api/' },
          { text: 'OLD Reference', link: '/reference' },
        ]
      }
    ]
  },
  markdown: {
    config: (md) => { md.use(multiMdTable, {multiline: true, headerless: true}); },
    codeTransformers: [{
      name: 'linkify-refs',
      preprocess(code) {
        const rawMeta = this.options?.meta?.__raw ?? '';
        const m = rawMeta.match(/\brefs=([^ ]+)/);
        if (m) {
          this.linkifyMap = new Map(m[1].split('|').map(part => part.split("=")));
          this.linkifyRegExp = new RegExp(
            '\\b(' + [...this.linkifyMap.keys()].map(escapeRegExp).join('|') + ')\\b');
        }
        return code;
      },
      span(node) {
        if (!this.linkifyMap) { return node; }
        const children = node.children;
        if (children?.length === 1 && children[0].type === 'text') {
          const child = children[0];
          const parts = child.value.split(this.linkifyRegExp);
          node.children = [];
          for (let i = 0; i < parts.length; i += 2) {
            node.children.push({...child, value: parts[i]});
            if (i + 1 < parts.length) {
              const value = parts[i + 1];
              const destination = this.linkifyMap.get(value);
              const newChild = {...child, value};
              let href = null;
              if (destination) {
                const match = destination.match(/^([^!]*)!([^:]+):.*$/);
                if (match) {
                  if (match[1] === 'grainjs') {
                    href = `#${match[2]}`;
                  } else if (match[1] === '') {
                    href = `https://developer.mozilla.org/en-US/docs/Web/API/${match[2]}`;
                  }
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
    }],
  }
});
