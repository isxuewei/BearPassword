<script setup lang="ts">
import { useI18n } from '@/popup/composables/useI18n'
import { usePopupStore } from '@/popup/stores/popup'
import { useSessionStore, useVaultStore } from '@/popup/stores/session'
import { APP_VERSION, AUTHOR_GITHUB_URL, AUTHOR_NAME, OFFICIAL_WEBSITE_URL } from '@/shared/constants/app'

const { t } = useI18n()
const popupStore = usePopupStore()
const sessionStore = useSessionStore()
const vaultStore = useVaultStore()

async function handleBack(): Promise<void> {
  popupStore.openVault()
  if (sessionStore.isReady) {
    await vaultStore.refresh()
  }
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
        <div class="setting-row">
          <span class="setting-item-label">{{ t('settings.officialWebsite') }}</span>
          <a
            :href="OFFICIAL_WEBSITE_URL"
            class="about-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t('settings.officialWebsiteLink') }}
          </a>
        </div>
      </section>
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

.setting-item-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--bear-text);
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
