<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from '@/popup/composables/useI18n'
import { usePopupStore } from '@/popup/stores/popup'
import { useSessionStore } from '@/popup/stores/session'
import AppLogo from '@/popup/components/AppLogo.vue'
import { OFFICIAL_WEBSITE_URL } from '@/shared/constants/app'

const { t } = useI18n()
const popupStore = usePopupStore()
const sessionStore = useSessionStore()
const waking = ref(false)

const statusKey = computed(() => {
  switch (sessionStore.desktopStatus) {
    case 'offline':
      return 'login.statusOffline'
    case 'notLoggedIn':
      return 'login.statusNotLoggedIn'
    case 'locked':
      return 'login.statusLocked'
    default:
      return 'login.statusReady'
  }
})

const hintKey = computed(() => {
  switch (sessionStore.desktopStatus) {
    case 'offline':
      return 'login.hintOffline'
    case 'notLoggedIn':
      return 'login.hintNotLoggedIn'
    case 'locked':
      return 'login.hintLocked'
    default:
      return 'login.hintReady'
  }
})

onMounted(() => {
  void sessionStore.refreshDesktopState()
})

async function handleWakeDesktop(): Promise<void> {
  if (waking.value) return
  waking.value = true
  try {
    await sessionStore.wakeDesktop()
  } catch {
    // error 已在 store 中设置
  } finally {
    waking.value = false
  }
}
</script>

<template>
  <div class="login-view">
    <div class="login-view__body">
      <div class="login-card bear-card">
        <button class="settings-btn" type="button" :title="t('login.settings')" @click="popupStore.openSettings()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.488.488 0 0 0-.59.22L2.74 8.87a.49.49 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"
            />
          </svg>
        </button>

        <header class="header">
          <AppLogo size="lg" />
          <p class="subtitle">{{ t('login.subtitle') }}</p>
        </header>

        <div class="status-panel">
          <div class="status-row">
            <span class="status-label">{{ t('login.connectionStatus') }}</span>
            <span class="status-badge" :class="`status-badge--${sessionStore.desktopStatus}`">
              {{ t(statusKey) }}
            </span>
          </div>
          <p class="status-hint">{{ t(hintKey) }}</p>
        </div>

        <button
          class="bear-btn bear-btn-primary submit-btn"
          type="button"
          :disabled="waking || sessionStore.loading"
          @click="handleWakeDesktop"
        >
          {{ waking ? t('login.openingDesktop') : t('login.openDesktop') }}
        </button>

        <p v-if="sessionStore.wakeHint" class="status-hint status-hint--info">{{ sessionStore.wakeHint }}</p>

        <p v-if="sessionStore.error" class="bear-error">{{ sessionStore.error }}</p>
      </div>
    </div>

    <a
      :href="OFFICIAL_WEBSITE_URL"
      class="official-link"
      target="_blank"
      rel="noopener noreferrer"
    >
      {{ t('settings.officialWebsiteLink') }}
    </a>
  </div>
</template>

<style scoped>
.login-view {
  padding: 16px 16px 20px;
  min-height: 480px;
  display: flex;
  flex-direction: column;
}

.login-view__body {
  flex: 1;
  display: flex;
  align-items: center;
  width: 100%;
}

.official-link {
  flex-shrink: 0;
  display: block;
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--bear-text-muted);
  text-decoration: none;
  transition: color 0.12s ease;
}

.official-link:hover {
  color: var(--bear-primary);
  text-decoration: underline;
}

.login-card {
  position: relative;
  width: 100%;
  padding: 24px 20px;
}

.settings-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  border-radius: var(--bear-radius-sm);
  background: transparent;
  color: var(--bear-text-muted);
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
}

.settings-btn:hover {
  background: var(--bear-surface-hover);
  color: var(--bear-primary);
  border-color: var(--bear-border);
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 24px;
  gap: 8px;
}

.subtitle {
  font-size: 14px;
  color: var(--bear-text-secondary);
}

.status-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  padding: 14px;
  border-radius: var(--bear-radius-sm);
  background: var(--bear-surface-hover);
  border: 1px solid var(--bear-border);
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.status-label {
  font-size: 12px;
  color: var(--bear-text-muted);
  flex-shrink: 0;
}

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
}

.status-badge--offline {
  background: var(--bear-badge-bg);
  color: var(--bear-danger);
}

.status-badge--notLoggedIn,
.status-badge--locked {
  background: var(--bear-badge-bg);
  color: var(--bear-warning);
}

.status-badge--ready {
  background: var(--bear-accent-subtle);
  color: var(--bear-primary);
}

.status-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--bear-text-secondary);
}

.status-hint--info {
  color: var(--bear-primary);
}

.submit-btn {
  width: 100%;
  height: 44px;
}
</style>
