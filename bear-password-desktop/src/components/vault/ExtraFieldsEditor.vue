<template>
  <div class="extra-fields-editor">
    <div class="extra-fields-editor__header">
      <ExtraFieldAddMenu @add="addExtraField" />
    </div>

    <div v-if="fields.length" class="extra-fields-editor__list">
      <div
        v-for="(field, index) in fields"
        :key="index"
        class="extra-fields-editor__item"
      >
        <div v-if="index > 0" class="extra-fields-editor__divider" />
        <div class="extra-fields-editor__item-header">
          <input
            v-model="field.label"
            class="extra-fields-editor__title"
            :placeholder="t('entry.form.fieldTitle')"
            type="text"
          />
          <button
            type="button"
            class="extra-fields-editor__remove"
            :aria-label="t('entry.form.removeField')"
            @click="removeExtraField(index)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.2"/>
              <path d="M5 8H11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <ExtraAuthenticatorFieldEditor
          v-if="isAuthenticatorExtraField(field)"
          :field="field"
        />
        <textarea
          v-else
          v-model="field.value"
          class="extra-fields-editor__value"
          :class="{ 'extra-fields-editor__value--secret': isSecretExtraField(field) }"
          :placeholder="t('entry.form.fieldContent')"
          rows="1"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ExtraAuthenticatorFieldEditor from '@/components/vault/ExtraAuthenticatorFieldEditor.vue'
import ExtraFieldAddMenu from '@/components/vault/ExtraFieldAddMenu.vue'
import type { ExtraFieldTypeId } from '@/constants/extraFieldTypes'
import { useI18n } from '@/composables/useI18n'
import type { LoginExtraField } from '@/types'
import {
  addExtraFieldByType,
  isAuthenticatorExtraField,
  isSecretExtraField
} from '@/utils/extraField'

const props = defineProps<{
  fields: LoginExtraField[]
}>()

const { t } = useI18n()

function addExtraField(type: ExtraFieldTypeId): void {
  addExtraFieldByType(props.fields, type)
}

function removeExtraField(index: number): void {
  props.fields.splice(index, 1)
}
</script>

<style scoped lang="scss">
.extra-fields-editor {
  &__header {
    padding: $spacing-xs $spacing-md;
  }

  &__list {
    border-top: 1px solid $color-border;
  }

  &__item {
    padding: $spacing-xs $spacing-md;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__divider {
    height: 1px;
    background: $color-border;
    margin: 0 0 $spacing-xs;
  }

  &__item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-sm;
  }

  &__title {
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

  &__value {
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
}
</style>
