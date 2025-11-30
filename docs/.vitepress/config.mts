import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'GrainJS',
  description: 'GrainJS: a lightweight typescript frontend framework',
  head: [
    ['script', {src: 'https://cdn.jsdelivr.net/npm/grainjs@1.0.2/dist/grain-full.min.js'}],
    ['script', {src: 'index.js'}],
  ],
});
