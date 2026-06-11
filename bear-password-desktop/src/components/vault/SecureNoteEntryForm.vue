<template>
  <div class="secure-note-form">
    <!-- 图标 + 标题 -->
    <div class="secure-note-form__hero">
      <div class="secure-note-form__icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="3" width="14" height="18" rx="2" stroke="white" stroke-width="1.5"/>
          <path d="M8 7H16M8 11H16M8 15H13" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <input
        v-model="content.title"
        class="secure-note-form__title-input"
        :placeholder="t('entry.form.titlePlaceholder')"
        type="text"
      />
    </div>

    <!-- 备注正文 -->
    <div class="secure-note-form__card secure-note-form__card--body">
      <textarea
        v-model="content.body"
        class="secure-note-form__body"
        :placeholder="t('entry.form.remarkPlaceholder')"
        rows="6"
      />
    </div>

    <!-- 自定义字段 -->
    <div class="secure-note-form__card secure-note-form__card--soft secure-note-form__card--extras">
      <div class="secure-note-form__extras-header">
        <button type="button" class="secure-note-form__add-link" @click="addExtraField">
          <span>+</span> {{ t('entry.form.addMore') }}
        </button>
      </div>

      <div v-if="content.extraFields.length" class="secure-note-form__extras">
        <div
          v-for="(field, index) in content.extraFields"
          :key="index"
          class="secure-note-form__extra-item"
        >
          <div v-if="index > 0" class="secure-note-form__divider" />
          <div class="secure-note-form__extra-header">
            <input
              v-model="field.label"
              class="secure-note-form__extra-title"
              :placeholder="t('entry.form.fieldTitle')"
              type="text"
            />
            <button
              type="button"
              class="secure-note-form__remove"
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
            class="secure-note-form__extra-value"
            :placeholder="t('entry.form.fieldContent')"
            rows="1"
          />
        </div>
      </div>
    </div>

    <!-- 标签 -->
    <div class="secure-note-form__card secure-note-form__card--soft secure-note-form__card--tags">
      <label class="secure-note-form__block-label">{{ t('entry.form.tags') }}</label>
      <TagInput v-model="labelsModel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TagInput from '@/components/vault/TagInput.vue'
import { useI18n } from '@/composables/useI18n'
import type { SecureNoteContent } from '@/types'

const props = defineProps<{
  content: SecureNoteContent
  labels: string[]
}>()

const emit = defineEmits<{
  'update:labels': [value: string[]]
}>()

const { t } = useI18n()

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
</script>

<style scoped lang="scss">
.secure-note-form {
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
    background: linear-gradient(135deg, #f4a261, #e76f51);
    box-shadow: 0 4px 12px rgba(244, 162, 97, 0.28);
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

    &--body {
      padding: $spacing-sm $spacing-md;
    }

    &--tags {
      position: relative;
      z-index: 2;
      padding: $spacing-sm $spacing-md;
      overflow: visible;
    }

    &--extras {
      padding: 0;
      overflow: hidden;
    }
  }

  &__body {
    width: 100%;
    border: none;
    background: transparent;
    resize: none;
    font-family: $font-family;
    font-size: $font-size-md;
    color: $color-text-primary;
    line-height: 1.6;
    outline: none;
    min-height: 140px;
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

  @include vault-entry-form-layout;

  &__divider {
    height: 1px;
    background: $color-border;
    margin: 0 $spacing-md;
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

}
</style>
