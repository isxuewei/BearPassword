<template>
  <!-- 左侧导航菜单，类似 1Password 侧边栏 -->
  <nav class="side-nav">
    <router-link
      v-for="item in navItems"
      :key="item.name"
      :to="{ name: item.name }"
      class="side-nav__item"
      :class="{ 'side-nav__item--active': isActive(item.name) }"
    >
      <span class="side-nav__icon" v-html="item.icon" />
      <span class="side-nav__label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@/composables/useI18n'

const route = useRoute()
const { t } = useI18n()

/** 导航项配置 */
const navItems = computed(() => [
  {
    name: 'Dashboard',
    label: t('nav.dashboard'),
    icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="10" y="1" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="1" y="10" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="10" y="10" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/></svg>`
  },
  {
    name: 'Vault',
    label: t('nav.vault'),
    icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 4V3C6 2 7 1 9 1C11 1 12 2 12 3V4" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/></svg>`
  },
  {
    name: 'Favorites',
    label: t('nav.favorites'),
    icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L11 6.5L16 7.2L12.5 10.5L13.3 15.5L9 13.2L4.7 15.5L5.5 10.5L2 7.2L7 6.5L9 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`
  },
  {
    name: 'Recent',
    label: t('nav.recent'),
    icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M9 5V9L12 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
  },
  {
    name: 'Settings',
    label: t('nav.settings'),
    icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M9 1.5V3.5M9 14.5V16.5M1.5 9H3.5M14.5 9H16.5M3.6 3.6L5 5M13 13L14.4 14.4M3.6 14.4L5 13M13 5L14.4 3.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
  }
])

function isActive(name: string): boolean {
  return route.name === name
}
</script>

<style scoped lang="scss">
.side-nav {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-sm 0;

  &__item {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: 10px $spacing-md;
    border-radius: $radius-md;
    color: $color-text-secondary;
    text-decoration: none;
    transition: all $transition-fast;
    @include no-drag;

    &:hover {
      color: $color-text-primary;
      background: $color-surface-hover;
    }

    &--active {
      color: $color-text-primary;
      background: $color-accent-subtle;

      .side-nav__icon {
        color: $color-accent;
      }
    }
  }

  &__icon {
    @include flex-center;
    flex-shrink: 0;
    color: inherit;
  }

  &__label {
    font-size: $font-size-md;
    font-weight: 500;
  }
}
</style>
