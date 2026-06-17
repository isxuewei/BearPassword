import { resolveAppearanceFromDesktop } from '@/shared/appearance/desktopAppearance'
import { getDesktopHealthApi } from '@/shared/api/desktopBridge'
import { getThemeTokens, type ThemeTokens } from '@/shared/theme/presets'
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
  try {
    const health = await getDesktopHealthApi()
    const { theme } = resolveAppearanceFromDesktop(health)
    applyContentThemePreference(theme)
    return
  } catch {
    applyContentThemePreference(DEFAULT_THEME_PREFERENCE)
  }
}
