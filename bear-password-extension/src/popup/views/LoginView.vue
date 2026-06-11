<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '@/popup/composables/useI18n'
import { usePopupStore } from '@/popup/stores/popup'
import { useSessionStore } from '@/popup/stores/session'
import AppLogo from '@/popup/components/AppLogo.vue'

const { t } = useI18n()
const popupStore = usePopupStore()
const sessionStore = useSessionStore()

const username = ref('')
const password = ref('')

async function handleSubmit(): Promise<void> {
  await sessionStore.login(username.value, password.value)
}
</script>

<template>
  <div class="login-view">
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

      <form class="form" @submit.prevent="handleSubmit">
        <div class="bear-field">
          <label class="bear-label">{{ t('login.username') }}</label>
          <input v-model="username" class="bear-input" type="text" autocomplete="username" required />
        </div>

        <div class="bear-field">
          <label class="bear-label">{{ t('login.password') }}</label>
          <input
            v-model="password"
            class="bear-input"
            type="password"
            autocomplete="current-password"
            required
          />
        </div>

        <button class="bear-btn bear-btn-primary submit-btn" type="submit" :disabled="sessionStore.loading">
          {{ sessionStore.loading ? t('login.submitting') : t('login.submit') }}
        </button>

        <p v-if="sessionStore.error" class="bear-error">{{ sessionStore.error }}</p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  padding: 16px;
  min-height: 480px;
  display: flex;
  align-items: center;
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

.submit-btn {
  width: 100%;
  height: 44px;
  margin-top: 4px;
}
</style>
