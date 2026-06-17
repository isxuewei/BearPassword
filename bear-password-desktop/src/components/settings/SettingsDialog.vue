<template>
  <Teleport to="body">
    <el-config-provider :z-index="Z_INDEX_SETTINGS_OVERLAY">
      <Transition name="settings-modal-fade">
        <div
          v-if="settingsDialog.visible"
          class="settings-modal"
          role="presentation"
          :style="{ zIndex: Z_INDEX_SETTINGS_MODAL }"
          @mousedown.self="settingsDialog.close()"
        >
        <div
          class="settings-modal__panel"
          role="dialog"
          aria-modal="true"
          :aria-label="t('settings.title')"
          @keydown.esc="settingsDialog.close()"
        >
          <header class="settings-modal__header">
            <button
              type="button"
              class="settings-modal__close"
              :aria-label="t('settings.close')"
              @click="settingsDialog.close()"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </header>

          <div class="settings-modal__body">
            <nav class="settings-modal__nav" :aria-label="t('settings.title')">
              <button
                v-for="item in SETTINGS_DIALOG_NAV"
                :key="item.id"
                type="button"
                class="settings-modal__nav-item"
                :class="{ 'settings-modal__nav-item--active': activeSection === item.id }"
                @click="activeSection = item.id"
              >
                <span class="settings-modal__nav-icon" v-html="item.icon" />
                <span class="settings-modal__nav-label">{{ t(item.labelKey) }}</span>
              </button>
            </nav>

            <div class="settings-modal__main">
              <div class="settings-modal__scroll">
                <ProfileSettingsPanel v-if="activeSection === 'account'" embedded />
                <SettingsView v-else embedded dialog :section="activeSection" />
              </div>
            </div>
          </div>
        </div>
        </div>
      </Transition>
    </el-config-provider>
  </Teleport>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import SettingsView from '@/views/settings/SettingsView.vue'
import ProfileSettingsPanel from '@/components/settings/ProfileSettingsPanel.vue'
import { SETTINGS_DIALOG_NAV } from '@/constants/settingsDialogNav'
import { Z_INDEX_SETTINGS_MODAL, Z_INDEX_SETTINGS_OVERLAY } from '@/constants/zIndex'
import { useI18n } from '@/composables/useI18n'
import { useSettingsDialogStore } from '@/stores/settingsDialog'
import {
  clearSettingsDialogBodyClass,
  setSettingsDialogBodyClass
} from '@/utils/settingsDialogBodyClass'
import type { SettingsDialogSection } from '@/types/settingsDialog'

const { t } = useI18n()
const settingsDialog = useSettingsDialogStore()
const activeSection = ref<SettingsDialogSection>('account')

watch(
  () => settingsDialog.visible,
  (visible) => {
    setSettingsDialogBodyClass(visible)
    if (visible) {
      activeSection.value = 'account'
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  clearSettingsDialogBodyClass()
})
</script>

<style scoped lang="scss">
.settings-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5vh 16px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
}

.settings-modal__panel {
  width: min(860px, calc(100vw - 32px));
  height: min(640px, calc(100vh - 48px));
  display: flex;
  flex-direction: column;
  border-radius: $radius-xl;
  background: $color-bg-secondary;
  border: 1px solid $color-border;
  box-shadow: $shadow-lg;
  overflow: hidden;
  outline: none;
}

.settings-modal__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 44px;
  padding: 0 $spacing-md;
  border-bottom: 1px solid $color-border;
  background: $color-bg-secondary;
}

.settings-modal__close {
  @include flex-center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: $radius-sm;
  background: transparent;
  color: $color-text-muted;
  cursor: pointer;
  transition: background $transition-fast, color $transition-fast;

  &:hover {
    background: $color-surface-hover;
    color: $color-text-primary;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px $color-accent-subtle;
  }
}

.settings-modal__body {
  flex: 1;
  min-height: 0;
  display: flex;
  width: 100%;
}

.settings-modal__nav {
  flex: 0 0 180px;
  align-self: stretch;
  padding: $spacing-md $spacing-sm;
  background: $color-bg-secondary;
  border-right: 1px solid $color-border;
  overflow-y: auto;
}

.settings-modal__nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px $spacing-md;
  margin-bottom: 4px;
  border: none;
  border-radius: $radius-sm;
  background: transparent;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background $transition-fast, color $transition-fast;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    color: $color-text-primary;
    background: $color-surface-hover;
  }

  &--active {
    color: $color-text-primary;
    font-weight: 600;
    background: $color-surface-hover;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px $color-accent-subtle;
  }
}

.settings-modal__nav-icon {
  @include flex-center;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}

.settings-modal__nav-label {
  line-height: 1.35;
}

.settings-modal__main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: $color-bg-secondary;
}

.settings-modal__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: $spacing-md 24px $spacing-lg;
  scrollbar-gutter: stable;
}

.settings-modal-fade-enter-active,
.settings-modal-fade-leave-active {
  transition: opacity $transition-fast;

  .settings-modal__panel {
    transition: transform $transition-fast, opacity $transition-fast;
  }
}

.settings-modal-fade-enter-from,
.settings-modal-fade-leave-to {
  opacity: 0;

  .settings-modal__panel {
    transform: scale(0.98);
    opacity: 0;
  }
}
</style>

<style lang="scss">
.settings-modal__scroll {
  .profile-settings--embedded,
  .settings-view--dialog {
    .settings-view__section {
      background: $color-bg-elevated;
      border: 1px solid $color-border;
      border-radius: $radius-md;
      box-shadow: none;
      padding: 0;
      overflow: hidden;
    }

    .profile-settings__section {
      background: $color-bg-elevated;
      border: 1px solid $color-border;
      border-radius: $radius-md;
      box-shadow: none;
      padding: $spacing-lg;
      overflow: hidden;
    }

    .settings-view__row {
      padding: 14px $spacing-lg;
      margin: 0;
      border-bottom: 1px solid $color-border;

      &:last-child {
        border-bottom: none;
      }
    }

    .settings-view__vault-crypto-intro,
    .settings-view__shortcut-footer,
    .settings-view__shortcut-note {
      padding-left: $spacing-lg;
      padding-right: $spacing-lg;
    }

    .settings-view__vault-crypto-intro {
      padding-top: $spacing-lg;
      padding-bottom: $spacing-sm;
      margin-bottom: 0;
    }

    .settings-view__row--security {
      border-bottom: none;
      padding-bottom: $spacing-sm;
    }

    .settings-view__security-panel {
      padding: $spacing-md $spacing-lg $spacing-lg;
      margin-bottom: 0;
      border-bottom: 1px solid $color-border;
    }

    .settings-view__shortcut-footer {
      padding-bottom: $spacing-md;
    }

    .mfa-settings {
      padding: $spacing-md $spacing-lg;
      margin-bottom: 0;
      border-bottom: 1px solid $color-border;
    }

    .offline-vault-settings {
      padding: $spacing-md $spacing-lg;
      margin-bottom: 0;
      border-bottom: none;
    }
  }
}
</style>
