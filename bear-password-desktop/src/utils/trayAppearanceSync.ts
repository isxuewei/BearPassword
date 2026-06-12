import type { TrayAppearanceSnapshot, TrayMenuLabels } from '../../shared/trayMenu'
import { TRAY_FONT_VALUES, TRAY_LOCALE_VALUES, TRAY_THEME_VALUES } from '../../shared/trayMenu'
import { t } from '@/locales'
import type { ResolvedLocale } from '@/locales/types'
import type { FontPreference } from '@/utils/font'
import type { LocalePreference } from '@/locales/types'
import type { ThemePreference } from '@/utils/theme'

function buildThemeLabels(locale: ResolvedLocale): TrayMenuLabels['themes'] {
  return Object.fromEntries(
    TRAY_THEME_VALUES.map((value) => [value, t(`theme.${value}`, locale)])
  ) as TrayMenuLabels['themes']
}

function buildLocaleLabels(locale: ResolvedLocale): TrayMenuLabels['locales'] {
  return Object.fromEntries(
    TRAY_LOCALE_VALUES.map((value) => [value, t(`locale.${value}`, locale)])
  ) as TrayMenuLabels['locales']
}

function buildFontLabels(locale: ResolvedLocale): TrayMenuLabels['fonts'] {
  return Object.fromEntries(
    TRAY_FONT_VALUES.map((value) => [value, t(`font.${value}`, locale)])
  ) as TrayMenuLabels['fonts']
}

export function buildTrayMenuLabels(resolvedLocale: ResolvedLocale): TrayMenuLabels {
  return {
    open: t('tray.menu.open', resolvedLocale),
    lock: t('tray.menu.lock', resolvedLocale),
    settings: t('tray.menu.settings', resolvedLocale),
    theme: t('tray.menu.theme', resolvedLocale),
    language: t('tray.menu.language', resolvedLocale),
    font: t('tray.menu.font', resolvedLocale),
    quit: t('tray.menu.quit', resolvedLocale),
    themes: buildThemeLabels(resolvedLocale),
    locales: buildLocaleLabels(resolvedLocale),
    fonts: buildFontLabels(resolvedLocale)
  }
}

export function buildTrayAppearanceSnapshot(input: {
  theme: ThemePreference
  locale: LocalePreference
  font: FontPreference
  resolvedLocale: ResolvedLocale
}): TrayAppearanceSnapshot {
  return {
    theme: input.theme,
    locale: input.locale,
    font: input.font,
    labels: buildTrayMenuLabels(input.resolvedLocale)
  }
}

export async function syncTrayAppearanceToMain(input: {
  theme: ThemePreference
  locale: LocalePreference
  font: FontPreference
  resolvedLocale: ResolvedLocale
}): Promise<void> {
  if (!window.trayApi?.syncAppearance) return
  await window.trayApi.syncAppearance(buildTrayAppearanceSnapshot(input))
}
