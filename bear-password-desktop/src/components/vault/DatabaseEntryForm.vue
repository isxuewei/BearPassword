<template>
  <div class="database-form">
    <div class="database-form__hero">
      <div class="database-form__icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="6" rx="8" ry="3" stroke="white" stroke-width="1.5"/>
          <path d="M4 6V18C4 19.66 7.58 21 12 21C16.42 21 20 19.66 20 18V6" stroke="white" stroke-width="1.5"/>
          <path d="M4 12C4 13.66 7.58 15 12 15C16.42 15 20 13.66 20 12" stroke="white" stroke-width="1.5"/>
        </svg>
      </div>
      <input
        v-model="content.title"
        class="database-form__title-input"
        :placeholder="t('entry.form.titlePlaceholder')"
        type="text"
        :maxlength="PASSWORD_TITLE_MAX_LENGTH"
      />
    </div>

    <div class="database-form__card">
      <div class="database-form__row">
        <label class="database-form__block-label">{{ t('entry.form.database.dbType') }}</label>
        <input
          v-model="content.dbType"
          class="database-form__input"
          :placeholder="t('entry.form.database.dbTypePlaceholder')"
          type="text"
        />
      </div>
      <div class="database-form__divider" />
      <div class="database-form__row">
        <label class="database-form__block-label">{{ t('entry.form.database.host') }}</label>
        <input
          v-model="content.host"
          class="database-form__input database-form__input--mono"
          :placeholder="t('entry.form.database.hostPlaceholder')"
          type="text"
        />
      </div>
      <div class="database-form__divider" />
      <div class="database-form__row">
        <label class="database-form__block-label">{{ t('entry.form.database.port') }}</label>
        <input
          v-model="content.port"
          class="database-form__input database-form__input--mono"
          :placeholder="t('entry.form.database.portPlaceholder')"
          type="text"
        />
      </div>
      <div class="database-form__divider" />
      <div class="database-form__row">
        <label class="database-form__block-label">{{ t('entry.form.database.databaseName') }}</label>
        <input
          v-model="content.databaseName"
          class="database-form__input"
          :placeholder="t('entry.form.database.databaseNamePlaceholder')"
          type="text"
        />
      </div>
      <div class="database-form__divider" />
      <div class="database-form__row">
        <label class="database-form__block-label">{{ t('entry.form.database.username') }}</label>
        <input
          v-model="content.username"
          class="database-form__input"
          :placeholder="t('entry.form.database.usernamePlaceholder')"
          type="text"
        />
      </div>
      <div class="database-form__divider" />
      <div class="database-form__row database-form__row--secret">
        <label class="database-form__block-label">{{ t('entry.form.database.password') }}</label>
        <input
          ref="passwordInputRef"
          v-model="content.password"
          class="database-form__input database-form__input--secret"
          :class="{ 'is-masked': !passwordRevealed }"
          type="text"
          :placeholder="t('entry.form.database.passwordPlaceholder')"
          autocomplete="off"
          @mousedown="onPasswordMouseDown"
          @blur="passwordRevealed = false"
        />
      </div>
    </div>

    <div class="database-form__card database-form__card--soft database-form__card--extras">
      <div class="database-form__extras-header">
        <button type="button" class="database-form__add-link" @click="addExtraField">
          <span>+</span> {{ t('entry.form.addMore') }}
        </button>
      </div>

      <div v-if="content.extraFields.length" class="database-form__extras">
        <div
          v-for="(field, index) in content.extraFields"
          :key="index"
          class="database-form__extra-item"
        >
          <div v-if="index > 0" class="database-form__divider" />
          <div class="database-form__extra-header">
            <input
              v-model="field.label"
              class="database-form__extra-title"
              :placeholder="t('entry.form.fieldTitle')"
              type="text"
            />
            <button
              type="button"
              class="database-form__remove"
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
            class="database-form__extra-value"
            :placeholder="t('entry.form.fieldContent')"
            rows="1"
          />
        </div>
      </div>
    </div>

    <div class="database-form__card database-form__card--soft database-form__card--remark">
      <label class="database-form__block-label">{{ t('entry.form.remark') }}</label>
      <textarea
        :value="remark"
        class="database-form__textarea"
        :placeholder="t('entry.form.remarkPlaceholder')"
        rows="2"
        :maxlength="PASSWORD_REMARK_MAX_LENGTH"
        @input="onRemarkInput"
      />
    </div>

    <div class="database-form__card database-form__card--soft database-form__card--tags">
      <label class="database-form__block-label">{{ t('entry.form.tags') }}</label>
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
import type { DatabaseContent } from '@/types'

const props = defineProps<{
  content: DatabaseContent
  remark: string
  labels: string[]
}>()

const emit = defineEmits<{
  'update:remark': [value: string]
  'update:labels': [value: string[]]
}>()

const { t } = useI18n()
const passwordRevealed = ref(false)
const passwordInputRef = ref<HTMLInputElement | null>(null)

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

function onPasswordMouseDown(event: MouseEvent): void {
  event.preventDefault()
  void revealAndCopyPassword()
}

async function revealAndCopyPassword(): Promise<void> {
  passwordRevealed.value = true
  await nextTick()

  const input = passwordInputRef.value
  if (!input) return

  input.focus()
  const password = props.content.password
  if (!password) return

  input.setSelectionRange(0, password.length)

  const copied = await copyText(password, input)
  if (copied) {
    ElMessage.success({ message: t('entry.msg.passwordCopied'), duration: 1500 })
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
.database-form {
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
    background: linear-gradient(135deg, #5e60ce, #4361ee);
    box-shadow: 0 4px 12px rgba(94, 96, 206, 0.28);
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
    &--mono {
      font-family: $font-family-mono;
      letter-spacing: 0.03em;
    }

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
