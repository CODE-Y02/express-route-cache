import DefaultTheme from "vitepress/theme";
import { h } from "vue";
// @ts-ignore
import ThemeSwitcher from "./components/ThemeSwitcher.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(ThemeSwitcher)
    });
  },
  enhanceApp({ app }: any) {
    // register your custom global components
  },
};
