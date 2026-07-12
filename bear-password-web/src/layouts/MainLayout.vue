<template>
  <div class="main-layout" :class="{ 'main-layout--mobile': isMobile }">
    <header v-if="isMobile" class="main-layout__mobile-header">
      <AppLogo size="sm" />
    </header>

    <div class="main-layout__body">
      <aside v-if="!isMobile" class="main-layout__sidebar">
        <div class="main-layout__logo">
          <AppLogo size="sm" />
        </div>

        <SideNav />

        <div class="main-layout__sidebar-footer">
          <button
            type="button"
            class="main-layout__user-bar"
            :class="{ 'main-layout__user-bar--active': settingsDialog.visible }"
            :aria-label="t('nav.settings')"
            @click="openSettings"
          >
            <div class="main-layout__avatar">
              <img
                v-if="showAvatarImage"
                :src="authStore.avatar"
                :alt="authStore.displayName"
                class="main-layout__avatar-img"
                @error="onAvatarError"
              />
              <span v-else>{{ avatarLetter }}</span>
            </div>
            <div class="main-layout__user-meta">
              <span class="main-layout__username">{{ authStore.displayName }}</span>
            </div>
          </button>
        </div>
      </aside>

      <main class="main-layout__content" :class="{ 'main-layout__content--flush': isVaultPage }">
        <div class="main-layout__view">
          <router-view v-slot="{ Component, route: activeRoute }">
            <transition name="page-fade">
              <keep-alive :include="['VaultView']">
                <component
                  :is="Component"
                  :key="resolvePageKey(activeRoute)"
                  class="main-layout__page"
                />
              </keep-alive>
            </transition>
          </router-view>
        </div>
      </main>
    </div>

    <MobileTabBar v-if="isMobile" />

    <Teleport to="body">
      <div
        v-if="securityStore.isMigrating"
        class="main-layout__migration-overlay"
        role="alertdialog"
        aria-modal="true"
        aria-busy="true"
        aria-live="polite"
      >
        <div class="main-layout__migration-card">
          <div class="main-layout__migration-spinner" aria-hidden="true" />
          <h2 class="main-layout__migration-title">正在处理安全密钥</h2>
          <p class="main-layout__migration-message">{{ securityStore.migrationProgress.message }}</p>
          <el-progress
            v-if="securityStore.migrationProgress.total > 0"
            :percentage="migrationPercent"
            :stroke-width="8"
            :show-text="false"
            class="main-layout__migration-progress"
          />
          <p class="main-layout__migration-hint">请勿关闭页面或进行其他操作</p>
        </div>
      </div>
    </Teleport>

    <AnnouncementDialog />
    <SettingsDialog />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import AppLogo from '@/components/common/AppLogo.vue'
import AnnouncementDialog from '@/components/common/AnnouncementDialog.vue'
import MobileTabBar from '@/components/common/MobileTabBar.vue'
import SettingsDialog from '@/components/settings/SettingsDialog.vue'
import SideNav from '@/components/common/SideNav.vue'
import { getCurrentUserApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useSecurityStore } from '@/stores/security'
import { useServerStore } from '@/stores/server'
import { useSettingsDialogStore } from '@/stores/settingsDialog'
import { useVersionStore } from '@/stores/version'
import { useVaultStore } from '@/stores/vault'
import { preloadVaultViewChunk } from '@/utils/vaultViewPreload'
import { useAutoLockActivity } from '@/composables/useAutoLockActivity'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
const { isMobile } = useBreakpoint()
const authStore = useAuthStore()
const securityStore = useSecurityStore()
const serverStore = useServerStore()
const settingsDialog = useSettingsDialogStore()
const versionStore = useVersionStore()
const vaultStore = useVaultStore()
const route = useRoute()

const VAULT_PAGE_NAMES = new Set(['Vault', 'Favorites', 'Recent'])

const isVaultPage = computed(() => {
  const name = route.name
  return typeof name === 'string' && VAULT_PAGE_NAMES.has(name)
})

function resolvePageKey(activeRoute: RouteLocationNormalizedLoaded): string {
  const name = activeRoute.name
  if (typeof name === 'string' && VAULT_PAGE_NAMES.has(name)) {
    return 'vault-pages'
  }
  return activeRoute.path
}

const migrationPercent = computed(() => {
  const { current, total } = securityStore.migrationProgress
  if (!total) return 0
  return Math.min(100, Math.round((current / total) * 100))
})

const avatarLetter = computed(() => authStore.displayName.charAt(0).toUpperCase() || 'B')
const avatarLoadFailed = ref(false)
const showAvatarImage = computed(() => !!authStore.avatar && !avatarLoadFailed.value)

watch(() => authStore.avatar, () => {
  avatarLoadFailed.value = false
})

function openSettings(): void {
  settingsDialog.open()
}

function onAvatarError(): void {
  avatarLoadFailed.value = true
}

watch(
  () => serverStore.revision,
  () => {
    void versionStore.checkForUpdate()
  }
)

function prefetchVaultResources(): void {
  void import('@/views/vault/VaultViewHost.vue')
  const scheduleChunk = () => {
    void preloadVaultViewChunk()
  }
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(scheduleChunk, { timeout: 1500 })
  } else {
    setTimeout(scheduleChunk, 200)
  }
}

function scheduleVaultDataWarmup(): void {
  const run = () => {
    void vaultStore.ensureLoaded()
  }
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(run, { timeout: 2500 })
  } else {
    setTimeout(run, 400)
  }
}

watch(
  () => [authStore.isLoggedIn, securityStore.hasVaultAccess] as const,
  ([loggedIn, hasVaultAccess]) => {
    if (!loggedIn) return
    prefetchVaultResources()
    if (hasVaultAccess) {
      scheduleVaultDataWarmup()
    }
  },
  { immediate: true }
)

onMounted(() => {
  void getCurrentUserApi()
    .then((profile) => authStore.syncProfile(profile))
    .catch(() => {})
  void versionStore.checkForUpdate()
})

useAutoLockActivity()
</script>

<style scoped lang="scss">
.main-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: $color-bg-primary;

  &--mobile {
    .main-layout__content {
      padding: $spacing-md;
      padding-bottom: calc(#{$mobile-tab-bar-height} + env(safe-area-inset-bottom, 0px) + #{$spacing-md});

      &--flush {
        padding: 0;
        padding-bottom: calc(#{$mobile-tab-bar-height} + env(safe-area-inset-bottom, 0px));
      }
    }
  }

  &__mobile-header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    height: 48px;
    padding: 0 $spacing-md;
    border-bottom: 1px solid $color-border;
    background: $color-bg-secondary;
  }

  &__body {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
  }

  &__sidebar {
    width: $sidebar-width;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    padding: $spacing-md;
    @include glass-panel;
    border-right: 1px solid $color-border;
    border-radius: 0;
  }

  &__logo {
    padding: $spacing-sm $spacing-md $spacing-lg;
  }

  &__sidebar-footer {
    margin-top: auto;
    padding: $spacing-sm 0;
  }

  &__user-bar {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    width: 100%;
    padding: 10px $spacing-md;
    border: none;
    border-radius: $radius-md;
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition: background $transition-fast, color $transition-fast;

    &:hover {
      background: $color-surface-hover;

      .main-layout__username {
        color: $color-text-primary;
      }
    }

    &--active {
      background: $color-accent-subtle;
    }
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, $color-accent, #a29bfe);
    @include flex-center;
    font-size: $font-size-sm;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
    overflow: hidden;
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__user-meta {
    flex: 1;
    min-width: 0;
  }

  &__username {
    font-size: $font-size-md;
    font-weight: 500;
    color: $color-text-secondary;
    @include text-ellipsis;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-xl;
    min-width: 0;

    &--flush {
      padding: 0;
      overflow: hidden;

      .main-layout__view,
      .main-layout__page {
        height: 100%;
      }
    }
  }

  &__view {
    position: relative;
    width: 100%;
    min-height: 100%;
  }

  &__page {
    width: 100%;
  }
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity $transition-fast;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

.page-fade-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  pointer-events: none;
  z-index: 0;
}

.page-fade-enter-active {
  position: relative;
  z-index: 1;
}

.main-layout__migration-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  @include flex-center;
  padding: $spacing-xl;
}

.main-layout__migration-card {
  width: min(420px, 100%);
  padding: $spacing-xl;
  border-radius: $radius-lg;
  background: $color-bg-elevated;
  border: 1px solid $color-border;
  box-shadow: $shadow-lg;
  text-align: center;
}

.main-layout__migration-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto $spacing-lg;
  border-radius: 50%;
  border: 3px solid rgba($color-accent, 0.2);
  border-top-color: $color-accent;
  animation: migration-spin 0.8s linear infinite;
}

.main-layout__migration-title {
  margin: 0 0 $spacing-sm;
  font-size: $font-size-lg;
  font-weight: 600;
  color: $color-text-primary;
}

.main-layout__migration-message {
  margin: 0 0 $spacing-md;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.5;
  min-height: 1.5em;
}

.main-layout__migration-progress {
  margin-bottom: $spacing-md;
}

.main-layout__migration-hint {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-muted;
}

@keyframes migration-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
