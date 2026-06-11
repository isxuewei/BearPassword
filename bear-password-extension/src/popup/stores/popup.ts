import { defineStore } from 'pinia'
import { ref } from 'vue'

export type PopupPage = 'vault' | 'settings'

export const usePopupStore = defineStore('popup', () => {
  const page = ref<PopupPage>('vault')

  function openSettings(): void {
    page.value = 'settings'
  }

  function openVault(): void {
    page.value = 'vault'
  }

  function reset(): void {
    page.value = 'vault'
  }

  return { page, openSettings, openVault, reset }
})
