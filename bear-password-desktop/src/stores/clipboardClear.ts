import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  CLIPBOARD_CLEAR_OPTIONS,
  DEFAULT_CLIPBOARD_CLEAR_SECONDS,
  type ClipboardClearSeconds
} from '@/types/clipboardClear'
import { storage } from '@/utils/storage'

const STORAGE_KEY = 'clipboard_clear_seconds'

function normalizeClipboardClearSeconds(value: unknown): ClipboardClearSeconds {
  const seconds = Number(value)
  return CLIPBOARD_CLEAR_OPTIONS.includes(seconds as ClipboardClearSeconds)
    ? (seconds as ClipboardClearSeconds)
    : DEFAULT_CLIPBOARD_CLEAR_SECONDS
}

export const useClipboardClearStore = defineStore('clipboardClear', () => {
  const clearSeconds = ref<ClipboardClearSeconds>(
    normalizeClipboardClearSeconds(storage.get<number>(STORAGE_KEY, DEFAULT_CLIPBOARD_CLEAR_SECONDS))
  )

  function setClearSeconds(seconds: ClipboardClearSeconds): void {
    clearSeconds.value = normalizeClipboardClearSeconds(seconds)
    storage.set(STORAGE_KEY, clearSeconds.value)
  }

  return {
    clearSeconds,
    setClearSeconds
  }
})
