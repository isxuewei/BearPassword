<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="open" class="confirm-overlay" @click.self="emit('cancel')">
        <div class="confirm-dialog bear-card" role="alertdialog" aria-modal="true">
          <div class="confirm-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </div>
          <h3 class="confirm-title">{{ title }}</h3>
          <p class="confirm-message">{{ message }}</p>
          <div class="confirm-actions">
            <button
              class="bear-btn bear-btn-ghost confirm-btn"
              type="button"
              :disabled="loading"
              @click="emit('cancel')"
            >
              {{ cancelLabel ?? '取消' }}
            </button>
            <button
              class="bear-btn confirm-btn confirm-btn--danger"
              type="button"
              :disabled="loading"
              @click="emit('confirm')"
            >
              {{ loading ? '删除中…' : (confirmLabel ?? '确定') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(42, 42, 36, 0.38);
  backdrop-filter: blur(4px);
}

.confirm-dialog {
  width: 100%;
  max-width: 320px;
  padding: 20px 18px 16px;
  text-align: center;
  box-shadow: var(--bear-shadow-lg);
}

.confirm-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: rgba(184, 84, 72, 0.12);
  color: var(--bear-danger);
}

.confirm-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--bear-text);
  margin-bottom: 8px;
}

.confirm-message {
  font-size: 13px;
  line-height: 1.55;
  color: var(--bear-text-secondary);
  margin-bottom: 18px;
}

.confirm-actions {
  display: flex;
  gap: 10px;
}

.confirm-btn {
  flex: 1;
  height: 40px;
  padding: 0 12px;
}

.confirm-btn--danger {
  background: var(--bear-danger);
  color: #fff;
  box-shadow: var(--bear-shadow-sm);
}

.confirm-btn--danger:hover:not(:disabled) {
  background: #a34a40;
  box-shadow: 0 0 16px rgba(184, 84, 72, 0.28);
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.18s ease;
}

.confirm-fade-enter-active .confirm-dialog,
.confirm-fade-leave-active .confirm-dialog {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.confirm-fade-enter-from .confirm-dialog,
.confirm-fade-leave-to .confirm-dialog {
  opacity: 0;
  transform: scale(0.96) translateY(6px);
}
</style>
