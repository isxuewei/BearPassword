import { t as translate } from '@/locales'
import { applyResolvedLocale, normalizeLocalePreference, resolveLocale } from '@/shared/locale/locale'
import type { LocalePreference } from '@/locales/types'
import { loadLocalePreference } from '@/shared/storage/locale'
import type { ResolvedLocale } from '@/locales/types'

let activePreference: LocalePreference = 'zh-CN'
let activeLocale: ResolvedLocale = 'zh-CN'

export function getContentLocale(): ResolvedLocale {
  return activeLocale
}

export function applyContentLocalePreference(preference: unknown): void {
  activePreference = normalizeLocalePreference(preference)
  activeLocale = resolveLocale(activePreference)
  applyResolvedLocale(activeLocale)
}

export async function initContentLocale(): Promise<void> {
  const preference = await loadLocalePreference()
  applyContentLocalePreference(preference)
}

export function tContent(key: string, params?: Record<string, string | number>): string {
  return translate(key, activeLocale, params)
}
