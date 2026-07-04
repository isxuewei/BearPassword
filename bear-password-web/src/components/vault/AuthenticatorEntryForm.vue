<template>
  <div class="authenticator-form">
    <div class="authenticator-form__hero">
      <div class="authenticator-form__icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="8" width="16" height="12" rx="2" stroke="white" stroke-width="1.5"/>
          <path d="M8 8V6.5C8 4.5 9.8 3 12 3C14.2 3 16 4.5 16 6.5V8" stroke="white" stroke-width="1.5"/>
          <circle cx="12" cy="14" r="2" stroke="white" stroke-width="1.5"/>
          <path d="M12 16V18" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <input
        v-model="accountName"
        class="authenticator-form__title-input"
        :placeholder="t('entry.form.titlePlaceholder')"
        type="text"
        :maxlength="PASSWORD_TITLE_MAX_LENGTH"
      />
    </div>

    <div v-if="hasValidSecret" class="authenticator-form__card authenticator-form__card--preview">
      <TotpCodeDisplay :content="content" size="large" />
    </div>

    <div class="authenticator-form__card">
      <div class="authenticator-form__mode-switch" role="tablist">
        <button
          type="button"
          class="authenticator-form__mode-btn"
          :class="{ 'is-active': inputMode === 'secret' }"
          role="tab"
          :aria-selected="inputMode === 'secret'"
          @click="inputMode = 'secret'"
        >
          {{ t('entry.form.authenticator.modeSecret') }}
        </button>
        <button
          type="button"
          class="authenticator-form__mode-btn"
          :class="{ 'is-active': inputMode === 'qrcode' }"
          role="tab"
          :aria-selected="inputMode === 'qrcode'"
          @click="inputMode = 'qrcode'"
        >
          {{ t('entry.form.authenticator.modeQr') }}
        </button>
      </div>

      <div v-if="inputMode === 'secret'" class="authenticator-form__field">
        <label class="authenticator-form__label">{{ t('entry.form.authenticator.secret') }}</label>
        <input
          v-model="content.secret"
          class="authenticator-form__input authenticator-form__input--mono"
          :class="{ 'is-invalid': secretInvalid }"
          :placeholder="t('entry.form.authenticator.secretPlaceholder')"
          type="text"
          spellcheck="false"
          autocomplete="off"
        />
        <p v-if="secretInvalid" class="authenticator-form__error">{{ t('entry.totp.invalidSecret') }}</p>
      </div>

      <div v-else class="authenticator-form__qr-panel">
        <p class="authenticator-form__qr-hint">{{ t('entry.form.authenticator.qrHint') }}</p>
        <div class="authenticator-form__qr-actions">
          <button
            type="button"
            class="authenticator-form__qr-btn"
            :disabled="qrProcessing"
            @click="triggerQrFilePick"
          >
            {{ t('entry.form.authenticator.uploadQr') }}
          </button>
          <button
            type="button"
            class="authenticator-form__qr-btn"
            :disabled="qrProcessing"
            @click="handlePasteQrFromClipboard"
          >
            {{ t('entry.form.authenticator.pasteQr') }}
          </button>
        </div>
        <p v-if="qrProcessing" class="authenticator-form__qr-status">{{ t('entry.form.authenticator.qrProcessing') }}</p>
        <input
          ref="qrFileInputRef"
          class="authenticator-form__file-input"
          type="file"
          accept="image/*"
          @change="handleQrFileChange"
        />
      </div>
    </div>

    <div class="authenticator-form__card authenticator-form__card--advanced">
      <button
        type="button"
        class="authenticator-form__advanced-toggle"
        :aria-expanded="advancedExpanded"
        @click="advancedExpanded = !advancedExpanded"
      >
        <span class="authenticator-form__advanced-toggle-text">
          <span class="authenticator-form__advanced-title">{{ t('entry.form.authenticator.advanced') }}</span>
          <span class="authenticator-form__advanced-hint">{{ t('entry.form.authenticator.advancedHint') }}</span>
        </span>
        <svg
          class="authenticator-form__advanced-chevron"
          :class="{ 'is-expanded': advancedExpanded }"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <div v-show="advancedExpanded" class="authenticator-form__advanced-panel">
        <div class="authenticator-form__advanced-grid">
          <div class="authenticator-form__field">
            <label class="authenticator-form__label">{{ t('entry.form.authenticator.algorithm') }}</label>
            <select v-model="content.algorithm" class="authenticator-form__select">
              <option v-for="item in ALGORITHM_OPTIONS" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
          <div class="authenticator-form__field">
            <label class="authenticator-form__label">{{ t('entry.form.authenticator.digits') }}</label>
            <select v-model.number="content.digits" class="authenticator-form__select">
              <option v-for="item in DIGITS_OPTIONS" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
          <div class="authenticator-form__field">
            <label class="authenticator-form__label">{{ t('entry.form.authenticator.period') }}</label>
            <select v-model.number="content.period" class="authenticator-form__select">
              <option v-for="item in periodOptions" :key="item" :value="item">
                {{ t('entry.form.authenticator.periodOption', { n: item }) }}
              </option>
            </select>
          </div>
        </div>

        <div class="authenticator-form__field">
          <label class="authenticator-form__label">{{ t('entry.form.authenticator.issuer') }}</label>
          <input
            v-model="content.issuer"
            class="authenticator-form__input"
            :placeholder="t('entry.form.authenticator.issuerPlaceholder')"
            type="text"
            spellcheck="false"
            autocomplete="off"
          />
        </div>

        <div class="authenticator-form__field">
          <label class="authenticator-form__label">{{ t('entry.form.authenticator.importUri') }}</label>
          <div class="authenticator-form__import-row">
            <input
              v-model="otpauthUriInput"
              class="authenticator-form__input authenticator-form__input--mono"
              :placeholder="t('entry.form.authenticator.importUriPlaceholder')"
              type="text"
              spellcheck="false"
              autocomplete="off"
            />
            <button type="button" class="authenticator-form__import-btn" @click="handleImportUri">
              {{ t('entry.form.authenticator.import') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="authenticator-form__card authenticator-form__card--soft">
      <label class="authenticator-form__block-label">{{ t('entry.form.tags') }}</label>
      <TagInput v-model="labelsModel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import TagInput from '@/components/vault/TagInput.vue'
import TotpCodeDisplay from '@/components/vault/TotpCodeDisplay.vue'
import { PASSWORD_TITLE_MAX_LENGTH } from '@/constants/vaultFieldLimits'
import { useI18n } from '@/composables/useI18n'
import type { AuthenticatorContent } from '@/types'
import { decodeQrTextFromClipboard, decodeQrTextFromFile } from '@/utils/qrCodeDecoder'
import { applyParsedOtpAuthImport, isValidAuthenticatorSecret, parseOtpAuthUri } from '@/utils/totp'

type InputMode = 'secret' | 'qrcode'

const ALGORITHM_OPTIONS = ['SHA1', 'SHA256', 'SHA512'] as const
const DIGITS_OPTIONS = [6, 8] as const
const PERIOD_OPTIONS = [15, 30, 60, 90, 120] as const

const periodOptions = computed(() => {
  const current = props.content.period
  if (PERIOD_OPTIONS.includes(current as (typeof PERIOD_OPTIONS)[number])) {
    return [...PERIOD_OPTIONS]
  }
  return [...PERIOD_OPTIONS, current].sort((a, b) => a - b)
})

const props = defineProps<{
  content: AuthenticatorContent
  labels: string[]
}>()

const emit = defineEmits<{
  'update:labels': [value: string[]]
}>()

const { t } = useI18n()
const inputMode = ref<InputMode>('secret')
const qrProcessing = ref(false)
const qrFileInputRef = ref<HTMLInputElement>()
const advancedExpanded = ref(false)
const otpauthUriInput = ref('')

function hasNonDefaultAdvancedSettings(content: AuthenticatorContent): boolean {
  return (
    content.algorithm !== 'SHA1' ||
    content.digits !== 6 ||
    content.period !== 30 ||
    Boolean(content.issuer.trim())
  )
}

watch(
  () => props.content,
  (content) => {
    if (hasNonDefaultAdvancedSettings(content)) {
      advancedExpanded.value = true
    }
  },
  { immediate: true, deep: true }
)

const labelsModel = computed({
  get: () => props.labels,
  set: (value: string[]) => emit('update:labels', value)
})

const accountName = computed({
  get: () => {
    if (props.content.account.trim()) return props.content.account
    if (props.content.title.trim()) return props.content.title
    if (props.content.issuer.trim()) {
      return props.content.issuer
    }
    return ''
  },
  set: (value: string) => {
    const trimmed = value.trim()
    props.content.account = trimmed
    props.content.title = trimmed
    props.content.issuer = ''
  }
})

const secretInvalid = computed(() => {
  const secret = props.content.secret.trim()
  return Boolean(secret) && !isValidAuthenticatorSecret(secret)
})

const hasValidSecret = computed(() => {
  const secret = props.content.secret.trim()
  return Boolean(secret) && isValidAuthenticatorSecret(secret)
})

function triggerQrFilePick(): void {
  qrFileInputRef.value?.click()
}

async function handleQrFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  await processQrImageFile(file)
}

async function handlePasteQrFromClipboard(): Promise<void> {
  if (qrProcessing.value) return

  qrProcessing.value = true
  try {
    const qrText = await decodeQrTextFromClipboard()
    if (!qrText) {
      ElMessage.warning(t('entry.form.authenticator.clipboardEmpty'))
      return
    }
    applyQrPayload(qrText)
  } catch {
    ElMessage.warning(t('entry.form.authenticator.qrReadFailed'))
  } finally {
    qrProcessing.value = false
  }
}

async function processQrImageFile(file: File): Promise<void> {
  if (qrProcessing.value) return

  qrProcessing.value = true
  try {
    const qrText = await decodeQrTextFromFile(file)
    if (!qrText) {
      ElMessage.warning(t('entry.form.authenticator.qrNotFound'))
      return
    }
    applyQrPayload(qrText)
  } catch {
    ElMessage.warning(t('entry.form.authenticator.qrReadFailed'))
  } finally {
    qrProcessing.value = false
  }
}

function applyQrPayload(qrText: string): void {
  const parsed = parseOtpAuthUri(qrText)
  if (!parsed) {
    ElMessage.warning(t('entry.form.authenticator.qrInvalid'))
    return
  }

  applyParsedOtpAuthImport(props.content, parsed)
  inputMode.value = 'secret'
  otpauthUriInput.value = ''
  ElMessage.success(t('entry.form.authenticator.qrSuccess'))
}

function handleImportUri(): void {
  const parsed = parseOtpAuthUri(otpauthUriInput.value)
  if (!parsed) {
    ElMessage.warning(t('entry.form.authenticator.importFailed'))
    return
  }

  applyParsedOtpAuthImport(props.content, parsed)
  otpauthUriInput.value = ''
  if (hasNonDefaultAdvancedSettings(props.content)) {
    advancedExpanded.value = true
  }
  ElMessage.success(t('entry.form.authenticator.importSuccess'))
}
</script>

<style scoped lang="scss">
.authenticator-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  font-family: $font-family;

  &__hero {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: 0 0 $spacing-xs;
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: $radius-md;
    background: linear-gradient(135deg, #e63946, #c1121f);
    box-shadow: 0 4px 12px rgba(230, 57, 70, 0.28);
    @include flex-center;
    flex-shrink: 0;
  }

  &__title-input {
    flex: 1;
    border: none;
    background: transparent;
    font-family: $font-family;
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-text-primary;
    outline: none;

    &::placeholder {
      color: $color-text-muted;
      font-weight: 500;
    }
  }

  &__card {
    @include card;
    padding: $spacing-md;
    border-radius: $radius-md;
    background: $color-bg-elevated;

    &--soft {
      background: $color-bg-secondary;
      box-shadow: none;
      border-color: $color-border;
    }

    &--preview {
      @include flex-center;
      padding: $spacing-lg $spacing-md;
    }
  }

  &__mode-switch {
    display: flex;
    gap: $spacing-xs;
    padding: 3px;
    margin-bottom: $spacing-md;
    border-radius: $radius-sm;
    background: $color-bg-secondary;
  }

  &__mode-btn {
    flex: 1;
    border: none;
    border-radius: calc(#{$radius-sm} - 2px);
    padding: $spacing-xs $spacing-sm;
    font-family: $font-family;
    font-size: $font-size-sm;
    font-weight: 500;
    color: $color-text-secondary;
    background: transparent;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;

    &.is-active {
      color: $color-text-primary;
      background: $color-bg-elevated;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__label,
  &__block-label {
    font-size: $font-size-sm;
    font-weight: 500;
    color: $color-text-secondary;
  }

  &__input {
    width: 100%;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    padding: $spacing-sm $spacing-md;
    font-family: $font-family;
    font-size: $font-size-sm;
    color: $color-text-primary;
    background: transparent;
    outline: none;
    transition: border-color 0.15s ease;

    &:focus {
      border-color: $color-accent;
    }

    &--mono {
      font-family: $font-family-mono;
      letter-spacing: 0.08em;
    }

    &.is-invalid {
      border-color: $color-danger;
    }
  }

  &__qr-panel {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__qr-hint {
    margin: 0;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    line-height: 1.5;
  }

  &__qr-actions {
    display: flex;
    gap: $spacing-sm;
  }

  &__qr-btn {
    flex: 1;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    padding: $spacing-sm $spacing-md;
    font-family: $font-family;
    font-size: $font-size-sm;
    font-weight: 500;
    color: $color-text-primary;
    background: $color-bg-elevated;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover:not(:disabled) {
      background: $color-surface-hover;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__qr-status {
    margin: 0;
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__file-input {
    display: none;
  }

  &__error {
    margin: 0;
    font-size: $font-size-xs;
    color: $color-danger;
  }

  &__card--advanced {
    padding: 0;
    overflow: hidden;
  }

  &__advanced-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-sm;
    width: 100%;
    border: none;
    padding: $spacing-md;
    font-family: $font-family;
    text-align: left;
    color: $color-text-primary;
    background: transparent;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: $color-surface-hover;
    }
  }

  &__advanced-toggle-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__advanced-title {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-text-primary;
  }

  &__advanced-hint {
    font-size: $font-size-xs;
    color: $color-text-muted;
    line-height: 1.4;
  }

  &__advanced-chevron {
    flex-shrink: 0;
    color: $color-text-secondary;
    transition: transform 0.2s ease;

    &.is-expanded {
      transform: rotate(180deg);
    }
  }

  &__advanced-panel {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    padding: 0 $spacing-md $spacing-md;
    border-top: 1px solid $color-border;
  }

  &__advanced-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $spacing-sm;
  }

  &__select {
    width: 100%;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    padding: $spacing-sm $spacing-md;
    font-family: $font-family;
    font-size: $font-size-sm;
    color: $color-text-primary;
    background: transparent;
    outline: none;
    cursor: pointer;
    transition: border-color 0.15s ease;

    &:focus {
      border-color: $color-accent;
    }
  }

  &__import-row {
    display: flex;
    gap: $spacing-sm;
  }

  &__import-btn {
    flex-shrink: 0;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    padding: $spacing-sm $spacing-md;
    font-family: $font-family;
    font-size: $font-size-sm;
    font-weight: 500;
    color: $color-text-primary;
    background: $color-bg-elevated;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: $color-surface-hover;
    }
  }
}
</style>
