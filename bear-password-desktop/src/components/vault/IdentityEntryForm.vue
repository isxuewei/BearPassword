<template>
  <div class="identity-form">
    <div class="identity-form__hero">
      <div class="identity-form__icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="white" stroke-width="1.5"/>
          <circle cx="9" cy="11" r="2" stroke="white" stroke-width="1.5"/>
          <path d="M5 16C5 14 7 13 9 13H15C17 13 19 14 19 16" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <input
        v-model="content.title"
        class="identity-form__title-input"
        :placeholder="t('entry.form.titlePlaceholder')"
        type="text"
        :maxlength="PASSWORD_TITLE_MAX_LENGTH"
      />
    </div>

    <div class="identity-form__card">
      <div class="identity-form__row">
        <label class="identity-form__block-label">{{ t('entry.form.identity.name') }}</label>
        <input
          v-model="content.name"
          class="identity-form__input"
          :placeholder="t('entry.form.identity.namePlaceholder')"
          type="text"
        />
      </div>
      <div class="identity-form__divider" />
      <div class="identity-form__row identity-form__row--secret">
        <label class="identity-form__block-label">{{ t('entry.form.identity.idNumber') }}</label>
        <input
          ref="idNumberInputRef"
          v-model="content.idNumber"
          class="identity-form__input identity-form__input--secret"
          :class="{ 'is-masked': !idNumberRevealed }"
          type="text"
          :placeholder="t('entry.form.identity.idNumberPlaceholder')"
          autocomplete="off"
          @mousedown="onIdNumberMouseDown"
          @blur="idNumberRevealed = false"
        />
      </div>
      <div class="identity-form__divider" />
      <div class="identity-form__row">
        <label class="identity-form__block-label">{{ t('entry.form.identity.birthDate') }}</label>
        <input
          v-model="content.birthDate"
          class="identity-form__input"
          :placeholder="t('entry.form.identity.birthDatePlaceholder')"
          type="text"
        />
      </div>
      <div class="identity-form__divider" />
      <div class="identity-form__row">
        <label class="identity-form__block-label">{{ t('entry.form.identity.lunarBirthday') }}</label>
        <input
          v-model="content.lunarBirthday"
          class="identity-form__input"
          :placeholder="t('entry.form.identity.lunarBirthdayPlaceholder')"
          type="text"
        />
      </div>
      <div class="identity-form__divider" />
      <div class="identity-form__row">
        <label class="identity-form__block-label">{{ t('entry.form.identity.phone') }}</label>
        <input
          v-model="content.phone"
          class="identity-form__input"
          :placeholder="t('entry.form.identity.phonePlaceholder')"
          type="text"
        />
      </div>
      <div class="identity-form__divider" />
      <div class="identity-form__row identity-form__row--address">
        <label class="identity-form__block-label">{{ t('entry.form.identity.address') }}</label>
        <textarea
          v-model="content.address"
          class="identity-form__address"
          :placeholder="t('entry.form.identity.addressPlaceholder')"
          rows="2"
        />
      </div>
    </div>

    <div class="identity-form__card identity-form__card--soft identity-form__card--extras">
      <div class="identity-form__extras-header">
        <button type="button" class="identity-form__add-link" @click="addExtraField">
          <span>+</span> {{ t('entry.form.addMore') }}
        </button>
      </div>

      <div v-if="content.extraFields.length" class="identity-form__extras">
        <div
          v-for="(field, index) in content.extraFields"
          :key="index"
          class="identity-form__extra-item"
        >
          <div v-if="index > 0" class="identity-form__divider" />
          <div class="identity-form__extra-header">
            <input
              v-model="field.label"
              class="identity-form__extra-title"
              :placeholder="t('entry.form.fieldTitle')"
              type="text"
            />
            <button
              type="button"
              class="identity-form__remove"
              :aria-label="t('entry.form.removeField')"
              @click="removeExtraField(index)"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.2"/>
                <path d="M5 8H11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <textarea
            v-model="field.value"
            class="identity-form__extra-value"
            :placeholder="t('entry.form.fieldContent')"
            rows="1"
          />
        </div>
      </div>
    </div>

    <div class="identity-form__card identity-form__card--soft identity-form__card--remark">
      <label class="identity-form__block-label">{{ t('entry.form.remark') }}</label>
      <textarea
        :value="remark"
        class="identity-form__textarea"
        :placeholder="t('entry.form.remarkPlaceholder')"
        rows="2"
        :maxlength="PASSWORD_REMARK_MAX_LENGTH"
        @input="onRemarkInput"
      />
    </div>

    <div class="identity-form__card identity-form__card--soft identity-form__card--tags">
      <label class="identity-form__block-label">{{ t('entry.form.tags') }}</label>
      <TagInput v-model="labelsModel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import TagInput from '@/components/vault/TagInput.vue'
import { PASSWORD_REMARK_MAX_LENGTH, PASSWORD_TITLE_MAX_LENGTH } from '@/constants/vaultFieldLimits'
import { useI18n } from '@/composables/useI18n'
import type { IdentityContent } from '@/types'

const props = defineProps<{
  content: IdentityContent
  remark: string
  labels: string[]
}>()

const emit = defineEmits<{
  'update:remark': [value: string]
  'update:labels': [value: string[]]
}>()

const { t } = useI18n()
const idNumberRevealed = ref(false)
const idNumberInputRef = ref<HTMLInputElement | null>(null)

const labelsModel = computed({
  get: () => props.labels,
  set: (value: string[]) => emit('update:labels', value)
})

function addExtraField(): void {
  props.content.extraFields.push({ label: '', value: '' })
}

function removeExtraField(index: number): void {
  props.content.extraFields.splice(index, 1)
}

function onRemarkInput(event: Event): void {
  emit('update:remark', (event.target as HTMLTextAreaElement).value)
}

function onIdNumberMouseDown(event: MouseEvent): void {
  event.preventDefault()
  void revealAndCopyIdNumber()
}

async function revealAndCopyIdNumber(): Promise<void> {
  idNumberRevealed.value = true
  await nextTick()

  const input = idNumberInputRef.value
  if (!input) return

  input.focus()
  const value = props.content.idNumber
  if (!value) return

  input.setSelectionRange(0, value.length)

  const copied = await copyText(value, input)
  if (copied) {
    ElMessage.success({ message: t('entry.msg.idNumberCopied'), duration: 1500 })
  } else {
    ElMessage.warning({ message: t('entry.msg.copyFailed'), duration: 1500 })
  }
}

async function copyText(text: string, input: HTMLInputElement): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fallback below
  }

  input.setSelectionRange(0, text.length)
  return document.execCommand('copy')
}
</script>

<style scoped lang="scss">
.identity-form {
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
    background: linear-gradient(135deg, #06d6a0, #059669);
    box-shadow: 0 4px 12px rgba(6, 214, 160, 0.28);
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
      overflow: hidden;
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

  &__address {
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
