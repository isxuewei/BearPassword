<template>
  <div class="settings-view">
    <header class="settings-view__header">
      <h1>{{ t('settings.title') }}</h1>
      <p>{{ t('settings.subtitle') }}</p>
    </header>

    <div class="settings-view__grid">
    <div class="settings-view__section">
      <h3>{{ t('settings.security') }}</h3>

      <div class="settings-view__row settings-view__row--security">
        <div class="settings-view__row-label">
          <span>{{ t('settings.securityKey') }}</span>
          <small>{{ securityKeyHint }}</small>
        </div>
        <span
          class="settings-view__badge"
          :class="{ 'settings-view__badge--active': securityStore.hasSecurityKey }"
        >
          {{ securityStore.hasSecurityKey ? t('settings.securityKeyEnabled') : t('settings.securityKeyDisabled') }}
        </span>
      </div>

      <div class="settings-view__security-panel">
        <el-input
          v-model="securityKeyInput"
          type="password"
          show-password
          :placeholder="t('settings.securityKeyPlaceholder')"
          size="large"
          class="settings-view__security-input"
          :disabled="securityStore.isMigrating"
        />
        <div class="settings-view__security-actions">
          <el-button size="large" :disabled="securityStore.isMigrating" @click="handleGenerateKey">
            {{ t('settings.securityKeyAutoGenerate') }}
          </el-button>
          <el-button
            type="primary"
            size="large"
            :loading="securityStore.isMigrating"
            @click="handleSaveKey"
          >
            {{ t('settings.securityKeySave') }}
          </el-button>
          <el-button
            size="large"
            :disabled="!securityStore.hasSecurityKey || securityStore.isMigrating"
            @click="handleClearKey"
          >
            {{ t('settings.securityKeyClear') }}
          </el-button>
        </div>
        <p class="settings-view__security-note">
          {{ t('settings.securityKeyNote') }}
        </p>
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
    </div>

    <div class="settings-view__section">
      <h3>{{ t('settings.general') }}</h3>

      <div class="settings-view__row settings-view__row--launch">
        <div class="settings-view__row-label">
          <span>{{ t('settings.launchAtLogin') }}</span>
          <small>{{ t('settings.launchAtLoginDesc') }}</small>
        </div>
        <el-switch
          :model-value="launchAtLoginStore.enabled"
          :loading="launchAtLoginStore.loading"
          :disabled="!launchAtLoginStore.available"
          @change="handleLaunchAtLoginChange"
        />
      </div>

      <div class="settings-view__row settings-view__row--launch">
        <div class="settings-view__row-label">
          <span>{{ t('settings.tray') }}</span>
          <small>{{ t('settings.trayDesc') }}</small>
        </div>
        <el-switch
          :model-value="trayStore.enabled"
          :loading="trayStore.loading"
          :disabled="!trayStore.available"
          @change="handleTrayEnabledChange"
        />
      </div>

      <div class="settings-view__row settings-view__row--launch">
        <div class="settings-view__row-label">
          <span>{{ t('settings.trayClickAction') }}</span>
          <small>{{ t('settings.trayClickActionDesc') }}</small>
        </div>
        <el-select
          :model-value="trayStore.clickAction"
          class="settings-view__tray-select"
          size="large"
          :disabled="!trayStore.available || !trayStore.enabled || trayStore.loading"
          @update:model-value="handleTrayClickActionChange"
        >
          <el-option
            v-for="option in TRAY_CLICK_ACTION_OPTIONS"
            :key="option.value"
            :label="t(`tray.action.${option.value}`)"
            :value="option.value"
          />
        </el-select>
      </div>

      <div class="settings-view__row settings-view__row--launch">
        <div class="settings-view__row-label">
          <span>{{ t('settings.dockHidden') }}</span>
          <small>{{ t('settings.dockHiddenDesc') }}</small>
        </div>
        <el-switch
          :model-value="dockStore.hidden"
          :loading="dockStore.loading"
          :disabled="!dockStore.available"
          @change="handleDockHiddenChange"
        />
      </div>
    </div>

    <div class="settings-view__section">
      <h3>{{ t('settings.shortcuts') }}</h3>

      <div
        v-for="item in IN_APP_SHORTCUT_OPTIONS"
        :key="item.accelerator"
        class="settings-view__row settings-view__row--shortcut"
      >
        <div class="settings-view__row-label">
          <span>{{ t(item.labelKey) }}</span>
          <small>{{ t(item.descriptionKey) }}{{ t('settings.shortcuts.inAppSuffix') }}</small>
        </div>
        <span class="settings-view__badge settings-view__badge--shortcut">
          {{ formatInAppShortcut(item.accelerator) }}
        </span>
      </div>

      <p v-if="!isDesktopApp" class="settings-view__shortcut-note settings-view__shortcut-note--warn">
        {{ t('settings.shortcuts.globalOnlyDesktop') }}
      </p>

      <div
        v-for="item in SHORTCUT_ACTION_OPTIONS"
        :key="item.id"
        class="settings-view__row settings-view__row--shortcut"
      >
        <div class="settings-view__row-label">
          <span>{{ t(`shortcut.${item.id}`) }}</span>
          <small>{{ t(`shortcut.${item.id}Desc`) }}</small>
        </div>
        <ShortcutInput
          :model-value="shortcutsStore.settings[item.id]"
          :disabled="shortcutSaving === item.id"
          @recorded="(value) => handleShortcutRecorded(item.id, value)"
        />
      </div>

      <div class="settings-view__shortcut-footer">
        <el-button size="large" :loading="resettingShortcuts" @click="handleResetShortcuts">
          {{ t('settings.shortcuts.reset') }}
        </el-button>
        <p v-if="shortcutRegisterWarning" class="settings-view__shortcut-note settings-view__shortcut-note--warn">
          {{ shortcutRegisterWarning }}
        </p>
      </div>
    </div>

    <div class="settings-view__section">
      <h3>{{ t('settings.appearance') }}</h3>

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

    <div class="settings-view__section">
      <h3>{{ t('settings.service') }}</h3>

      <div class="settings-view__row settings-view__row--server">
        <div class="settings-view__row-label">
          <span>{{ t('settings.server') }}</span>
          <small>{{ t('settings.serverDesc') }}</small>
        </div>
      </div>

      <div class="settings-view__server-panel">
        <el-input
          v-model="serverUrlInput"
          size="large"
          clearable
          :placeholder="serverStore.defaultServerOrigin"
          class="settings-view__server-input"
        />
        <div class="settings-view__server-actions">
          <el-button size="large" @click="handleResetServerUrl">{{ t('settings.serverReset') }}</el-button>
          <el-button type="primary" size="large" :loading="savingServerUrl" @click="handleSaveServerUrl">
            {{ t('settings.serverSave') }}
          </el-button>
        </div>
        <p class="settings-view__server-note">
          {{ t('settings.serverCurrent') }}<code>{{ serverStore.serverOrigin }}</code>
          <span v-if="!serverStore.isCustom">{{ t('settings.serverDefault') }}</span>
          <span v-else>{{ t('settings.serverCustom') }}</span>
          · {{ t('settings.serverApi') }}<code>{{ serverStore.apiBaseUrl }}</code>
        </p>
      </div>

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
    </div>

    <div class="settings-view__section">
      <h3>{{ t('settings.about') }}</h3>

      <div class="settings-view__row">
        <span>{{ t('settings.version') }}</span>
        <span class="settings-view__badge">{{ APP_VERSION }}</span>
      </div>

      <div class="settings-view__row">
        <span>{{ t('settings.systemType') }}</span>
        <span class="settings-view__badge">{{ versionStore.systemType }}</span>
      </div>

      <div v-if="versionStore.hasUpdate" class="settings-view__row settings-view__row--update">
        <span>{{ t('settings.updateAvailable', { version: versionStore.latestVersion }) }}</span>
        <button type="button" class="settings-view__update-btn" @click="versionStore.openDownload">
          {{ t('settings.updateDownload') }}
        </button>
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
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ShortcutInput from '@/components/settings/ShortcutInput.vue'
import { getHealthApi } from '@/api'
import { APP_VERSION, AUTHOR_GITHUB_URL, AUTHOR_NAME } from '@/constants/app'
import { IN_APP_SHORTCUT_OPTIONS } from '@/constants/shortcuts'
import { useAppStore } from '@/stores/app'
import { useAutoLockStore } from '@/stores/autoLock'
import { useDockStore } from '@/stores/dock'
import { useLaunchAtLoginStore } from '@/stores/launchAtLogin'
import { useTrayStore } from '@/stores/tray'
import { useSecurityStore } from '@/stores/security'
import { useServerStore } from '@/stores/server'
import { useVersionStore } from '@/stores/version'
import { useShortcutsStore } from '@/stores/shortcuts'
import { probeServerOrigin } from '@/utils/serverUrl'
import { formatAccelerator } from '@/utils/shortcut'
import { AUTO_LOCK_OPTIONS, type AutoLockMinutes } from '@/types'
import {
  SHORTCUT_ACTION_OPTIONS,
  type ShortcutActionId
} from '@/types/shortcut'
import { useI18n } from '@/composables/useI18n'
import {
  getAutoLockLabelKey,
  getFontDescKey,
  getThemeDescKey,
  getThemeLabelKey
} from '@/locales'
import { LOCALE_PREFERENCE_OPTIONS } from '@/utils/localePreference'
import { FONT_OPTIONS } from '@/utils/font'
import { THEME_OPTIONS } from '@/utils/theme'
import {
  TRAY_CLICK_ACTION_OPTIONS,
  type TrayClickAction
} from '@/types/tray'
import {
  migrateAllPasswordContents,
  SecurityKeyMigrationError
} from '@/utils/securityKeyMigration'

const HEALTH_CHECK_INTERVAL = 15000

const { t } = useI18n()
const appStore = useAppStore()
const securityStore = useSecurityStore()
const autoLockStore = useAutoLockStore()
const serverStore = useServerStore()
const versionStore = useVersionStore()
const shortcutsStore = useShortcutsStore()
const launchAtLoginStore = useLaunchAtLoginStore()
const trayStore = useTrayStore()
const dockStore = useDockStore()
const healthReady = ref(false)
const securityKeyInput = ref(securityStore.securityKey ?? '')
const serverUrlInput = ref(serverStore.serverOrigin)
const savingServerUrl = ref(false)
const shortcutSaving = ref<ShortcutActionId | null>(null)
const resettingShortcuts = ref(false)
const appPlatform = ref<NodeJS.Platform>('darwin')
const isDesktopApp = computed(() => !!window.shortcutApi)

const shortcutRegisterWarning = computed(() => {
  if (!isDesktopApp.value) return ''
  const status = shortcutsStore.registrationStatus
  const failed = shortcutsStore.lastSyncError
  if (failed.open) return `${t('shortcut.open')}: ${failed.open}`
  if (failed.lock) return `${t('shortcut.lock')}: ${failed.lock}`
  if (!status) return ''
  if (status.open.enabled && !status.open.registered) {
    return t('settings.shortcuts.openFailed')
  }
  if (status.lock.enabled && !status.lock.registered) {
    return t('settings.shortcuts.lockFailed')
  }
  return ''
})

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

async function checkHealth(): Promise<void> {
  try {
    const data = await getHealthApi()
    healthReady.value = data.status === 'UP'
  } catch {
    healthReady.value = false
  }
}

async function handleSaveServerUrl(): Promise<void> {
  const input = serverUrlInput.value.trim()
  if (!input) {
    ElMessage.warning(t('msg.serverUrlRequired'))
    return
  }

  savingServerUrl.value = true
  try {
    const origin = await probeServerOrigin(input)
    serverStore.setServerOrigin(origin)
    ElMessage.success(t('msg.serverUrlSaved'))
    await checkHealth()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : t('msg.serverConnectFailed'))
  } finally {
    savingServerUrl.value = false
  }
}

async function handleResetServerUrl(): Promise<void> {
  serverStore.restoreDefault()
  serverUrlInput.value = serverStore.serverOrigin
  try {
    await checkHealth()
    ElMessage.success(t('msg.serverUrlReset'))
  } catch {
    ElMessage.warning(t('msg.serverUrlResetWarn'))
  }
}

onMounted(() => {
  void window.windowApi?.getPlatform().then((platform) => {
    appPlatform.value = platform
  })
  void versionStore.refreshSystemType()
  void versionStore.checkForUpdate()
  void checkHealth()
  void shortcutsStore.syncToMain()
  void launchAtLoginStore.refresh()
  void trayStore.refresh()
  void dockStore.refresh()
  healthTimer = setInterval(() => {
    void checkHealth()
  }, HEALTH_CHECK_INTERVAL)
})

onUnmounted(() => {
  if (healthTimer) clearInterval(healthTimer)
})

function formatInAppShortcut(accelerator: string): string {
  return formatAccelerator(accelerator, appPlatform.value)
}

const securityKeyHint = computed(() =>
  securityStore.hasSecurityKey
    ? t('settings.securityKeyEnabledHint')
    : t('settings.securityKeyDisabledHint')
)

const autoLockMinutes = computed({
  get: () => autoLockStore.lockMinutes,
  set: (value: AutoLockMinutes) => autoLockStore.setLockMinutes(value)
})

async function handleLaunchAtLoginChange(value: string | number | boolean): Promise<void> {
  const enabled = value === true
  const result = await launchAtLoginStore.setEnabled(enabled)
  if (!result.ok) {
    ElMessage.error(result.error ?? t('common.settingsFailed'))
    await launchAtLoginStore.refresh()
    return
  }
  ElMessage.success(enabled ? t('msg.launchAtLoginOn') : t('msg.launchAtLoginOff'))
}

async function handleTrayEnabledChange(value: string | number | boolean): Promise<void> {
  const enabled = value === true
  const result = await trayStore.updateSettings({ enabled })
  if (!result.ok) {
    ElMessage.error(result.error ?? t('common.settingsFailed'))
    await trayStore.refresh()
    return
  }
  ElMessage.success(enabled ? t('msg.trayOn') : t('msg.trayOff'))
}

async function handleTrayClickActionChange(value: TrayClickAction): Promise<void> {
  const result = await trayStore.updateSettings({ clickAction: value })
  if (!result.ok) {
    ElMessage.error(result.error ?? t('common.settingsFailed'))
    await trayStore.refresh()
    return
  }
  ElMessage.success(t('msg.trayActionUpdated'))
}

async function handleDockHiddenChange(value: string | number | boolean): Promise<void> {
  const hidden = value === true
  const result = await dockStore.setHidden(hidden)
  if (!result.ok) {
    ElMessage.error(result.error ?? t('common.settingsFailed'))
    await dockStore.refresh()
    return
  }
  ElMessage.success(hidden ? t('msg.dockHidden') : t('msg.dockShown'))
}

async function handleShortcutRecorded(action: ShortcutActionId, value: string): Promise<void> {
  shortcutSaving.value = action
  try {
    const result = await shortcutsStore.setAccelerator(action, value || null)
    if (!result.ok) {
      ElMessage.error(result.failed?.[action] ?? t('msg.shortcutSetFailed'))
      return
    }
    const warning = result.failed?.[action]
    if (warning) {
      ElMessage.warning(t('msg.shortcutUpdatedPartial', { detail: warning }))
      return
    }
    ElMessage.success(t('msg.shortcutUpdated'))
  } finally {
    shortcutSaving.value = null
  }
}

async function handleResetShortcuts(): Promise<void> {
  resettingShortcuts.value = true
  try {
    const result = await shortcutsStore.resetDefaults()
    if (result.ok) {
      ElMessage.success(t('msg.shortcutReset'))
      return
    }
    ElMessage.error(t('msg.shortcutResetPartial'))
  } finally {
    resettingShortcuts.value = false
  }
}

function handleGenerateKey(): void {
  if (securityStore.isMigrating) return
  securityKeyInput.value = securityStore.createRandomSecurityKey()
}

async function runSecurityKeyMigration(
  oldKey: string | null,
  newKey: string | null
): Promise<number> {
  securityStore.beginMigration('正在准备迁移…')
  try {
    return await migrateAllPasswordContents(oldKey, newKey, (progress) => {
      securityStore.updateMigrationProgress(progress)
    })
  } finally {
    securityStore.endMigration()
  }
}

async function handleSaveKey(): Promise<void> {
  if (securityStore.isMigrating) return

  const newKey = securityKeyInput.value.trim()
  if (!newKey) {
    ElMessage.warning(t('msg.securityKeyRequired'))
    return
  }

  const oldKey = securityStore.securityKey?.trim() || null
  if (oldKey === newKey) {
    ElMessage.info(t('msg.securityKeyUnchanged'))
    return
  }

  const isKeyChange = !!oldKey
  if (isKeyChange) {
    try {
      await ElMessageBox.confirm(
        t('msg.securityKeyChangeBody'),
        t('msg.securityKeyChangeTitle'),
        { type: 'warning', confirmButtonText: t('msg.confirm'), cancelButtonText: t('msg.cancel') }
      )
    } catch {
      return
    }
  }

  try {
    const migrated = await runSecurityKeyMigration(oldKey, newKey)
    securityStore.setSecurityKey(newKey)
    ElMessage.success(
      migrated > 0 ? t('msg.securityKeySavedMigrated', { count: migrated }) : t('msg.securityKeySaved')
    )
  } catch (err) {
    const message = err instanceof SecurityKeyMigrationError
      ? err.message
      : err instanceof Error
        ? err.message
        : t('msg.securityKeyMigrateFailed')
    ElMessage.error(message)
  }
}

async function handleClearKey(): Promise<void> {
  if (securityStore.isMigrating) return

  const oldKey = securityStore.securityKey?.trim() || null
  if (!oldKey) return

  try {
    await ElMessageBox.confirm(
      t('msg.securityKeyClearBody'),
      t('msg.securityKeyClearTitle'),
      { type: 'warning', confirmButtonText: t('msg.confirm'), cancelButtonText: t('msg.cancel') }
    )
  } catch {
    return
  }

  try {
    const migrated = await runSecurityKeyMigration(oldKey, null)
    securityStore.setSecurityKey(null)
    securityKeyInput.value = ''
    ElMessage.success(
      migrated > 0 ? t('msg.securityKeyClearedMigrated', { count: migrated }) : t('msg.securityKeyCleared')
    )
  } catch (err) {
    const message = err instanceof SecurityKeyMigrationError
      ? err.message
      : err instanceof Error
        ? err.message
        : t('msg.securityKeyClearFailed')
    ElMessage.error(message)
  }
}
</script>

<style scoped lang="scss">
.settings-view {
  width: 100%;
  box-sizing: border-box;

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
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
    gap: $spacing-lg;
    align-items: stretch;
  }

  &__section {
    @include card;
    padding: $spacing-lg;
    min-width: 0;
    height: 100%;
    box-sizing: border-box;

    h3 {
      font-size: $font-size-sm;
      font-weight: 600;
      color: $color-text-muted;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: $spacing-md;
    }
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

    &--theme {
      align-items: center;
    }

    &--health {
      align-items: center;
    }

    > span:first-child {
      color: $color-text-primary;
      font-size: $font-size-md;
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

  &__row--shortcut {
    align-items: center;
  }

  &__shortcut-footer {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding-top: $spacing-md;
  }

  &__shortcut-note {
    margin: 0;
    font-size: $font-size-sm;
    color: $color-text-muted;
    line-height: 1.6;

    &--warn {
      color: $color-warning;
      margin-bottom: $spacing-sm;
    }
  }

  &__theme-select {
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

    &--shortcut {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      letter-spacing: 0.02em;
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

  &__row--update {
    color: $color-accent;
  }

  &__update-btn {
    padding: $spacing-xs $spacing-md;
    border-radius: $radius-md;
    border: 1px solid rgba(108, 92, 231, 0.25);
    background: rgba(108, 92, 231, 0.08);
    color: $color-accent;
    font-size: $font-size-sm;
    font-weight: 500;
    cursor: pointer;
    transition: background $transition-fast, border-color $transition-fast;

    &:hover {
      background: rgba(108, 92, 231, 0.14);
      border-color: rgba(108, 92, 231, 0.35);
    }
  }

  &__row--security {
    border-bottom: none;
    padding-bottom: $spacing-sm;
  }

  &__row--server {
    border-bottom: none;
    padding-bottom: $spacing-sm;
  }

  &__server-panel {
    padding: 0 0 $spacing-md;
    margin-bottom: $spacing-sm;
    border-bottom: 1px solid $color-border;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__server-input {
    width: 100%;
  }

  &__server-actions {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }

  &__server-note {
    margin: 0;
    font-size: $font-size-sm;
    color: $color-text-muted;
    line-height: 1.6;
    word-break: break-all;

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: $font-size-xs;
      color: $color-text-secondary;
      background: $color-badge-bg;
      padding: 1px 6px;
      border-radius: 4px;
    }
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

  &__security-note {
    margin: 0;
    font-size: $font-size-sm;
    color: $color-text-muted;
    line-height: 1.6;
  }

  &__row--auto-lock {
    align-items: center;
  }

  &__row--launch {
    align-items: center;
  }

  &__auto-lock-select {
    width: min(140px, 100%);
    flex-shrink: 1;
  }

  &__tray-select {
    width: min(220px, 100%);
    flex-shrink: 1;
  }

  &__health-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    transition: background $transition-fast, box-shadow $transition-fast;

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
</style>
