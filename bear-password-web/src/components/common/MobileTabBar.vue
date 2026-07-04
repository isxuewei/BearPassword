<template>
  <nav class="mobile-tab-bar" :aria-label="t('nav.main')">
    <router-link
      v-for="item in tabItems"
      :key="item.name"
      :to="{ name: item.name }"
      class="mobile-tab-bar__item"
      :class="{ 'mobile-tab-bar__item--active': isActive(item.name) }"
    >
      <span class="mobile-tab-bar__icon" v-html="item.icon" />
      <span class="mobile-tab-bar__label">{{ item.label }}</span>
    </router-link>
    <button
      type="button"
      class="mobile-tab-bar__item"
      :class="{ 'mobile-tab-bar__item--active': settingsDialog.visible }"
      :aria-label="t('nav.settings')"
      @click="settingsDialog.open()"
    >
      <span class="mobile-tab-bar__icon">
        <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="2.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M9 1.5V3.5M9 14.5V16.5M1.5 9H3.5M14.5 9H16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </span>
      <span class="mobile-tab-bar__label">{{ t('nav.settings') }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import { useSettingsDialogStore } from '@/stores/settingsDialog'

const route = useRoute()
const { t } = useI18n()
const settingsDialog = useSettingsDialogStore()

const tabItems = computed(() => [
  {
    name: 'Dashboard',
    label: t('nav.dashboard'),
    icon: `<svg width="20" height="20" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="10" y="1" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="1" y="10" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="10" y="10" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/></svg>`
  },
  {
    name: 'Vault',
    label: t('nav.vault'),
    icon: `<svg width="20" height="20" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 4V3C6 2 7 1 9 1C11 1 12 2 12 3V4" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/></svg>`
  },
  {
    name: 'Favorites',
    label: t('nav.favorites'),
    icon: `<svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M9 2L11 6.5L16 7.2L12.5 10.5L13.3 15.5L9 13.2L4.7 15.5L5.5 10.5L2 7.2L7 6.5L9 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`
  },
  {
    name: 'Recent',
    label: t('nav.recent'),
    icon: `<svg width="20" height="20" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M9 5V9L12 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
  }
])

function isActive(name: string): boolean {
  return route.name === name
}
</script>

<style scoped lang="scss">
.mobile-tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
  background: $color-bg-secondary;
  border-top: 1px solid $color-border;
  backdrop-filter: blur(12px);

  &__item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 44px;
    padding: 4px 2px;
    border-radius: $radius-sm;
    color: $color-text-muted;
    text-decoration: none;
    font-size: 10px;
    font-weight: 500;
    transition: color $transition-fast, background $transition-fast;

    &--active {
      color: $color-accent;

      .mobile-tab-bar__icon {
        color: $color-accent;
      }
    }
  }

  &__icon {
    @include flex-center;
    width: 24px;
    height: 24px;
    color: inherit;
  }

  &__label {
    line-height: 1.2;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
