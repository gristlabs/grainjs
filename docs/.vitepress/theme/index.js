import DefaultTheme from 'vitepress/theme';
import GrainJsExample from './GrainJsExample.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({app}) {
    app.component('GrainJsExample', GrainJsExample);
  }
};
