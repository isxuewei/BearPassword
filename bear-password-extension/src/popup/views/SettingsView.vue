<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from '@/popup/composables/useI18n'
import { getHealthApi } from '@/shared/api/health'
import { getDefaultServerOrigin } from '@/shared/utils/serverUrl'
import { getThemeDescKey, getThemeLabelKey } from '@/locales'
import { LOCALE_PREFERENCE_OPTIONS } from '@/shared/locale/localePreference'
import { useLocaleStore } from '@/popup/stores/locale'
import { usePopupStore } from '@/popup/stores/popup'
import { useSessionStore, useVaultStore } from '@/popup/stores/session'
import { useThemeStore } from '@/popup/stores/theme'
import { APP_VERSION, AUTHOR_GITHUB_URL, AUTHOR_NAME } from '@/shared/constants/app'
import { THEME_OPTIONS } from '@/shared/theme/theme'
import type { LocalePreference } from '@/locales/types'
import type { ThemePreference } from '@/shared/theme/theme'

const { t } = useI18n()
const serverPlaceholder = computed(() => getDefaultServerOrigin())
const popupStore = usePopupStore()
const sessionStore = useSessionStore()
const vaultStore = useVaultStore()
const themeStore = useThemeStore()
const localeStore = useLocaleStore()
const serverInput = ref('')
const securityKeyInput = ref('')
const showSecurityKey = ref(false)
const healthReady = ref(false)
let healthTimer: ReturnType<typeof setInterval> | null = null

const themeDescription = computed(() => t(getThemeDescKey(themeStore.preference)))

const localeDescription = computed(() =>
  localeStore.preference === 'system' ? t('locale.systemDesc') : ''
)

const healthStatusText = computed(() =>
  healthReady.value ? t('settings.backendOk') : t('settings.backendDown')
)

const securityKeyHint = computed(() =>
  sessionStore.hasSecurityKey
    ? t('settings.securityKeyConfigured')
    : t('settings.securityKeyMissing')
)

function syncSecurityKeyFromSession(): void {
  securityKeyInput.value = sessionStore.securityKey
  showSecurityKey.value = false
}

async function checkHealth(): Promise<void> {
  const origin = sessionStore.serverOrigin
  if (!origin) {
    healthReady.value = false
    return
  }
  try {
    const data = await getHealthApi(origin)
    healthReady.value = data.status === 'UP'
  } catch {
    healthReady.value = false
  }
}

function clearHealthTimer(): void {
  if (healthTimer) {
    clearInterval(healthTimer)
    healthTimer = null
  }
}

onMounted(async () => {
  sessionStore.clearFeedback()
  await sessionStore.refreshSession()
  serverInput.value = sessionStore.serverOrigin
  syncSecurityKeyFromSession()
  void checkHealth()
  healthTimer = setInterval(() => {
    void checkHealth()
  }, 15000)
})

onUnmounted(() => {
  clearHealthTimer()
})

async function handleBack(): Promise<void> {
  popupStore.openVault()
  if (sessionStore.isLoggedIn) {
    await vaultStore.refresh()
  }
}

async function handleSaveServer(): Promise<void> {
  await sessionStore.updateServer(serverInput.value)
  await checkHealth()
}

async function handleApplyKey(): Promise<void> {
  if (!securityKeyInput.value.trim()) {
    sessionStore.error = t('settings.securityKeyRequired')
    return
  }
  try {
    await sessionStore.applySecurityKey(securityKeyInput.value)
    syncSecurityKeyFromSession()
  } catch {
    // error 已在 store 中设置
  }
}

async function handleClearKey(): Promise<void> {
  await sessionStore.clearSecurityKey()
  securityKeyInput.value = ''
  showSecurityKey.value = false
}

function toggleSecurityKeyVisibility(): void {
  showSecurityKey.value = !showSecurityKey.value
}

async function handleThemeChange(event: Event): Promise<void> {
  const value = (event.target as HTMLSelectElement).value as ThemePreference
  await themeStore.updatePreference(value)
}

async function handleLocaleChange(event: Event): Promise<void> {
  const value = (event.target as HTMLSelectElement).value as LocalePreference
  await localeStore.updatePreference(value)
}

</script>

<template>
  <div class="settings-view">
    <header class="top-bar">
      <button class="back-btn" type="button" :title="t('common.back')" @click="handleBack">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
      </button>
      <h1 class="title">{{ t('settings.title') }}</h1>
    </header>

    <div class="content">
      <section v-if="sessionStore.isLoggedIn" class="section bear-card">
        <h3 class="section-title">{{ t('settings.security') }}</h3>

        <div class="setting-row">
          <div class="setting-row-label">
            <span>{{ t('settings.securityKey') }}</span>
            <small>{{ securityKeyHint }}</small>
          </div>
          <span
            class="status-badge"
            :class="sessionStore.hasSecurityKey ? 'status-badge--on' : 'status-badge--off'"
          >
            {{ sessionStore.hasSecurityKey ? t('settings.securityKeyEnabled') : t('settings.securityKeyDisabled') }}
          </span>
        </div>

        <div class="setting-panel">
          <div class="security-input-wrap">
            <input
              v-model="securityKeyInput"
              class="bear-input security-input"
              :type="showSecurityKey ? 'text' : 'password'"
              :placeholder="t('settings.securityKeyPlaceholder')"
              autocomplete="off"
            />
            <button
              class="security-input-toggle"
              type="button"
              :title="showSecurityKey ? t('settings.securityKeyHide') : t('settings.securityKeyShow')"
              :disabled="!securityKeyInput"
              @click="toggleSecurityKeyVisibility"
            >
              <svg
                v-if="showSecurityKey"
                class="security-input-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.036 12.322a1 1 0 0 1 0-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
              <svg
                v-else
                class="security-input-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            </button>
          </div>
          <div class="btn-row">
            <button
              class="bear-btn bear-btn-primary"
              type="button"
              :disabled="sessionStore.loading"
              @click="handleApplyKey"
            >
              {{ sessionStore.loading ? t('settings.securityKeySaving') : t('settings.securityKeySave') }}
            </button>
            <button
              class="bear-btn bear-btn-ghost"
              type="button"
              :disabled="sessionStore.loading || !sessionStore.hasSecurityKey"
              @click="handleClearKey"
            >
              {{ t('settings.securityKeyClear') }}
            </button>
          </div>
          <p class="setting-note">{{ t('settings.securityKeyNote') }}</p>
        </div>
      </section>

      <section v-else class="section bear-card">
        <h3 class="section-title">{{ t('settings.security') }}</h3>
        <p class="setting-note">{{ t('settings.securityLoginFirst') }}</p>
      </section>

      <section class="section bear-card">
        <h3 class="section-title">{{ t('settings.appearance') }}</h3>
        <div class="setting-row setting-row--stack">
          <div class="setting-row-label">
            <span>{{ t('settings.theme') }}</span>
            <small>{{ themeDescription }}</small>
          </div>
          <select
            class="bear-input setting-select"
            :value="themeStore.preference"
            @change="handleThemeChange"
          >
            <option v-for="option in THEME_OPTIONS" :key="option.value" :value="option.value">
              {{ t(getThemeLabelKey(option.value)) }}
            </option>
          </select>
        </div>
        <div class="setting-row setting-row--stack">
          <div class="setting-row-label">
            <span>{{ t('settings.language') }}</span>
            <small>{{ localeDescription }}</small>
          </div>
          <select
            class="bear-input setting-select"
            :value="localeStore.preference"
            @change="handleLocaleChange"
          >
            <option
              v-for="option in LOCALE_PREFERENCE_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ t(option.labelKey) }}
            </option>
          </select>
        </div>
      </section>

      <section class="section bear-card">
        <h3 class="section-title">{{ t('settings.service') }}</h3>
        <div class="setting-row setting-row--intro">
          <div class="setting-row-label">
            <span>{{ t('settings.server') }}</span>
            <small>{{ t('settings.serverDesc') }}</small>
          </div>
        </div>
        <div class="setting-panel">
          <div class="bear-field">
            <input
              v-model="serverInput"
              class="bear-input"
              type="text"
              :placeholder="serverPlaceholder"
            />
          </div>
          <button
            class="bear-btn bear-btn-primary save-server-btn"
            type="button"
            :disabled="sessionStore.loading"
            @click="handleSaveServer"
          >
            {{ t('settings.serverSave') }}
          </button>
        </div>
        <div class="setting-row setting-row--health">
          <div class="setting-row-label">
            <span>{{ t('settings.backend') }}</span>
            <small>{{ healthStatusText }}</small>
          </div>
          <span
            class="health-dot"
            :class="healthReady ? 'is-ready' : 'is-down'"
            :title="healthStatusText"
            aria-hidden="true"
          />
        </div>
      </section>

      <section class="section bear-card">
        <h3 class="section-title">{{ t('settings.about') }}</h3>
        <div class="setting-row">
          <span class="setting-item-label">{{ t('settings.version') }}</span>
          <span class="about-badge">{{ APP_VERSION }}</span>
        </div>
        <div class="setting-row">
          <span class="setting-item-label">{{ t('settings.author') }}</span>
          <a
            :href="AUTHOR_GITHUB_URL"
            class="about-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ AUTHOR_NAME }}
          </a>
        </div>
      </section>

      <p v-if="sessionStore.success" class="feedback feedback--success">{{ sessionStore.success }}</p>
      <p v-if="sessionStore.error" class="bear-error">{{ sessionStore.error }}</p>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  height: 560px;
  background: var(--bear-bg);
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--bear-border);
  background: var(--bear-surface-glass);
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  border-radius: var(--bear-radius-sm);
  background: transparent;
  color: var(--bear-text-secondary);
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}

.back-btn:hover {
  background: var(--bear-surface-hover);
  color: var(--bear-primary);
  border-color: var(--bear-border);
}

.title {
  font-size: 15px;
  font-weight: 600;
  color: var(--bear-text);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section {
  padding: 14px;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--bear-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--bear-border);
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-row--intro {
  align-items: flex-start;
  padding-top: 0;
}

.setting-row--stack {
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}

.setting-row--health {
  align-items: center;
  padding-bottom: 0;
}

.setting-row-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.setting-row-label span,
.setting-item-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--bear-text);
}

.setting-row-label small {
  font-size: 11px;
  color: var(--bear-text-muted);
  line-height: 1.4;
}

.setting-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--bear-border);
}

.setting-note {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--bear-text-muted);
}

.security-input-wrap {
  position: relative;
}

.security-input {
  padding-right: 40px;
}

.security-input-toggle {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--bear-radius-sm);
  background: transparent;
  color: var(--bear-text-muted);
  cursor: pointer;
  transition: color 0.12s ease, background 0.12s ease;
}

.security-input-toggle:hover:not(:disabled) {
  color: var(--bear-primary);
  background: var(--bear-surface-hover);
}

.security-input-toggle:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.security-input-icon {
  display: block;
  flex-shrink: 0;
}

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
}

.status-badge--on {
  background: var(--bear-accent-subtle);
  color: var(--bear-primary);
}

.status-badge--off {
  background: var(--bear-badge-bg);
  color: var(--bear-warning);
}

.btn-row {
  display: flex;
  gap: 8px;
}

.btn-row .bear-btn {
  flex: 1;
}

.save-server-btn {
  width: 100%;
}

.health-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.15s ease, box-shadow 0.15s ease;
}

.health-dot.is-ready {
  background: var(--bear-primary);
  box-shadow: 0 0 0 3px rgba(90, 115, 72, 0.18);
}

.health-dot.is-down {
  background: var(--bear-danger);
  box-shadow: 0 0 0 3px rgba(184, 84, 72, 0.18);
}

.feedback {
  font-size: 12px;
  padding: 10px 12px;
  border-radius: var(--bear-radius-sm);
  line-height: 1.4;
}

.feedback--success {
  background: var(--bear-accent-subtle);
  color: var(--bear-primary);
  border: 1px solid var(--bear-border-hover);
}

.setting-select {
  cursor: pointer;
}

.about-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--bear-accent-subtle);
  color: var(--bear-primary);
}

.about-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--bear-primary);
  text-decoration: none;
  transition: opacity 0.12s ease;
}

.about-link:hover {
  text-decoration: underline;
  opacity: 0.85;
}
</style>
