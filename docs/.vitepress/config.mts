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
      level: 3
    },
    sidebar: [
      {
        text: 'Documentation',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Basics', link: '/basics' },
          { text: 'Dispose', link: '/dispose' },
          { text: 'Misc', link: '/misc' },
          { text: 'More observables', link: '/more-observables' },
          { text: 'Reference', link: '/reference' },
        ]
      }
    ]
  }
});
