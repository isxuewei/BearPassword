<script setup lang="ts">
import { useI18n } from '@/popup/composables/useI18n'
import type { FillCredential } from '@/shared/types'

const { t } = useI18n()

defineProps<{
  credential: FillCredential
  highlight?: boolean
}>()

const emit = defineEmits<{
  fill: []
  edit: []
  share: []
  favorite: []
  delete: []
}>()
</script>

<template>
  <div class="credential-item" :class="{ highlight }">
    <div class="accent-bar" aria-hidden="true" />
    <div class="body">
      <button class="info" type="button" :title="t('credential.autofill')" @click="emit('fill')">
        <div class="title">{{ credential.title }}</div>
        <div class="username">{{ credential.username || t('credential.noUsername') }}</div>
      </button>
      <div class="btns">
        <button class="icon-btn" type="button" :title="t('credential.edit')" @click="emit('edit')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
            />
          </svg>
        </button>
        <button class="icon-btn" type="button" :title="t('credential.share')" @click="emit('share')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 1 1 0-2.684m0 2.684 6.632 3.316m-6.632-6 6.632-3.316m0 0a3 3 0 1 0 5.367-2.684 3 3 0 0 0-5.367 2.684Zm0 9.316a3 3 0 1 0 5.368 2.684 3 3 0 0 0-5.368-2.684Z"
            />
          </svg>
        </button>
        <button
          class="icon-btn"
          :class="{ 'icon-btn--active': credential.favorite }"
          type="button"
          :title="credential.favorite ? t('credential.unfavorite') : t('credential.favorite')"
          @click="emit('favorite')"
        >
          <svg class="icon-btn__svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke="currentColor"
              stroke-width="1.75"
              :fill="credential.favorite ? 'currentColor' : 'none'"
              d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
            />
          </svg>
        </button>
        <button class="icon-btn icon-btn--danger" type="button" :title="t('credential.delete')" @click="emit('delete')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.credential-item {
  position: relative;
  background: var(--bear-surface);
  border: 1px solid var(--bear-border);
  border-radius: var(--bear-radius-md);
  overflow: hidden;
  box-shadow: var(--bear-shadow-sm);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.credential-item:hover {
  border-color: var(--bear-border-hover);
  box-shadow: var(--bear-shadow-md);
}

.credential-item.highlight {
  border-color: rgba(90, 115, 72, 0.25);
}

.credential-item.highlight .accent-bar {
  background: var(--bear-primary);
}

.accent-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--bear-warning);
  opacity: 0.7;
}

.body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px 10px 14px;
}

.info {
  min-width: 0;
  flex: 1;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.title {
  font-weight: 600;
  font-size: 13px;
  color: var(--bear-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.username {
  font-size: 12px;
  color: var(--bear-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.btns {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.icon-btn__svg {
  display: block;
  flex-shrink: 0;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid transparent;
  border-radius: var(--bear-radius-sm);
  background: transparent;
  color: var(--bear-text-muted);
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
}

.icon-btn:hover {
  background: var(--bear-surface-hover);
  color: var(--bear-text);
  border-color: var(--bear-border);
}

.icon-btn--active {
  color: var(--bear-warning);
}

.icon-btn--active:hover {
  color: var(--bear-warning);
  background: var(--bear-badge-bg);
}

.icon-btn--danger:hover {
  color: var(--bear-danger);
  background: rgba(184, 84, 72, 0.1);
  border-color: rgba(184, 84, 72, 0.2);
}
</style>
