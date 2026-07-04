<template>
  <div
    class="settings-view"
    :class="{
      'settings-view--embedded': embedded,
      'settings-view--dialog': dialog
    }"
  >
    <header v-if="!embedded" class="settings-view__header">
      <h1>{{ t('settings.title') }}</h1>
      <p>{{ t('settings.subtitle') }}</p>
    </header>

    <div class="settings-view__grid">
      <div v-if="showSection('security')" class="settings-view__section">
        <h3 v-if="!section">{{ t('settings.security') }}</h3>
        <p class="settings-view__vault-crypto-intro">
          {{ t('settings.vaultCryptoIntro') }}
        </p>

        <div class="settings-view__row settings-view__row--security">
          <div class="settings-view__row-label">
            <span>{{ t('settings.masterPassword') }}</span>
            <small>{{ masterPasswordHint }}</small>
          </div>
          <span
            class="settings-view__badge"
            :class="{ 'settings-view__badge--active': masterPasswordConfigured }"
          >
            {{ masterPasswordConfigured ? t('settings.masterPasswordConfigured') : t('settings.masterPasswordNotConfigured') }}
          </span>
        </div>

        <div class="settings-view__security-panel settings-view__security-panel--master-password">
          <el-input
            v-model="masterPasswordOld"
            type="password"
            show-password
            :placeholder="t('settings.masterPasswordOldPlaceholder')"
            size="large"
            class="settings-view__security-input"
            :disabled="securityStore.isMigrating"
          />
          <el-input
            v-model="masterPasswordNew"
            type="password"
            show-password
            :placeholder="t('settings.masterPasswordNewPlaceholder')"
            size="large"
            class="settings-view__security-input"
            :disabled="securityStore.isMigrating"
          />
          <el-input
            v-model="masterPasswordConfirm"
            type="password"
            show-password
            :placeholder="t('settings.masterPasswordConfirmPlaceholder')"
            size="large"
            class="settings-view__security-input"
            :disabled="securityStore.isMigrating"
            @keyup.enter="handleChangeMasterPassword"
          />
          <div class="settings-view__security-actions">
            <el-button
              type="primary"
              size="large"
              :loading="securityStore.isMigrating"
              :disabled="!masterPasswordConfigured || !securityStore.hasSecurityKey || securityStore.isMigrating"
              @click="handleChangeMasterPassword"
            >
              {{ t('settings.masterPasswordChange') }}
            </el-button>
          </div>
          <p class="settings-view__security-note">
            {{ t('settings.masterPasswordNote') }}
          </p>
        </div>

        <MfaSettingsPanel />

        <div class="settings-view__row settings-view__row--auto-lock">
          <div class="settings-view__row-label">
            <span>{{ t('settings.rememberMasterPassword') }}</span>
            <small>{{ t('settings.rememberMasterPasswordDesc') }}</small>
          </div>
          <el-switch
            :model-value="rememberMasterPassword"
            :disabled="securityStore.isMigrating"
            @change="handleRememberMasterPasswordChange"
          />
        </div>

        <div class="settings-view__row settings-view__row--auto-lock">
          <div class="settings-view__row-label">
            <span>{{ t('settings.autoLock') }}</span>
            <small>{{ t('settings.autoLockDesc') }}</small>
          </div>
          <el-select
            v-model="autoLockMinutes"
            size="large"
            class="settings-view__auto-lock-select"
            :disabled="securityStore.isMigrating"
          >
            <el-option
              v-for="item in autoLockOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <div class="settings-view__row settings-view__row--auto-lock">
          <div class="settings-view__row-label">
            <span>{{ t('settings.clipboardClear') }}</span>
            <small>{{ t('settings.clipboardClearDesc') }}</small>
          </div>
          <el-select
            v-model="clipboardClearSeconds"
            size="large"
            class="settings-view__auto-lock-select"
            :disabled="securityStore.isMigrating"
          >
            <el-option
              v-for="item in clipboardClearOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </div>

      <div v-if="showSection('appearance')" class="settings-view__section">
        <h3 v-if="!section">{{ t('settings.appearance') }}</h3>

        <div class="settings-view__row settings-view__row--theme">
          <div class="settings-view__row-label">
            <span>{{ t('settings.theme') }}</span>
            <small>{{ themeDescription }}</small>
          </div>
          <el-select
            :model-value="appStore.themePreference"
            class="settings-view__theme-select"
            size="large"
            :placeholder="t('settings.selectTheme')"
            @update:model-value="appStore.setThemePreference"
          >
            <el-option
              v-for="option in THEME_OPTIONS"
              :key="option.value"
              :label="t(getThemeLabelKey(option.value))"
              :value="option.value"
            />
          </el-select>
        </div>

        <div class="settings-view__row settings-view__row--theme">
          <div class="settings-view__row-label">
            <span>{{ t('settings.font') }}</span>
            <small>{{ fontDescription }}</small>
          </div>
          <el-select
            :model-value="appStore.fontPreference"
            class="settings-view__theme-select"
            size="large"
            :placeholder="t('settings.selectFont')"
            @update:model-value="appStore.setFontPreference"
          >
            <el-option
              v-for="option in FONT_OPTIONS"
              :key="option.value"
              :label="t(`font.${option.value}`)"
              :value="option.value"
            />
          </el-select>
        </div>

        <div class="settings-view__row settings-view__row--theme">
          <div class="settings-view__row-label">
            <span>{{ t('settings.language') }}</span>
            <small>{{ localeDescription }}</small>
          </div>
          <el-select
            :model-value="appStore.localePreference"
            class="settings-view__theme-select"
            size="large"
            :placeholder="t('settings.selectLanguage')"
            @update:model-value="appStore.setLocalePreference"
          >
            <el-option
              v-for="option in LOCALE_PREFERENCE_OPTIONS"
              :key="option.value"
              :label="t(option.labelKey)"
              :value="option.value"
            />
          </el-select>
        </div>
      </div>

      <div v-if="showSection('about')" class="settings-view__section">
        <h3 v-if="!section">{{ t('settings.about') }}</h3>

        <div class="settings-view__row settings-view__row--health">
          <div class="settings-view__row-label">
            <span>{{ t('settings.backend') }}</span>
            <small>{{ healthStatusText }}</small>
          </div>
          <span
            class="settings-view__health-dot"
            :class="healthReady ? 'is-ready' : 'is-down'"
            :title="healthStatusText"
            aria-hidden="true"
          />
        </div>

        <div class="settings-view__row">
          <span>{{ t('settings.version') }}</span>
          <span class="settings-view__badge">{{ APP_VERSION }}</span>
        </div>

        <div class="settings-view__row">
          <span>{{ t('settings.systemType') }}</span>
          <span class="settings-view__badge">{{ versionStore.systemType }}</span>
        </div>

        <div class="settings-view__row">
          <span>{{ t('settings.downloadDesktop') }}</span>
          <a
            :href="OFFICIAL_WEBSITE_URL"
            class="settings-view__about-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t('settings.downloadDesktopLink') }}
          </a>
        </div>

        <div class="settings-view__row">
          <span>{{ t('settings.author') }}</span>
          <a
            :href="AUTHOR_GITHUB_URL"
            class="settings-view__about-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ AUTHOR_NAME }}
          </a>
        </div>

        <div class="settings-view__row">
          <span>{{ t('settings.officialWebsite') }}</span>
          <a
            :href="OFFICIAL_WEBSITE_URL"
            class="settings-view__about-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t('settings.officialWebsiteLink') }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import MfaSettingsPanel from '@/components/settings/MfaSettingsPanel.vue'
import { getHealthApi } from '@/api'
import { APP_VERSION, AUTHOR_GITHUB_URL, AUTHOR_NAME, OFFICIAL_WEBSITE_URL } from '@/constants/app'
import { useAppStore } from '@/stores/app'
import { useAutoLockStore } from '@/stores/autoLock'
import { useClipboardClearStore } from '@/stores/clipboardClear'
import { useSecurityStore } from '@/stores/security'
import { useVersionStore } from '@/stores/version'
import { AUTO_LOCK_OPTIONS, type AutoLockMinutes } from '@/types'
import { CLIPBOARD_CLEAR_OPTIONS, type ClipboardClearSeconds } from '@/types/clipboardClear'
import { useI18n } from '@/composables/useI18n'
import {
  getAutoLockLabelKey,
  getClipboardClearLabelKey,
  getFontDescKey,
  getThemeDescKey,
  getThemeLabelKey
} from '@/locales'
import { LOCALE_PREFERENCE_OPTIONS } from '@/utils/localePreference'
import { FONT_OPTIONS } from '@/utils/font'
import { THEME_OPTIONS } from '@/utils/theme'
import { changeMasterPassword, MasterPasswordChangeError } from '@/utils/masterPasswordChange'
import {
  clearPersistedVaultPassword,
  isRememberMasterPasswordEnabled,
  setRememberMasterPasswordEnabled
} from '@/utils/vaultPasswordStorage'
import { settingsMessageBoxConfirm } from '@/utils/settingsMessageBox'
import type { SettingsContentSection } from '@/types/settingsDialog'

const props = withDefaults(
  defineProps<{
    embedded?: boolean
    dialog?: boolean
    section?: SettingsContentSection
  }>(),
  {
    embedded: false,
    dialog: false
  }
)

function showSection(id: SettingsContentSection): boolean {
  return !props.section || props.section === id
}

const HEALTH_CHECK_INTERVAL = 15000

const { t } = useI18n()
const appStore = useAppStore()
const securityStore = useSecurityStore()
const autoLockStore = useAutoLockStore()
const clipboardClearStore = useClipboardClearStore()
const versionStore = useVersionStore()
const healthReady = ref(false)
const masterPasswordOld = ref('')
const masterPasswordNew = ref('')
const masterPasswordConfirm = ref('')
const rememberMasterPassword = ref(isRememberMasterPasswordEnabled())

let healthTimer: ReturnType<typeof setInterval> | null = null

const healthStatusText = computed(() =>
  healthReady.value ? t('settings.backendOk') : t('settings.backendDown')
)

const themeDescription = computed(() => t(getThemeDescKey(appStore.themePreference)))
const fontDescription = computed(() => t(getFontDescKey(appStore.fontPreference)))
const localeDescription = computed(() =>
  appStore.localePreference === 'system' ? t('locale.systemDesc') : ''
)

const autoLockOptions = computed(() =>
  AUTO_LOCK_OPTIONS.map((item) => ({
    value: item.value,
    label: t(getAutoLockLabelKey(item.value))
  }))
)

const clipboardClearOptions = computed(() =>
  CLIPBOARD_CLEAR_OPTIONS.map((value) => ({
    value,
    label: t(getClipboardClearLabelKey(value))
  }))
)

async function checkHealth(): Promise<void> {
  try {
    const data = await getHealthApi()
    healthReady.value = data.status === 'UP'
  } catch {
    healthReady.value = false
  }
}

onMounted(() => {
  void versionStore.refreshSystemType()
  void checkHealth()
  healthTimer = setInterval(() => {
    void checkHealth()
  }, HEALTH_CHECK_INTERVAL)
})

onUnmounted(() => {
  if (healthTimer) clearInterval(healthTimer)
})

const masterPasswordConfigured = computed(() => !!securityStore.vaultSalt)

const masterPasswordHint = computed(() =>
  masterPasswordConfigured.value
    ? t('settings.masterPasswordConfiguredHint')
    : t('settings.masterPasswordNotConfiguredHint')
)

const autoLockMinutes = computed({
  get: () => autoLockStore.lockMinutes,
  set: (value: AutoLockMinutes) => autoLockStore.setLockMinutes(value)
})

const clipboardClearSeconds = computed({
  get: () => clipboardClearStore.clearSeconds,
  set: (value: ClipboardClearSeconds) => clipboardClearStore.setClearSeconds(value)
})

async function handleRememberMasterPasswordChange(value: string | number | boolean): Promise<void> {
  const enabled = value === true
  setRememberMasterPasswordEnabled(enabled)
  rememberMasterPassword.value = enabled
  if (!enabled) {
    await clearPersistedVaultPassword()
  }
  ElMessage.success(enabled ? t('settings.rememberMasterPasswordOn') : t('settings.rememberMasterPasswordOff'))
}

async function handleChangeMasterPassword(): Promise<void> {
  if (securityStore.isMigrating) return

  if (!masterPasswordConfigured.value) {
    ElMessage.warning(t('settings.masterPasswordNotConfiguredHint'))
    return
  }

  if (!securityStore.hasSecurityKey) {
    ElMessage.warning(t('settings.masterPasswordNeedSecurityKey'))
    return
  }

  const oldPassword = masterPasswordOld.value
  const newPassword = masterPasswordNew.value.trim()
  const confirmPassword = masterPasswordConfirm.value.trim()

  if (!oldPassword) {
    ElMessage.warning(t('settings.masterPasswordOldRequired'))
    return
  }
  if (!newPassword) {
    ElMessage.warning(t('settings.masterPasswordNewRequired'))
    return
  }
  if (newPassword.length < 6 || newPassword.length > 64) {
    ElMessage.warning(t('register.passwordLength'))
    return
  }
  if (newPassword !== confirmPassword) {
    ElMessage.warning(t('settings.masterPasswordMismatch'))
    return
  }
  if (newPassword === oldPassword) {
    ElMessage.info(t('settings.masterPasswordUnchanged'))
    return
  }

  try {
    await settingsMessageBoxConfirm(
      t('settings.masterPasswordChangeBody'),
      t('settings.masterPasswordChangeTitle'),
      { type: 'warning', confirmButtonText: t('msg.confirm'), cancelButtonText: t('msg.cancel') }
    )
  } catch {
    return
  }

  try {
    const count = await changeMasterPassword(oldPassword, newPassword, (progress) => {
      securityStore.updateMigrationProgress(progress)
    })
    masterPasswordOld.value = ''
    masterPasswordNew.value = ''
    masterPasswordConfirm.value = ''
    ElMessage.success(
      count > 0
        ? t('settings.masterPasswordChangedWithCount', { count })
        : t('settings.masterPasswordChanged')
    )
  } catch (err) {
    const message =
      err instanceof MasterPasswordChangeError
        ? err.message
        : err instanceof Error
          ? err.message
          : t('settings.masterPasswordChangeFailed')
    ElMessage.error(message)
  }
}
</script>

<style scoped lang="scss">
.settings-view {
  width: 100%;
  max-width: 720px;
  box-sizing: border-box;

  &--embedded {
    max-width: none;
  }

  &--dialog {
    .settings-view__grid {
      gap: $spacing-md;
    }

    .settings-view__section {
      border-radius: $radius-md;
      box-shadow: none;
      padding: 0;
      overflow: hidden;
    }
  }

  &__header {
    margin-bottom: $spacing-xl;

    h1 {
      font-size: $font-size-2xl;
      font-weight: 700;
      color: $color-text-primary;
      margin-bottom: $spacing-xs;
    }

    p {
      color: $color-text-secondary;
    }
  }

  &__grid {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }

  &__section {
    width: 100%;
    background: $color-bg-elevated;
    border: 1px solid $color-border;
    border-radius: $radius-lg;
    box-shadow: $shadow-sm;
    padding: $spacing-lg;
    min-width: 0;
    box-sizing: border-box;
  }

  &__section h3 {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: $spacing-md;
  }

  &__row {
    @include flex-between;
    align-items: flex-start;
    gap: $spacing-lg;
    padding: $spacing-md 0;
    border-bottom: 1px solid $color-border;

    &:last-child {
      border-bottom: none;
    }

    &--theme,
    &--health,
    &--auto-lock {
      align-items: center;
    }
  }

  &__row-label {
    display: flex;
    flex-direction: column;
    gap: 4px;

    span {
      color: $color-text-primary;
      font-size: $font-size-md;
    }

    small {
      color: $color-text-muted;
      font-size: $font-size-sm;
    }
  }

  &__theme-select,
  &__auto-lock-select {
    width: min(220px, 100%);
    flex-shrink: 1;
  }

  &__badge {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    background: $color-badge-bg;
    padding: 4px 12px;
    border-radius: $radius-sm;

    &--active {
      color: $color-success;
      background: rgba(82, 196, 26, 0.12);
    }
  }

  &__about-link {
    font-size: $font-size-sm;
    color: var(--el-color-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__vault-crypto-intro {
    margin: 0 0 $spacing-md;
    font-size: $font-size-sm;
    color: $color-text-muted;
    line-height: 1.5;
  }

  &__security-panel {
    padding: 0 0 $spacing-md;
    margin-bottom: $spacing-sm;
    border-bottom: 1px solid $color-border;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__security-input {
    width: 100%;
  }

  &__security-actions {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }

  @media (max-width: 767px) {
    &__security-actions {
      flex-direction: column;
      align-items: stretch;

      :deep(.el-button) {
        width: 100%;
        margin: 0;
      }
    }
  }

  &__security-note {
    margin: 0;
    font-size: $font-size-sm;
    color: $color-text-muted;
    line-height: 1.6;
  }

  &__health-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;

    &.is-ready {
      background: $color-success;
      box-shadow: 0 0 0 3px rgba(82, 196, 26, 0.18);
    }

    &.is-down {
      background: $color-danger;
      box-shadow: 0 0 0 3px rgba(255, 77, 79, 0.18);
    }
  }
}

@media (max-width: 767px) {
  .settings-view__row {
    flex-direction: column;
    align-items: stretch;
  }

  .settings-view__theme-select,
  .settings-view__auto-lock-select {
    width: 100%;
  }
}
</style>
