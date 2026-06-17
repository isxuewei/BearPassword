import type { LocalePreference } from '@/locales/types'
import type { ExtensionBridgeHealth } from '@/shared/constants/extensionBridge'
import { normalizeLocalePreference } from '@/shared/locale/locale'
import {
  DEFAULT_THEME_PREFERENCE,
  normalizeThemePreference,
  type ThemePreference
} from '@/shared/theme/theme'
import type { DesktopConnectionState } from '@/shared/types'

export interface ResolvedDesktopAppearance {
  theme: ThemePreference
  locale: LocalePreference
}

export function resolveAppearanceFromDesktop(
  state: DesktopConnectionState | ExtensionBridgeHealth | null | undefined
): ResolvedDesktopAppearance {
  if (!state?.ready) {
    return {
      theme: DEFAULT_THEME_PREFERENCE,
      locale: 'system'
    }
  }

  return {
    theme: normalizeThemePreference(state.themePreference ?? DEFAULT_THEME_PREFERENCE),
    locale: normalizeLocalePreference(state.localePreference ?? 'system')
  }
}
