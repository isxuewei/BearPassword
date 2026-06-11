import type { LocalePreference } from '@/locales/types'
import {
  applyResolvedLocale,
  normalizeLocalePreference,
  resolveLocale
} from '@/shared/locale/locale'
import { loadLocalePreference, saveLocalePreference } from '@/shared/storage/locale'

export {
  LOCALE_PREFERENCE_OPTIONS,
  normalizeLocalePreference,
  resolveLocale,
  subscribeSystemLocaleChange,
  syncSystemLocale
} from '@/shared/locale/locale'

export async function initLocaleOnBoot(): Promise<LocalePreference> {
  const preference = await loadLocalePreference()
  const normalized = normalizeLocalePreference(preference)
  applyResolvedLocale(resolveLocale(normalized))
  return normalized
}

export async function setLocalePreference(preference: LocalePreference): Promise<void> {
  const normalized = normalizeLocalePreference(preference)
  await saveLocalePreference(normalized)
  applyResolvedLocale(resolveLocale(normalized))
}
