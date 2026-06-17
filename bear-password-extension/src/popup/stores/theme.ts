import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { resolveAppearanceFromDesktop } from '@/shared/appearance/desktopAppearance'
import type { DesktopConnectionState } from '@/shared/types'
import {
  DEFAULT_THEME_PREFERENCE,
  resolveTheme,
  applyResolvedTheme,
  subscribeSystemThemeChange,
  type ThemePreference,
  type ResolvedTheme
} from '@/shared/theme/theme'

export const useThemeStore = defineStore('theme', () => {
  const preference = ref<ThemePreference>(DEFAULT_THEME_PREFERENCE)
  let unsubscribeSystem: (() => void) | null = null

  const resolvedTheme = computed<ResolvedTheme>(() => resolveTheme(preference.value))

  function applyPreference(value: ThemePreference): void {
    preference.value = value
    applyResolvedTheme(resolveTheme(value))
  }

  async function init(): Promise<void> {
    applyPreference(DEFAULT_THEME_PREFERENCE)
    unsubscribeSystem?.()
    unsubscribeSystem = subscribeSystemThemeChange(() => {
      if (preference.value === 'system') {
        applyResolvedTheme(resolveTheme('system'))
      }
    })
  }

  function syncFromDesktop(state: DesktopConnectionState | null): void {
    const { theme } = resolveAppearanceFromDesktop(state)
    if (theme !== preference.value) {
      applyPreference(theme)
    } else if (theme === 'system') {
      applyResolvedTheme(resolveTheme('system'))
    }
  }

  return {
    preference,
    resolvedTheme,
    init,
    syncFromDesktop
  }
})
