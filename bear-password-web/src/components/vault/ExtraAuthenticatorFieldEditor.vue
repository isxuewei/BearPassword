<template>
  <div class="extra-auth-field">
    <label class="extra-auth-field__label">{{ t('entry.form.authenticator.secret') }}</label>
    <div class="extra-auth-field__row">
      <input
        v-model="secretModel"
        class="extra-auth-field__input"
        :class="{ 'is-invalid': secretInvalid }"
        :placeholder="t('entry.form.authenticator.secretPlaceholder')"
        type="text"
        spellcheck="false"
        autocomplete="off"
      />
      <div class="extra-auth-field__actions">
        <el-tooltip
          :content="t('entry.form.authenticator.uploadQr')"
          placement="top"
          :show-after="0"
          :hide-after="0"
          effect="light"
          popper-class="extra-auth-field__tip"
        >
          <button
            type="button"
            class="extra-auth-field__icon-btn"
            :disabled="qrProcessing"
            :aria-label="t('entry.form.authenticator.uploadQr')"
            @click="triggerQrFilePick"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
              <path d="M4.5 10.5L6.5 8.5L8.5 10.5L11 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="5.5" cy="5.5" r="0.9" fill="currentColor"/>
            </svg>
          </button>
        </el-tooltip>
        <el-tooltip
          :content="t('entry.form.authenticator.pasteQr')"
          placement="top"
          :show-after="0"
          :hide-after="0"
          effect="light"
          popper-class="extra-auth-field__tip"
        >
          <button
            type="button"
            class="extra-auth-field__icon-btn"
            :disabled="qrProcessing"
            :aria-label="t('entry.form.authenticator.pasteQr')"
            @click="handlePasteQrFromClipboard"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="2.5" y="4.5" width="11" height="9" rx="1.2" stroke="currentColor" stroke-width="1.2"/>
              <path d="M5.25 4.5h5.5a1 1 0 0 0 1-1V3.25a1 1 0 0 0-1-1h-5.5a1 1 0 0 0-1 1V3.5a1 1 0 0 0 1 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 7.25v2.25M6.5 9.25L8 10.75l1.5-1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </el-tooltip>
        <div
          v-if="hasValidSecret"
          class="extra-auth-field__totp-wrap"
          @mouseenter="totpPopoverOpen = true"
          @mouseleave="totpPopoverOpen = false"
        >
          <button
            type="button"
            class="extra-auth-field__icon-btn"
            :class="{ 'is-active': totpPopoverOpen }"
            :aria-label="t('entry.totp.viewCode')"
            @click="handleCopyTotpCode"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8z" stroke="currentColor" stroke-width="1.2"/>
              <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.2"/>
            </svg>
          </button>
          <div v-show="totpPopoverOpen" class="extra-auth-field__totp-popover">
            <button
              type="button"
              class="extra-auth-field__totp-code"
              :aria-label="t('entry.totp.copyCode')"
              @click="handleCopyTotpCode"
            >
              {{ totpCode }}
            </button>
            <div class="extra-auth-field__totp-ring" aria-hidden="true">
              <svg viewBox="0 0 36 36">
                <g transform="rotate(-90 18 18)">
                  <circle class="extra-auth-field__totp-ring-track" cx="18" cy="18" r="15.5" fill="none" stroke-width="3"/>
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="#e63946"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-dasharray="97.4"
                    :stroke-dashoffset="totpRingOffset"
                  />
                </g>
                <text x="18" y="18" text-anchor="middle" dominant-baseline="central" class="extra-auth-field__totp-countdown">
                  {{ totpCountdown }}
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
    <p v-if="qrProcessing" class="extra-auth-field__status">{{ t('entry.form.authenticator.qrProcessing') }}</p>
    <p v-if="secretInvalid" class="extra-auth-field__error">{{ t('entry.totp.invalidSecret') }}</p>
    <input
      ref="qrFileInputRef"
      class="extra-auth-field__file-input"
      type="file"
      accept="image/*"
      @change="handleQrFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import type { LoginExtraField } from '@/types'
import { applyParsedOtpAuthToExtraField, extraFieldToAuthenticatorContent } from '@/utils/extraField'
import { decodeQrTextFromClipboard, decodeQrTextFromFile } from '@/utils/qrCodeDecoder'
import { copySensitiveText } from '@/utils/sensitiveClipboard'
import { generateTotpSnapshot, isValidAuthenticatorSecret, parseOtpAuthUri } from '@/utils/totp'

const props = defineProps<{
  field: LoginExtraField
}>()

const { t } = useI18n()
const qrProcessing = ref(false)
const totpPopoverOpen = ref(false)
const qrFileInputRef = ref<HTMLInputElement>()
const nowMs = ref(Date.now())
let totpTimer: ReturnType<typeof setInterval> | null = null

const secretModel = computed({
  get: () => props.field.secret ?? '',
  set: (value: string) => {
    props.field.secret = value.replace(/\s+/g, '').toUpperCase()
  }
})

const authenticatorContent = computed(() => extraFieldToAuthenticatorContent(props.field))

const totpSnapshot = computed(() => generateTotpSnapshot(authenticatorContent.value, nowMs.value))

const totpCode = computed(() => totpSnapshot.value?.code ?? '------')

const totpCountdown = computed(() => {
  if (!totpSnapshot.value) return '--'
  return String(totpSnapshot.value.remainingSeconds).padStart(2, '0')
})

const totpRingOffset = computed(() => {
  if (!totpSnapshot.value) return 97.4
  const progress = totpSnapshot.value.remainingSeconds / totpSnapshot.value.period
  return 97.4 * (1 - progress)
})

const secretInvalid = computed(() => {
  const secret = props.field.secret?.trim() ?? ''
  return Boolean(secret) && !isValidAuthenticatorSecret(secret)
})

const hasValidSecret = computed(() => {
  const secret = props.field.secret?.trim() ?? ''
  return Boolean(secret) && isValidAuthenticatorSecret(secret)
})

onMounted(() => {
  totpTimer = setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (totpTimer) clearInterval(totpTimer)
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

  applyParsedOtpAuthToExtraField(props.field, parsed)
  ElMessage.success(t('entry.form.authenticator.qrSuccess'))
}

async function handleCopyTotpCode(): Promise<void> {
  const code = totpSnapshot.value?.code
  if (!code) return
  const copied = await copySensitiveText(code)
  if (copied) {
    ElMessage.success(t('entry.totp.codeCopied'))
  } else {
    ElMessage.warning(t('entry.msg.copyFailed'))
  }
}
</script>

<style scoped lang="scss">
.extra-auth-field {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  &__label {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    font-family: $font-family-mono;
    font-size: $font-size-md;
    color: $color-text-primary;
    letter-spacing: 0.04em;
    outline: none;
    padding: 0;

    &::placeholder {
      color: $color-text-muted;
      font-family: $font-family;
      letter-spacing: normal;
    }

    &.is-invalid {
      color: $color-danger;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }

  &__icon-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    border-radius: $radius-sm;
    color: $color-text-muted;
    background: transparent;
    cursor: pointer;
    transition: color $transition-fast, background $transition-fast;

    &:hover:not(:disabled),
    &.is-active {
      color: $color-accent;
      background: $color-accent-subtle;
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }

  &__totp-wrap {
    position: relative;
  }

  &__totp-popover {
    position: absolute;
    right: 0;
    bottom: calc(100% + 6px);
    z-index: 20;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: $color-bg-elevated;
    border: 1px solid $color-border;
    border-radius: $radius-md;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    white-space: nowrap;

    &::after {
      content: '';
      position: absolute;
      right: 10px;
      bottom: -5px;
      width: 10px;
      height: 10px;
      background: $color-bg-elevated;
      border-right: 1px solid $color-border;
      border-bottom: 1px solid $color-border;
      transform: rotate(45deg);
    }
  }

  &__totp-code {
    border: none;
    background: transparent;
    font-family: $font-family-mono;
    font-size: $font-size-lg;
    font-weight: 700;
    letter-spacing: 0.18em;
    color: $color-text-primary;
    cursor: pointer;
    padding: 0;
    line-height: 1;

    &:hover {
      color: $color-accent;
    }
  }

  &__totp-ring {
    width: 36px;
    height: 36px;
    flex-shrink: 0;

    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  }

  &__totp-ring-track {
    stroke: $color-border;
  }

  &__totp-countdown {
    font-family: $font-family-mono;
    font-size: 10px;
    font-weight: 700;
    fill: $color-text-primary;
  }

  &__status {
    margin: 0;
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__error {
    margin: 0;
    font-size: $font-size-xs;
    color: $color-danger;
  }

  &__file-input {
    display: none;
  }
}
</style>

<style lang="scss">
.extra-auth-field__tip.el-popper {
  padding: 4px 10px;
  font-size: $font-size-xs;
  line-height: 1.4;
  border-radius: $radius-sm;
}
</style>
