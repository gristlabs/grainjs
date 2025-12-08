import DefaultTheme from 'vitepress/theme';
import GrainJsExample from './GrainJsExample.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({app}) {
    app.component('GrainJsExample', GrainJsExample);
  }
};
