<template>
  <div class="version-switcher-wrapper">
    <button
      class="version-btn"
      @click.stop="isOpen = !isOpen"
      aria-label="Switch Version"
    >
      <span class="version-name">{{ currentVersionName }}</span>
      <svg
        class="chevron"
        :class="{ open: isOpen }"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <div v-if="isOpen" class="dropdown-menu">
      <a
        v-for="ver in versions"
        :key="ver.id"
        :href="withBase(ver.link)"
        class="dropdown-item"
        :class="{ active: currentVersion === ver.id }"
        @click="close"
      >
        {{ ver.name }}
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute, withBase } from "vitepress";

const route = useRoute();
const isOpen = ref(false);
const currentVersion = ref("v2.x");

const versions = [
  { id: "Latest", name: "Latest", link: "/" },
  { id: "Legacy", name: "Legacy", link: "/v1/" },
];

const currentVersionName = computed(() => {
  return (
    versions.find((v) => v.id === currentVersion.value)?.name || "Versions"
  );
});

function close() {
  isOpen.value = false;
}

watch(
  () => route.path,
  (path) => {
    if (path.includes("/v1/")) {
      currentVersion.value = "v1.0.x";
    } else {
      currentVersion.value = "v1.1.x";
    }
  },
  { immediate: true },
);

onMounted(() => {
  window.addEventListener("click", close);
});

onUnmounted(() => {
  window.removeEventListener("click", close);
});
</script>

<style scoped>
.version-switcher-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin-left: 16px;
  padding-left: 16px;
  border-left: 1px solid var(--vp-c-divider);
}

.version-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition:
    color 0.2s,
    background-color 0.2s;
}

.version-btn:hover {
  color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-soft);
}

.version-name {
  min-width: 50px;
  text-align: left;
}

.chevron {
  transition: transform 0.2s ease;
  width: 14px;
  height: 14px;
}

.chevron.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 8px;
  min-width: 140px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
  text-decoration: none;
}

.dropdown-item:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.dropdown-item.active {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-mute);
}

@media (max-width: 768px) {
  .version-switcher-wrapper {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
  }
}
</style>
