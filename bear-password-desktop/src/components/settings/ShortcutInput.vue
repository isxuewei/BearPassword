<template>
  <div class="shortcut-input" :class="{ 'shortcut-input--recording': recording }">
    <button
      type="button"
      class="shortcut-input__trigger"
      :disabled="disabled"
      @click="startRecording"
      @keydown="handleKeydown"
      @blur="stopRecording"
    >
      <span v-if="recording" class="shortcut-input__placeholder">按下快捷键…</span>
      <span v-else class="shortcut-input__value">{{ displayValue }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { formatAccelerator, keyboardEventToAccelerator } from '@/utils/shortcut'
import { normalizeAcceleratorString } from '../../../shared/acceleratorMatch'

const props = defineProps<{
  modelValue: string | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  recorded: [value: string]
}>()

const recording = ref(false)
const platform = ref<NodeJS.Platform>('darwin')

const displayValue = computed(() => formatAccelerator(props.modelValue, platform.value))

onMounted(async () => {
  if (window.windowApi) {
    platform.value = await window.windowApi.getPlatform()
  }
})

function startRecording(): void {
  if (props.disabled) return
  recording.value = true
}

function stopRecording(): void {
  recording.value = false
}

function handleKeydown(event: KeyboardEvent): void {
  if (!recording.value || props.disabled) return

  event.preventDefault()
  event.stopPropagation()

  if (event.key === 'Escape') {
    stopRecording()
    return
  }

  if (event.key === 'Backspace' || event.key === 'Delete') {
    emit('update:modelValue', null)
    emit('recorded', '')
    stopRecording()
    return
  }

  const accelerator = keyboardEventToAccelerator(event)
  if (!accelerator) return

  const normalized = normalizeAcceleratorString(accelerator)
  emit('update:modelValue', normalized)
  emit('recorded', normalized)
  stopRecording()
}
</script>

<style scoped lang="scss">
.shortcut-input {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  &--recording .shortcut-input__trigger {
    border-color: $color-accent;
    box-shadow: 0 0 0 2px $color-accent-subtle;
  }

  &__trigger {
    min-width: 180px;
    height: 40px;
    padding: 0 $spacing-md;
    border: 1px solid $color-border;
    border-radius: $radius-md;
    background: $color-bg-elevated;
    color: $color-text-primary;
    font-size: $font-size-sm;
    cursor: pointer;
    transition: border-color $transition-fast, box-shadow $transition-fast;

    &:hover:not(:disabled) {
      border-color: $color-border-hover;
    }

    &:focus-visible {
      outline: none;
      border-color: $color-accent;
      box-shadow: 0 0 0 2px $color-accent-subtle;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  &__value {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    letter-spacing: 0.02em;
  }

  &__placeholder {
    color: $color-accent;
  }
}
</style>
