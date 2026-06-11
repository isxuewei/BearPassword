import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  initThemeOnBoot,
  resolveTheme,
  setThemePreference,
  subscribeSystemThemeChange,
  type ThemePreference,
  type ResolvedTheme
} from '@/shared/theme/theme'

export const useThemeStore = defineStore('theme', () => {
  const preference = ref<ThemePreference>('earth')
  let unsubscribeSystem: (() => void) | null = null

  const resolvedTheme = computed<ResolvedTheme>(() => resolveTheme(preference.value))

  async function init(): Promise<void> {
    preference.value = await initThemeOnBoot()
    unsubscribeSystem?.()
    unsubscribeSystem = subscribeSystemThemeChange(() => {
      if (preference.value === 'system') {
        void setThemePreference('system')
      }
    })
  }

  async function updatePreference(value: ThemePreference): Promise<void> {
    preference.value = value
    await setThemePreference(value)
  }

  return {
    preference,
    resolvedTheme,
    init,
    updatePreference
  }
})
