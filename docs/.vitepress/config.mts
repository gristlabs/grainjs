import { defineConfig } from 'vitepress';
import multiMdTable from 'markdown-it-multimd-table';
import {linkifyRefs} from './theme/linkifyRefs';

export default defineConfig({
  title: 'GrainJS',
  description: 'GrainJS: a lightweight typescript frontend framework',
  base: '/grainjs/',
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
          { text: 'Examples', link: '/examples' },
          { text: 'DOM & Observables', link: '/basics' },
          { text: 'Disposables', link: '/dispose' },
          { text: 'DOM components', link: '/dom-components' },
          { text: 'Event Emitters', link: '/event-emitters' },
          { text: 'Knockout integration', link: '/knockout' },
          { text: 'More on observables', link: '/more-observables' },
          { text: 'More on computeds', link: '/more-computeds' },
          { text: 'API reference', link: '/api/' },
        ]
      }
    ]
  },
  markdown: {
    config: (md) => { md.use(multiMdTable, {multiline: true, headerless: true}); },
    codeTransformers: [linkifyRefs],
  }
});
