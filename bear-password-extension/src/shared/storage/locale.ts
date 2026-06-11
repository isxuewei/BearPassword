import type { LocalePreference } from '@/locales/types'
import { normalizeLocalePreference } from '@/shared/locale/locale'

const LOCALE_KEY = 'bear_extension_locale'

export async function loadLocalePreference(): Promise<LocalePreference> {
  const result = await chrome.storage.local.get(LOCALE_KEY)
  return normalizeLocalePreference(result[LOCALE_KEY])
}

export async function saveLocalePreference(preference: LocalePreference): Promise<void> {
  await chrome.storage.local.set({ [LOCALE_KEY]: preference })
}
