import { defineConfig } from 'vitepress';

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
          { text: 'Reference', link: '/reference' },
        ]
      }
    ]
  }
});
