<template>
  <div class="theme-switcher-wrapper">
    <button class="theme-btn" @click.stop="isOpen = !isOpen" aria-label="Switch Theme">
      <span class="theme-icon">{{ currentThemeIcon }}</span>
      <span class="theme-name">{{ currentThemeName }}</span>
      <svg class="chevron" :class="{ open: isOpen }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </button>
    
    <div v-if="isOpen" class="dropdown-menu">
      <button 
        v-for="theme in themes" 
        :key="theme.id" 
        class="dropdown-item" 
        :class="{ active: currentTheme === theme.id }"
        @click.stop="applyTheme(theme.id)"
      >
        <span class="dropdown-icon">{{ theme.icon }}</span>
        {{ theme.name }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'

const isOpen = ref(false)
const currentTheme = ref('ember')

const themes = [
  { id: 'ember', name: 'Ember', icon: '🔥' },
  { id: 'thunder', name: 'Thunder', icon: '⚡' },
  { id: 'sea', name: 'Sea', icon: '🐋' },
  { id: 'night', name: 'Night', icon: '🌙' }
]

const currentThemeName = computed(() => {
  return themes.find(t => t.id === currentTheme.value)?.name || 'Ember'
})

const currentThemeIcon = computed(() => {
  return themes.find(t => t.id === currentTheme.value)?.icon || '🔥'
})

function close(e) {
  isOpen.value = false
}

onMounted(() => {
  const savedTheme = localStorage.getItem('erc-theme') || 'ember'
  // Migrate old 'enver' to 'ember'
  if (savedTheme === 'enver') currentTheme.value = 'ember'
  // Migrate old 'space' to 'night'
  else if (savedTheme === 'space') currentTheme.value = 'night'
  else currentTheme.value = savedTheme

  document.documentElement.setAttribute('data-theme', currentTheme.value)
  window.addEventListener('click', close)
})

onUnmounted(() => {
  window.removeEventListener('click', close)
})

function applyTheme(themeId) {
  currentTheme.value = themeId
  document.documentElement.setAttribute('data-theme', themeId)
  localStorage.setItem('erc-theme', themeId)
  isOpen.value = false
}
</script>

<style scoped>
.theme-switcher-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin-left: 16px;
  padding-left: 16px;
  border-left: 1px solid var(--vp-c-divider);
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: color 0.2s, background-color 0.2s;
}

.theme-btn:hover {
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg-soft);
}

.theme-name {
  min-width: 50px;
  text-align: left;
}

.chevron {
  transition: transform 0.2s ease;
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
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.dropdown-item:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.dropdown-item.active {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-mute);
}

.swatch {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

@media (max-width: 768px) {
  .theme-switcher-wrapper {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
  }
}
</style>
