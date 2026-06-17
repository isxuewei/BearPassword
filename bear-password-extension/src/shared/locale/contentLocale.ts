import { t as translate } from '@/locales'
import { resolveAppearanceFromDesktop } from '@/shared/appearance/desktopAppearance'
import { getDesktopHealthApi } from '@/shared/api/desktopBridge'
import {
  applyResolvedLocale,
  DEFAULT_LOCALE_PREFERENCE,
  getSystemLocale,
  resolveLocale
} from '@/shared/locale/locale'
import type { LocalePreference } from '@/locales/types'
import type { ResolvedLocale } from '@/locales/types'

let activePreference: LocalePreference = DEFAULT_LOCALE_PREFERENCE
let activeLocale: ResolvedLocale = getSystemLocale()

export function getContentLocale(): ResolvedLocale {
  return activeLocale
}

export function applyContentLocalePreference(preference: LocalePreference): void {
  activePreference = preference
  activeLocale = resolveLocale(activePreference)
  applyResolvedLocale(activeLocale)
}

export async function initContentLocale(): Promise<void> {
  try {
    const health = await getDesktopHealthApi()
    const { locale } = resolveAppearanceFromDesktop(health)
    applyContentLocalePreference(locale)
    return
  } catch {
    applyContentLocalePreference(DEFAULT_LOCALE_PREFERENCE)
  }
}

export function tContent(key: string, params?: Record<string, string | number>): string {
  return translate(key, activeLocale, params)
}
