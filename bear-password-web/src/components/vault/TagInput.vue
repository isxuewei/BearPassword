<template>
  <div class="tag-input">
    <div class="tag-input__field">
      <div
        class="tag-input__combobox"
        :class="{ 'is-focused': showTagPanel }"
        @click="focusTagInput"
      >
        <span v-for="tag in modelValue" :key="tag" class="tag-input__chip">
          {{ tag }}
          <button
            type="button"
            class="tag-input__chip-remove"
            :aria-label="t('entry.tag.removeAria')"
            @click.stop="removeLabel(tag)"
          >
            ×
          </button>
        </span>
        <input
          ref="labelInputRef"
          v-model="newLabel"
          class="tag-input__inline-input"
          :placeholder="modelValue.length ? t('entry.tag.addPlaceholder') : t('entry.tag.selectOrCreate')"
          type="text"
          @focus="onTagInputFocus"
          @input="showTagPanel = true"
          @keydown.enter.prevent="confirmLabel"
          @keydown.esc.prevent="closeTagPanel"
          @keydown.backspace="onTagBackspace"
          @blur="onLabelInputBlur"
        />
      </div>

      <div
        v-if="showTagPanel && (filteredSuggestions.length || labelsLoaded)"
        class="tag-input__panel"
        @mousedown.prevent
      >
        <button
          v-for="item in filteredSuggestions"
          :key="item"
          type="button"
          class="tag-input__panel-item"
          @mousedown.prevent="selectSuggestion(item)"
        >
          {{ item }}
        </button>
        <p
          v-if="labelsLoaded && newLabel.trim() && !modelValue.includes(newLabel.trim())"
          class="tag-input__panel-hint"
        >
          {{ t('entry.tag.createHint', { name: newLabel.trim() }) }}
        </p>
        <p
          v-else-if="labelsLoaded && !filteredSuggestions.length && !newLabel.trim()"
          class="tag-input__panel-hint"
        >
          {{ t('entry.tag.panelHint') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useVaultStore } from '@/stores/vault'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
const vaultStore = useVaultStore()
const modelValue = defineModel<string[]>({ default: () => [] })

const showTagPanel = ref(false)
const labelsLoaded = ref(false)
const newLabel = ref('')
const allLabels = ref<string[]>([])
const labelInputRef = ref<HTMLInputElement | null>(null)

const filteredSuggestions = computed(() => {
  const keyword = newLabel.value.trim().toLowerCase()
  return allLabels.value
    .filter((label) => !modelValue.value.includes(label))
    .filter((label) => !keyword || label.toLowerCase().includes(keyword))
    .slice(0, 10)
})

onMounted(() => {
  void loadAllLabels()
})

async function loadAllLabels(): Promise<void> {
  try {
    const labels = new Set<string>()
    vaultStore.allEntries.forEach((entry) => {
      entry.passwordLabels?.forEach((label) => {
        if (label.trim()) labels.add(label.trim())
      })
    })
    allLabels.value = [...labels].sort((a, b) => a.localeCompare(b, 'zh-CN'))
  } catch {
    allLabels.value = []
  } finally {
    labelsLoaded.value = true
  }
}

async function onTagInputFocus(): Promise<void> {
  showTagPanel.value = true
  if (!labelsLoaded.value) {
    await loadAllLabels()
  }
}

function focusTagInput(): void {
  labelInputRef.value?.focus()
}

function closeTagPanel(): void {
  newLabel.value = ''
  showTagPanel.value = false
}

function selectSuggestion(label: string): void {
  if (!modelValue.value.includes(label)) {
    modelValue.value = [...modelValue.value, label]
  }
  newLabel.value = ''
  showTagPanel.value = true
  nextTick(() => labelInputRef.value?.focus())
}

function onLabelInputBlur(): void {
  window.setTimeout(() => {
    const value = newLabel.value.trim()
    if (value && !modelValue.value.includes(value)) {
      modelValue.value = [...modelValue.value, value]
    }
    newLabel.value = ''
    showTagPanel.value = false
  }, 120)
}

function confirmLabel(): void {
  const value = newLabel.value.trim()
  if (value && !modelValue.value.includes(value)) {
    modelValue.value = [...modelValue.value, value]
  }
  newLabel.value = ''
  nextTick(() => labelInputRef.value?.focus())
}

function onTagBackspace(event: KeyboardEvent): void {
  if (newLabel.value !== '' || modelValue.value.length === 0) return
  event.preventDefault()
  modelValue.value = modelValue.value.slice(0, -1)
}

function removeLabel(tag: string): void {
  modelValue.value = modelValue.value.filter((item) => item !== tag)
}
</script>

<style scoped lang="scss">
.tag-input {
  flex: 1;
  min-width: 0;

  &__field {
    position: relative;
  }

  &__combobox {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    min-height: 28px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: text;
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    height: 22px;
    padding: 0 4px 0 8px;
    border-radius: 999px;
    font-family: $font-family;
    font-size: $font-size-xs;
    font-weight: 500;
    color: $color-accent;
    background: $color-accent-subtle;
    line-height: 1;
    flex-shrink: 0;
  }

  &__chip-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: $color-accent;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    opacity: 0.75;
    transition: opacity $transition-fast, background $transition-fast;

    &:hover {
      opacity: 1;
      background: rgba(108, 92, 231, 0.15);
    }
  }

  &__inline-input {
    flex: 1 1 72px;
    min-width: 72px;
    border: none;
    background: transparent;
    font-family: $font-family;
    font-size: $font-size-sm;
    color: $color-text-primary;
    outline: none;
    padding: 2px 0;
    height: 24px;

    &::placeholder {
      color: $color-text-muted;
    }
  }

  &__panel {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + 6px);
    z-index: 3000;
    padding: $spacing-xs;
    border-radius: $radius-sm;
    background: $color-bg-elevated;
    border: 1px solid $color-border;
    box-shadow: $shadow-md;
    max-height: 168px;
    overflow-y: auto;
  }

  &__panel-item {
    display: block;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-radius: $radius-sm;
    background: transparent;
    font-family: $font-family;
    font-size: $font-size-sm;
    color: $color-text-primary;
    text-align: left;
    cursor: pointer;
    transition: background $transition-fast, color $transition-fast;

    &:hover {
      background: $color-accent-subtle;
      color: $color-accent;
    }
  }

  &__panel-hint {
    margin: 0;
    padding: 8px 10px;
    font-family: $font-family;
    font-size: $font-size-xs;
    color: $color-text-muted;
    line-height: 1.4;
  }
}
</style>
