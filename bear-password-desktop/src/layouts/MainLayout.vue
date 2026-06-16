<template>
  <!-- 主界面布局：自定义标题栏 + 左侧导航 + 右侧内容区 -->
  <div class="main-layout">
    <TitleBar />

    <div class="main-layout__body">
      <!-- 左侧边栏 -->
      <aside class="main-layout__sidebar">
        <div class="main-layout__logo">
          <AppLogo size="sm" />
        </div>

        <SideNav />

        <div class="main-layout__user">
          <button
            type="button"
            class="main-layout__user-trigger"
            :class="{ 'main-layout__user-trigger--active': isProfileActive }"
            :aria-label="t('profile.ariaLabel')"
            @click="goProfile"
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
            <span class="main-layout__username">{{ authStore.displayName }}</span>
          </button>
        </div>
      </aside>

      <!-- 右侧内容区 -->
      <main class="main-layout__content">
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
          <p class="main-layout__migration-hint">请勿关闭应用或进行其他操作</p>
        </div>
      </div>
    </Teleport>

    <LockScreen />
    <AnnouncementDialog />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import TitleBar from '@/components/window/TitleBar.vue'
import AppLogo from '@/components/common/AppLogo.vue'
import LockScreen from '@/components/common/LockScreen.vue'
import AnnouncementDialog from '@/components/common/AnnouncementDialog.vue'
import SideNav from '@/components/common/SideNav.vue'
import { getCurrentUserApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useAutoLockStore } from '@/stores/autoLock'
import { useSecurityStore } from '@/stores/security'
import { useServerStore } from '@/stores/server'
import { useVersionStore } from '@/stores/version'
import { useAutoLockActivity } from '@/composables/useAutoLockActivity'
import { useI18n } from '@/composables/useI18n'

const router = useRouter()
const { t } = useI18n()
const route = useRoute()
const authStore = useAuthStore()
const autoLockStore = useAutoLockStore()
const securityStore = useSecurityStore()
const serverStore = useServerStore()
const versionStore = useVersionStore()

const VAULT_PAGE_NAMES = new Set(['Vault', 'Favorites', 'Recent'])

/** 密码库 / 收藏 / 最近访问共用同一组件实例，避免切换时销毁重建 */
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

/** 昵称首字母作为头像占位 */
const avatarLetter = computed(() => {
  return authStore.displayName.charAt(0).toUpperCase() || 'B'
})

const avatarLoadFailed = ref(false)

const showAvatarImage = computed(() => !!authStore.avatar && !avatarLoadFailed.value)

const isProfileActive = computed(() => route.name === 'Profile')

watch(() => authStore.avatar, () => {
  avatarLoadFailed.value = false
})

function goProfile(): void {
  if (route.name !== 'Profile') {
    router.push({ name: 'Profile' })
  }
}

function onAvatarError(): void {
  avatarLoadFailed.value = true
}

function isRecordingShortcut(event: KeyboardEvent): boolean {
  return !!(event.target as HTMLElement | null)?.closest('.shortcut-input--recording')
}

function onSettingsHotkey(event: KeyboardEvent): void {
  if (event.repeat || isRecordingShortcut(event)) return
  if (!(event.metaKey || event.ctrlKey) || event.key !== ',') return
  if (securityStore.isMigrating || autoLockStore.isLocked) return

  event.preventDefault()
  if (route.name !== 'Settings') {
    router.push({ name: 'Settings' })
  }
}

watch(
  () => serverStore.revision,
  () => {
    void versionStore.checkForUpdate()
  }
)

onMounted(() => {
  window.addEventListener('keydown', onSettingsHotkey)
  void getCurrentUserApi()
    .then((profile) => authStore.syncProfile(profile))
    .catch(() => {})
  void versionStore.checkForUpdate()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onSettingsHotkey)
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

  &__body {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  &__sidebar {
    width: $sidebar-width;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    padding: $spacing-md;
    @include glass-panel;
    border-right: 1px solid $color-border;
    border-top: none;
    border-left: none;
    border-bottom: none;
    border-radius: 0;
  }

  &__logo {
    padding: $spacing-sm $spacing-md $spacing-lg;
    @include no-drag;
  }

  &__user {
    margin-top: auto;
    padding: $spacing-sm 0;
    @include no-drag;
  }

  &__user-trigger {
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
    }

    &--active {
      background: $color-accent-subtle;

      .main-layout__username {
        color: $color-text-primary;
      }
    }

    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px $color-accent-subtle;
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

  &__username {
    flex: 1;
    min-width: 0;
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
  }

  /* 相对定位容器：切换时新旧页面叠放，避免在文档流中上下堆叠闪现 */
  &__view {
    position: relative;
    width: 100%;
    min-height: 100%;
  }

  &__page {
    width: 100%;
  }
}

/* 页面切换：仅透明度过渡，离开页绝对定位覆盖在原位 */
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
