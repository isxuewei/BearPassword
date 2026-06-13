import { getThemeTokens, type ThemeTokens } from '@/shared/theme/presets'
import { loadThemePreference } from '@/shared/storage/theme'
import {
  DEFAULT_THEME_PREFERENCE,
  normalizeThemePreference,
  resolveTheme,
  type ThemePreference
} from '@/shared/theme/theme'

let activeTokens: ThemeTokens = getThemeTokens(resolveTheme(DEFAULT_THEME_PREFERENCE))

export function getContentThemeTokens(): ThemeTokens {
  return activeTokens
}

export function applyContentThemePreference(preference: ThemePreference): void {
  activeTokens = getThemeTokens(resolveTheme(normalizeThemePreference(preference)))
}

export async function initContentTheme(): Promise<void> {
  const preference = await loadThemePreference()
  applyContentThemePreference(preference)
}
