<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from '@/popup/composables/useI18n'
import type { FillCredential } from '@/shared/types'
import { PASSWORD_TITLE_MAX_LENGTH } from '@/shared/constants/vaultFieldLimits'
import { sendMessage } from '@/shared/utils/messaging'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  editing: FillCredential | null
  defaultWebsite: string
  saving?: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [data: { title: string; username: string; password: string; website: string }]
}>()

const title = ref('')
const username = ref('')
const password = ref('')
const website = ref('')
const showPassword = ref(false)
const error = ref('')

const dialogTitle = computed(() => (props.editing ? t('entry.edit') : t('entry.create')))

function resetForm(): void {
  title.value = props.editing?.title ?? ''
  username.value = props.editing?.username ?? ''
  password.value = props.editing?.password ?? ''
  website.value = props.editing?.websites[0] ?? props.defaultWebsite
  showPassword.value = false
  error.value = ''
}

watch(
  () => [props.open, props.editing, props.defaultWebsite] as const,
  ([open]) => {
    if (open) resetForm()
  }
)

function validate(): boolean {
  if (!title.value.trim()) {
    error.value = t('entry.error.titleRequired')
    return false
  }
  if (title.value.length > PASSWORD_TITLE_MAX_LENGTH) {
    error.value = t('entry.error.titleTooLong', { max: PASSWORD_TITLE_MAX_LENGTH })
    return false
  }
  if (!username.value.trim() && !password.value) {
    error.value = t('entry.error.usernameOrPassword')
    return false
  }
  error.value = ''
  return true
}

function handleSubmit(): void {
  if (!validate()) return
  emit('submit', {
    title: title.value.trim(),
    username: username.value.trim(),
    password: password.value,
    website: website.value.trim()
  })
}

async function handleGeneratePassword(): Promise<void> {
  password.value = await sendMessage<string>({ type: 'GENERATE_PASSWORD' })
  showPassword.value = true
}
</script>

<template>
  <Transition name="entry-sheet">
    <div v-if="open" class="entry-sheet">
      <header class="entry-header">
        <button class="icon-btn" type="button" :title="t('common.back')" :disabled="saving" @click="emit('close')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 class="entry-title">{{ dialogTitle }}</h2>
        <button
          class="save-btn"
          type="button"
          :disabled="saving"
          @click="handleSubmit"
        >
          {{ saving ? t('entry.saving') : t('entry.save') }}
        </button>
      </header>

      <div class="entry-body">
        <div class="entry-hero">
          <div class="entry-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="10" width="16" height="12" rx="2" stroke="white" stroke-width="1.5" />
              <path
                d="M8 10V8C8 5.5 10 4 12 4C14 4 16 5.5 16 8V10"
                stroke="white"
                stroke-width="1.5"
              />
              <circle cx="12" cy="16" r="1.5" fill="white" />
            </svg>
          </div>
          <input
            v-model="title"
            class="title-input"
            type="text"
            :placeholder="t('entry.titlePlaceholder')"
            :disabled="saving"
            :maxlength="PASSWORD_TITLE_MAX_LENGTH"
          />
        </div>

        <div class="entry-card">
          <div class="entry-field">
            <label class="field-label">{{ t('entry.username') }}</label>
            <input
              v-model="username"
              class="bear-input"
              type="text"
              :placeholder="t('entry.usernamePlaceholder')"
              autocomplete="off"
              :disabled="saving"
            />
          </div>
          <div class="entry-divider" />
          <div class="entry-field entry-field--password">
            <label class="field-label">{{ t('entry.password') }}</label>
            <div class="password-row">
              <input
                v-model="password"
                class="bear-input password-input"
                :class="{ 'is-masked': !showPassword }"
                type="text"
                :placeholder="t('entry.passwordPlaceholder')"
                autocomplete="off"
                :disabled="saving"
              />
              <button
                class="password-action"
                type="button"
                :title="showPassword ? t('entry.hidePassword') : t('entry.showPassword')"
                :disabled="saving"
                @click="showPassword = !showPassword"
              >
                <svg
                  v-if="showPassword"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.036 12.322a1 1 0 0 1 0-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                  />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                <svg
                  v-else
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              </button>
              <button
                class="password-action"
                type="button"
                :title="t('entry.generatePassword')"
                :disabled="saving"
                @click="handleGeneratePassword"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="entry-card entry-card--soft">
          <div class="entry-field">
            <label class="field-label">{{ t('entry.website') }}</label>
            <input
              v-model="website"
              class="bear-input"
              type="text"
              :placeholder="t('entry.websitePlaceholder')"
              :disabled="saving"
            />
            <p class="field-hint">{{ t('entry.websiteHint') }}</p>
          </div>
        </div>

        <p v-if="error" class="bear-error">{{ error }}</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.entry-sheet {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  background: var(--bear-bg);
}

.entry-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--bear-border);
  background: var(--bear-surface-glass);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.entry-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--bear-text);
  text-align: center;
}

.save-btn {
  padding: 6px 12px;
  border: none;
  border-radius: var(--bear-radius-sm);
  background: var(--bear-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s ease;
}

.save-btn:hover:not(:disabled) {
  background: var(--bear-primary-hover);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.entry-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
}

.entry-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.entry-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--bear-radius-md);
  background: linear-gradient(135deg, var(--bear-primary) 0%, var(--bear-primary-light) 100%);
  flex-shrink: 0;
  box-shadow: var(--bear-shadow-sm);
}

.title-input {
  flex: 1;
  min-width: 0;
  padding: 10px 0;
  border: none;
  background: transparent;
  font-size: 17px;
  font-weight: 600;
  color: var(--bear-text);
  outline: none;
}

.title-input::placeholder {
  color: var(--bear-text-muted);
  font-weight: 500;
}

.entry-card {
  background: var(--bear-surface);
  border: 1px solid var(--bear-border);
  border-radius: var(--bear-radius-md);
  margin-bottom: 10px;
  overflow: hidden;
  box-shadow: var(--bear-shadow-sm);
}

.entry-card--soft {
  background: var(--bear-surface-2);
}

.entry-field {
  padding: 12px 14px;
}

.field-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--bear-text-secondary);
}

.field-hint {
  margin-top: 6px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--bear-text-muted);
}

.entry-divider {
  height: 1px;
  background: var(--bear-border);
  margin: 0 14px;
}

.password-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.password-input {
  flex: 1;
  min-width: 0;
}

.password-input.is-masked {
  -webkit-text-security: disc;
  text-security: disc;
}

.password-action {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: 1px solid var(--bear-border);
  border-radius: var(--bear-radius-md);
  background: var(--bear-surface-2);
  color: var(--bear-text-muted);
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
}

.password-action:hover:not(:disabled) {
  background: var(--bear-accent-subtle);
  color: var(--bear-primary);
  border-color: rgba(90, 115, 72, 0.28);
}

.password-action:active:not(:disabled) {
  transform: scale(0.96);
}

.password-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  flex-shrink: 0;
  transition: background 0.12s ease, color 0.12s ease;
}

.icon-btn:hover:not(:disabled) {
  background: var(--bear-surface-hover);
  color: var(--bear-primary);
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.entry-sheet-enter-active,
.entry-sheet-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.entry-sheet-enter-from,
.entry-sheet-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
