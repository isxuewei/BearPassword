import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsDialogStore = defineStore('settingsDialog', () => {
  const visible = ref(false)

  function open(): void {
    visible.value = true
  }

  function close(): void {
    visible.value = false
  }

  return {
    visible,
    open,
    close
  }
})
