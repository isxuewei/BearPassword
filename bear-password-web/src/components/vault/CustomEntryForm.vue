<template>
  <div class="custom-form">
    <div class="custom-form__hero">
      <div class="custom-form__icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="3" stroke="white" stroke-width="1.5"/>
          <path d="M12 8V16M8 12H16" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <input
        v-model="content.title"
        class="custom-form__title-input"
        :placeholder="t('entry.form.titlePlaceholder')"
        type="text"
        :maxlength="PASSWORD_TITLE_MAX_LENGTH"
      />
    </div>

    <div class="custom-form__card custom-form__card--soft custom-form__card--fields">
      <div class="custom-form__fields-header">
        <ExtraFieldAddMenu @add="addField" />
      </div>

      <div v-if="content.fields.length" class="custom-form__fields">
        <div
          v-for="(field, index) in content.fields"
          :key="index"
          class="custom-form__field-item"
        >
          <div v-if="index > 0" class="custom-form__divider" />
          <div class="custom-form__field-header">
            <input
              v-model="field.label"
              class="custom-form__field-title"
              :placeholder="t('entry.form.fieldTitle')"
              type="text"
            />
            <button
              type="button"
              class="custom-form__remove"
              :aria-label="t('entry.form.removeField')"
              @click="removeField(index)"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.2"/>
                <path d="M5 8H11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <textarea
            v-model="field.value"
            class="custom-form__field-value"
            :class="{ 'custom-form__field-value--secret': isSecretField(field) }"
            :placeholder="t('entry.form.fieldContent')"
            rows="1"
          />
        </div>
      </div>
    </div>

    <div class="custom-form__card custom-form__card--soft custom-form__card--remark">
      <label class="custom-form__block-label">{{ t('entry.form.remark') }}</label>
      <textarea
        :value="remark"
        class="custom-form__textarea"
        :placeholder="t('entry.form.remarkPlaceholder')"
        rows="2"
        :maxlength="PASSWORD_REMARK_MAX_LENGTH"
        @input="onRemarkInput"
      />
    </div>

    <div class="custom-form__card custom-form__card--soft custom-form__card--tags">
      <label class="custom-form__block-label">{{ t('entry.form.tags') }}</label>
      <TagInput v-model="labelsModel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TagInput from '@/components/vault/TagInput.vue'
import ExtraFieldAddMenu from '@/components/vault/ExtraFieldAddMenu.vue'
import { PASSWORD_REMARK_MAX_LENGTH, PASSWORD_TITLE_MAX_LENGTH } from '@/constants/vaultFieldLimits'
import type { ExtraFieldTypeId } from '@/constants/extraFieldTypes'
import { useI18n } from '@/composables/useI18n'
import type { CustomContent } from '@/types'
import { addExtraFieldByType, isSecretExtraField } from '@/utils/extraField'

const props = defineProps<{
  content: CustomContent
  remark: string
  labels: string[]
}>()

const emit = defineEmits<{
  'update:remark': [value: string]
  'update:labels': [value: string[]]
}>()

const { t } = useI18n()

const labelsModel = computed({
  get: () => props.labels,
  set: (value: string[]) => emit('update:labels', value)
})

function addField(type: ExtraFieldTypeId): void {
  addExtraFieldByType(props.content.fields, type)
}

function removeField(index: number): void {
  props.content.fields.splice(index, 1)
}

function isSecretField(label: string): boolean {
  return isSecretExtraFieldLabel(label)
}

function onRemarkInput(event: Event): void {
  emit('update:remark', (event.target as HTMLTextAreaElement).value)
}
</script>

<style scoped lang="scss">
.custom-form {
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
    background: linear-gradient(135deg, #9b5de5, #7209b7);
    box-shadow: 0 4px 12px rgba(155, 93, 229, 0.28);
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

    &--fields {
      padding: 0;
      overflow: hidden;
    }
  }

  &__divider {
    height: 1px;
    background: $color-border;
    margin: 0 $spacing-md;
  }

  @include vault-entry-form-layout;

  &__fields-header {
    padding: $spacing-xs $spacing-md;
  }

  &__fields {
    border-top: 1px solid $color-border;
  }

  &__field-item {
    padding: $spacing-xs $spacing-md;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__field-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-sm;
  }

  &__field-title {
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

  &__field-value {
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

    &--secret {
      font-family: $font-family-mono;
      letter-spacing: 0.05em;
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
