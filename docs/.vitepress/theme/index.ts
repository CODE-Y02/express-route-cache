import DefaultTheme from "vitepress/theme";
import { h } from "vue";
// @ts-ignore
import ThemeSwitcher from "./components/ThemeSwitcher.vue";
// @ts-ignore
import VersionSwitcher from "./components/VersionSwitcher.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "nav-bar-content-after": () => h("div", { class: "nav-actions-wrapper desktop-only" }, [
        h(VersionSwitcher),
        h(ThemeSwitcher)
      ]),
      "nav-screen-content-after": () => h("div", { class: "nav-actions-wrapper mobile-actions" }, [
        h(VersionSwitcher),
        h(ThemeSwitcher)
      ])
    });
  },
  enhanceApp({ app }: any) {
    // register your custom global components
  },
};
