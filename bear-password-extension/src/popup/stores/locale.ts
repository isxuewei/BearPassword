import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { applyResolvedLocale } from '@/shared/locale/locale'
import {
  initLocaleOnBoot,
  DEFAULT_LOCALE_PREFERENCE,
  resolveLocale,
  setLocalePreference,
  subscribeSystemLocaleChange
} from '@/shared/locale/localePreference'
import type { LocalePreference, ResolvedLocale } from '@/locales/types'

export const useLocaleStore = defineStore('locale', () => {
  const preference = ref<LocalePreference>(DEFAULT_LOCALE_PREFERENCE)
  let unsubscribeSystem: (() => void) | null = null

  const resolvedLocale = computed<ResolvedLocale>(() => resolveLocale(preference.value))


  async function init(): Promise<void> {
    preference.value = await initLocaleOnBoot()
    unsubscribeSystem?.()
    unsubscribeSystem = subscribeSystemLocaleChange(() => {
      if (preference.value === 'system') {
        applyResolvedLocale(resolveLocale('system'))
      }
    })
  }

  async function updatePreference(value: LocalePreference): Promise<void> {
    preference.value = value
    await setLocalePreference(value)
  }

  return {
    preference,
    resolvedLocale,
    init,
    updatePreference
  }
})
