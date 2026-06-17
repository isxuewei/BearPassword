import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { resolveAppearanceFromDesktop } from '@/shared/appearance/desktopAppearance'
import type { DesktopConnectionState } from '@/shared/types'
import { applyResolvedLocale, resolveLocale, subscribeSystemLocaleChange } from '@/shared/locale/locale'
import { DEFAULT_LOCALE_PREFERENCE } from '@/shared/locale/localePreference'
import type { LocalePreference, ResolvedLocale } from '@/locales/types'

export const useLocaleStore = defineStore('locale', () => {
  const preference = ref<LocalePreference>(DEFAULT_LOCALE_PREFERENCE)
  let unsubscribeSystem: (() => void) | null = null

  const resolvedLocale = computed<ResolvedLocale>(() => resolveLocale(preference.value))

  function applyPreference(value: LocalePreference): void {
    preference.value = value
    applyResolvedLocale(resolveLocale(value))
  }

  async function init(): Promise<void> {
    applyPreference(DEFAULT_LOCALE_PREFERENCE)
    unsubscribeSystem?.()
    unsubscribeSystem = subscribeSystemLocaleChange(() => {
      if (preference.value === 'system') {
        applyResolvedLocale(resolveLocale('system'))
      }
    })
  }

  function syncFromDesktop(state: DesktopConnectionState | null): void {
    const { locale } = resolveAppearanceFromDesktop(state)
    if (locale !== preference.value) {
      applyPreference(locale)
    } else if (locale === 'system') {
      applyResolvedLocale(resolveLocale('system'))
    }
  }

  return {
    preference,
    resolvedLocale,
    init,
    syncFromDesktop
  }
})
