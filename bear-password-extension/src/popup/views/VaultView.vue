<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from '@/popup/composables/useI18n'
import { usePopupStore } from '@/popup/stores/popup'
import { useSessionStore, useVaultStore } from '@/popup/stores/session'
import BearConfirmDialog from '@/popup/components/BearConfirmDialog.vue'
import CredentialItem from '@/popup/components/CredentialItem.vue'
import LoginEntryDialog from '@/popup/components/LoginEntryDialog.vue'
import AppLogo from '@/popup/components/AppLogo.vue'
import { getPageHostLabel, getPageWebsiteUrl } from '@/shared/utils/websiteMatch'

const { t } = useI18n()
const popupStore = usePopupStore()
const sessionStore = useSessionStore()
const vaultStore = useVaultStore()

onMounted(() => {
  void vaultStore.refresh()
})

const pageHost = () => getPageHostLabel(vaultStore.currentUrl)
const defaultWebsite = () => getPageWebsiteUrl(vaultStore.currentUrl)

const emptyText = computed(() =>
  vaultStore.keyword ? t('vault.emptyNoMatch') : t('vault.emptyNoEntries')
)

const deleteMessage = computed(() =>
  vaultStore.pendingDelete
    ? t('vault.deleteMessage', { title: vaultStore.pendingDelete.title })
    : ''
)
</script>

<template>
  <div class="vault-view">
    <header class="top-bar">
      <AppLogo size="sm" />
      <div class="user-meta">
        <span class="user-name">{{ sessionStore.username }}</span>
      </div>
      <div class="actions">
        <button class="icon-btn" type="button" :title="t('vault.settings')" @click="popupStore.openSettings()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.488.488 0 0 0-.59.22L2.74 8.87a.49.49 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"
            />
          </svg>
        </button>
        <button class="icon-btn" type="button" :title="t('vault.logout')" @click="sessionStore.logout()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
            />
          </svg>
        </button>
      </div>
    </header>

    <div class="search-wrap">
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
          />
        </svg>
        <input
          v-model="vaultStore.keyword"
          class="bear-input search-input"
          type="search"
          :placeholder="t('vault.searchPlaceholder')"
        />
      </div>
    </div>

    <div class="content" :class="{ loading: vaultStore.loading }">
      <section class="section">
        <h2 class="section-title">
          <span class="section-dot" />
          {{ t('vault.thisSite') }}
          <span v-if="pageHost()" class="host">{{ pageHost() }}</span>
          <span v-if="vaultStore.filtered.length" class="count">{{ vaultStore.filtered.length }}</span>
          <button class="add-btn" type="button" :title="t('vault.addTitle')" @click="vaultStore.openCreate()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" d="M12 5v14M5 12h14" />
            </svg>
            {{ t('vault.add') }}
          </button>
        </h2>

        <div
          v-if="!vaultStore.loading && !vaultStore.filtered.length && vaultStore.needsSecurityKey && !vaultStore.keyword"
          class="empty empty--key"
        >
          <svg class="empty-icon" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
            />
          </svg>
          <p class="empty-title">{{ t('vault.emptyEncryptedTitle') }}</p>
          <p class="empty-desc">{{ t('vault.emptyEncryptedDesc') }}</p>
          <button class="bear-btn bear-btn-primary empty-action" type="button" @click="popupStore.openSettings()">
            {{ t('vault.configureKey') }}
          </button>
        </div>

        <p v-else-if="!vaultStore.loading && !vaultStore.filtered.length" class="empty">
          <svg class="empty-icon" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 2C9.24 2 7 4.24 7 7v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v3H9V7c0-1.66 1.34-3 3-3z"
            />
          </svg>
          {{ emptyText }}
          <button
            v-if="!vaultStore.keyword"
            class="empty-add-btn"
            type="button"
            @click="vaultStore.openCreate()"
          >
            {{ t('vault.addEntry') }}
          </button>
        </p>

        <div v-else class="item-list">
          <CredentialItem
            v-for="item in vaultStore.filtered"
            :key="item.id"
            :credential="item"
            highlight
            @fill="vaultStore.autofill(item.id)"
            @edit="vaultStore.openEdit(item)"
            @share="vaultStore.shareCredential(item)"
            @favorite="vaultStore.toggleFavorite(item)"
            @delete="vaultStore.requestDelete(item)"
          />
        </div>
      </section>
    </div>

    <Transition name="vault-toast">
      <p v-if="vaultStore.toast" class="vault-toast">{{ vaultStore.toast }}</p>
    </Transition>

    <LoginEntryDialog
      :open="vaultStore.entryDialogOpen"
      :editing="vaultStore.editingCredential"
      :default-website="defaultWebsite()"
      :saving="vaultStore.entrySaving"
      @close="vaultStore.closeEntryDialog()"
      @submit="vaultStore.saveEntry($event)"
    />

    <BearConfirmDialog
      :open="!!vaultStore.pendingDelete"
      :title="t('vault.deleteTitle')"
      :message="deleteMessage"
      :confirm-label="t('vault.deleteConfirm')"
      :cancel-label="t('common.cancel')"
      :loading="vaultStore.deleting"
      @confirm="vaultStore.confirmDelete()"
      @cancel="vaultStore.cancelDelete()"
    />
  </div>
</template>

<style scoped>
.vault-view {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 560px;
  background: var(--bear-bg);
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--bear-border);
  background: var(--bear-surface-glass);
  backdrop-filter: blur(8px);
}

.user-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--bear-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.icon-btn {
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

.icon-btn:hover {
  background: var(--bear-surface-hover);
  color: var(--bear-primary);
  border-color: var(--bear-border);
}

.search-wrap {
  padding: 12px 14px;
  border-bottom: 1px solid var(--bear-border);
  background: var(--bear-surface);
}

.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--bear-text-muted);
  pointer-events: none;
}

.search-input {
  padding-left: 36px;
  background: var(--bear-surface-2);
  border-color: var(--bear-border);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px 14px;
}

.content.loading {
  opacity: 0.65;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--bear-text-secondary);
}

.section-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--bear-primary);
  flex-shrink: 0;
}

.host,
.count {
  font-weight: 500;
  font-size: 11px;
  color: var(--bear-warning);
  background: var(--bear-badge-bg);
  padding: 2px 8px;
  border-radius: 999px;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding: 4px 10px;
  border: 1px solid rgba(90, 115, 72, 0.25);
  border-radius: 999px;
  background: var(--bear-accent-subtle);
  color: var(--bear-primary);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.add-btn:hover {
  background: rgba(90, 115, 72, 0.18);
  border-color: rgba(90, 115, 72, 0.35);
}

.empty-add-btn {
  display: block;
  margin: 14px auto 0;
  padding: 8px 16px;
  border: 1px dashed var(--bear-border-hover);
  border-radius: var(--bear-radius-md);
  background: var(--bear-surface-2);
  color: var(--bear-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.empty-add-btn:hover {
  background: var(--bear-accent-subtle);
  border-color: rgba(90, 115, 72, 0.3);
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty {
  padding: 32px 14px;
  text-align: center;
  color: var(--bear-text-muted);
  font-size: 13px;
  background: var(--bear-surface);
  border: 1px dashed var(--bear-border);
  border-radius: var(--bear-radius-md);
}

.empty-icon {
  display: block;
  margin: 0 auto 8px;
  color: var(--bear-primary-light);
  opacity: 0.55;
}

.empty--key {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty--key .empty-icon {
  color: var(--bear-warning);
  opacity: 0.85;
}

.empty-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--bear-text);
  margin-bottom: 6px;
}

.empty-desc {
  font-size: 12px;
  line-height: 1.55;
  color: var(--bear-text-secondary);
  margin-bottom: 14px;
  max-width: 280px;
}

.empty-action {
  min-width: 120px;
  height: 36px;
  padding: 0 16px;
}

.vault-toast {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 14px;
  z-index: 10;
  padding: 10px 14px;
  border-radius: var(--bear-radius-sm);
  background: var(--bear-surface);
  color: var(--bear-text);
  border: 1px solid var(--bear-border-hover);
  font-size: 13px;
  text-align: center;
  box-shadow: var(--bear-shadow-md);
  pointer-events: none;
}

.vault-toast-enter-active,
.vault-toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.vault-toast-enter-from,
.vault-toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
