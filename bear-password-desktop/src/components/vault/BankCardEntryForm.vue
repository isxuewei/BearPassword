<template>
  <div class="bank-card-form">
    <div class="bank-card-form__hero">
      <div class="bank-card-form__icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="5" width="20" height="14" rx="2" stroke="white" stroke-width="1.5"/>
          <path d="M2 10H22" stroke="white" stroke-width="1.5"/>
          <rect x="5" y="14" width="6" height="2" rx="1" fill="white"/>
        </svg>
      </div>
      <input
        v-model="content.title"
        class="bank-card-form__title-input"
        :placeholder="t('entry.form.titlePlaceholder')"
        type="text"
        :maxlength="PASSWORD_TITLE_MAX_LENGTH"
      />
    </div>

    <div class="bank-card-form__card">
      <div class="bank-card-form__row">
        <label class="bank-card-form__block-label">{{ t('entry.form.bankCard.bankName') }}</label>
        <input
          v-model="content.bankName"
          class="bank-card-form__input"
          :placeholder="t('entry.form.bankCard.bankNamePlaceholder')"
          type="text"
        />
      </div>
      <div class="bank-card-form__divider" />
      <div class="bank-card-form__row">
        <label class="bank-card-form__block-label">{{ t('entry.form.bankCard.cardHolder') }}</label>
        <input
          v-model="content.cardHolder"
          class="bank-card-form__input"
          :placeholder="t('entry.form.bankCard.cardHolderPlaceholder')"
          type="text"
        />
      </div>
      <div class="bank-card-form__divider" />
      <div class="bank-card-form__row bank-card-form__row--secret">
        <label class="bank-card-form__block-label">{{ t('entry.form.bankCard.cardNumber') }}</label>
        <input
          ref="cardNumberInputRef"
          v-model="content.cardNumber"
          class="bank-card-form__input bank-card-form__input--secret"
          :class="{ 'is-masked': !cardNumberRevealed }"
          type="text"
          :placeholder="t('entry.form.bankCard.cardNumberPlaceholder')"
          autocomplete="off"
          @mousedown="onSecretMouseDown($event, 'cardNumber')"
          @blur="cardNumberRevealed = false"
        />
      </div>
      <div class="bank-card-form__divider" />
      <div class="bank-card-form__row">
        <label class="bank-card-form__block-label">{{ t('entry.form.bankCard.expiry') }}</label>
        <input
          v-model="content.expiry"
          class="bank-card-form__input"
          :placeholder="t('entry.form.bankCard.expiryPlaceholder')"
          type="text"
        />
      </div>
      <div class="bank-card-form__divider" />
      <div class="bank-card-form__row bank-card-form__row--secret">
        <label class="bank-card-form__block-label">{{ t('entry.form.bankCard.cvv') }}</label>
        <input
          ref="cvvInputRef"
          v-model="content.cvv"
          class="bank-card-form__input bank-card-form__input--secret"
          :class="{ 'is-masked': !cvvRevealed }"
          type="text"
          :placeholder="t('entry.form.bankCard.cvvPlaceholder')"
          autocomplete="off"
          @mousedown="onSecretMouseDown($event, 'cvv')"
          @blur="cvvRevealed = false"
        />
      </div>
    </div>

    <div class="bank-card-form__card bank-card-form__card--soft bank-card-form__card--extras">
      <ExtraFieldsEditor :fields="content.extraFields" />
    </div>

    <div class="bank-card-form__card bank-card-form__card--soft bank-card-form__card--remark">
      <label class="bank-card-form__block-label">{{ t('entry.form.remark') }}</label>
      <textarea
        :value="remark"
        class="bank-card-form__textarea"
        :placeholder="t('entry.form.remarkPlaceholder')"
        rows="2"
        :maxlength="PASSWORD_REMARK_MAX_LENGTH"
        @input="onRemarkInput"
      />
    </div>

    <div class="bank-card-form__card bank-card-form__card--soft bank-card-form__card--tags">
      <label class="bank-card-form__block-label">{{ t('entry.form.tags') }}</label>
      <TagInput v-model="labelsModel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import TagInput from '@/components/vault/TagInput.vue'
import ExtraFieldsEditor from '@/components/vault/ExtraFieldsEditor.vue'
import { PASSWORD_REMARK_MAX_LENGTH, PASSWORD_TITLE_MAX_LENGTH } from '@/constants/vaultFieldLimits'
import { useI18n } from '@/composables/useI18n'
import type { BankCardContent } from '@/types'
import { appendClipboardClearHint, copySensitiveText } from '@/utils/sensitiveClipboard'

const props = defineProps<{
  content: BankCardContent
  remark: string
  labels: string[]
}>()

const emit = defineEmits<{
  'update:remark': [value: string]
  'update:labels': [value: string[]]
}>()

const { t } = useI18n()
const cardNumberRevealed = ref(false)
const cvvRevealed = ref(false)
const cardNumberInputRef = ref<HTMLInputElement | null>(null)
const cvvInputRef = ref<HTMLInputElement | null>(null)

const labelsModel = computed({
  get: () => props.labels,
  set: (value: string[]) => emit('update:labels', value)
})

function onRemarkInput(event: Event): void {
  emit('update:remark', (event.target as HTMLTextAreaElement).value)
}

function onSecretMouseDown(event: MouseEvent, field: 'cardNumber' | 'cvv'): void {
  event.preventDefault()
  void revealAndCopySecret(field)
}

async function revealAndCopySecret(field: 'cardNumber' | 'cvv'): Promise<void> {
  const isCardNumber = field === 'cardNumber'
  if (isCardNumber) {
    cardNumberRevealed.value = true
  } else {
    cvvRevealed.value = true
  }

  await nextTick()

  const input = isCardNumber ? cardNumberInputRef.value : cvvInputRef.value
  const value = isCardNumber ? props.content.cardNumber : props.content.cvv
  if (!input) return

  input.focus()
  if (!value) return

  input.setSelectionRange(0, value.length)

  const copied = await copyText(value, input)
  if (copied) {
    ElMessage.success({
      message: appendClipboardClearHint(
        isCardNumber ? t('entry.msg.cardNumberCopied') : t('entry.msg.cvvCopied'),
        t
      ),
      duration: 1500
    })
  } else {
    ElMessage.warning({ message: t('entry.msg.copyFailed'), duration: 1500 })
  }
}

async function copyText(text: string, input: HTMLInputElement): Promise<boolean> {
  const copied = await copySensitiveText(text)
  if (copied) return true

  input.setSelectionRange(0, text.length)
  return document.execCommand('copy')
}
</script>

<style scoped lang="scss">
.bank-card-form {
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
    background: linear-gradient(135deg, #4ea8de, #277da1);
    box-shadow: 0 4px 12px rgba(78, 168, 222, 0.28);
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
    padding: 0;
    overflow: hidden;
    border-radius: $radius-md;
    background: $color-bg-elevated;

    &--soft {
      background: $color-bg-secondary;
      box-shadow: none;
      border-color: $color-border;
    }

    &--remark,
    &--tags {
      padding: $spacing-sm $spacing-md;
    }

    &--tags {
      position: relative;
      z-index: 2;
      overflow: visible;
    }

    &--extras {
      padding: 0;
      overflow: visible;
    }
  }

  @include vault-entry-form-layout;

  &__divider {
    height: 1px;
    background: $color-border;
    margin: 0 $spacing-md;
  }

  &__input {
    &--secret {
      font-family: $font-family-mono;
      letter-spacing: 0.05em;
      cursor: pointer;

      &.is-masked {
        -webkit-text-security: disc;
        text-security: disc;
      }
    }
  }

  &__extras-header {
    padding: $spacing-xs $spacing-md;
  }

  &__extras {
    border-top: 1px solid $color-border;
  }

  &__extra-item {
    padding: $spacing-xs $spacing-md;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__extra-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-sm;
  }

  &__extra-title {
    flex: 1;
    border: none;
    background: transparent;
    font-family: $font-family;
    font-size: $font-size-sm;
    font-weight: 500;
    color: $color-text-secondary;
    outline: none;
    min-width: 0;

    &::placeholder {
      color: $color-text-muted;
    }
  }

  &__extra-value {
    width: 100%;
    border: none;
    background: transparent;
    resize: none;
    font-family: $font-family;
    font-size: $font-size-md;
    color: $color-text-primary;
    line-height: 1.5;
    outline: none;
    min-height: 28px;
    padding: 0;

    &::placeholder {
      color: $color-text-muted;
    }
  }

  &__remove {
    flex-shrink: 0;
    color: $color-danger;
    opacity: 0.75;
    padding: 4px;
    border-radius: 50%;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: opacity $transition-fast, background $transition-fast;

    &:hover {
      opacity: 1;
      background: rgba(255, 77, 79, 0.08);
    }
  }

  &__add-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: $font-family;
    font-size: $font-size-sm;
    color: $color-accent;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 0;
    transition: color $transition-fast;

    span {
      font-size: $font-size-md;
      line-height: 1;
    }

    &:hover {
      color: $color-accent-hover;
    }
  }

  &__textarea {
    width: 100%;
    border: none;
    background: transparent;
    resize: none;
    font-family: $font-family;
    font-size: $font-size-md;
    color: $color-text-primary;
    line-height: 1.5;
    outline: none;
    min-height: 48px;
    padding: 0;

    &::placeholder {
      color: $color-text-muted;
    }
  }
}
</style>
