import { resolveAppearanceFromDesktop } from '@/shared/appearance/desktopAppearance'
import type { DesktopConnectionState } from '@/shared/types'
import { sendMessage } from '@/shared/utils/messaging'
import {
  applyContentLocalePreference,
  getContentLocale
} from '@/shared/locale/contentLocale'
import { DEFAULT_LOCALE_PREFERENCE } from '@/shared/locale/locale'
import { subscribeSystemLocaleChange } from '@/shared/locale/locale'
import { applyContentThemePreference } from '@/shared/theme/contentTheme'
import {
  DEFAULT_THEME_PREFERENCE,
  resolveTheme,
  subscribeSystemThemeChange,
  type ThemePreference
} from '@/shared/theme/theme'
import type { LocalePreference } from '@/locales/types'

let activeThemePreference: ThemePreference = DEFAULT_THEME_PREFERENCE
let activeLocalePreference: LocalePreference = DEFAULT_LOCALE_PREFERENCE
let unsubscribeSystemTheme: (() => void) | null = null
let unsubscribeSystemLocale: (() => void) | null = null

type AppearanceChangeListener = () => void
const appearanceChangeListeners: AppearanceChangeListener[] = []

export function onContentAppearanceChange(listener: AppearanceChangeListener): () => void {
  appearanceChangeListeners.push(listener)
  return () => {
    const index = appearanceChangeListeners.indexOf(listener)
    if (index >= 0) appearanceChangeListeners.splice(index, 1)
  }
}

function notifyAppearanceChange(): void {
  appearanceChangeListeners.forEach((listener) => listener())
}

function applyThemePreference(preference: ThemePreference): boolean {
  const prevResolved = resolveTheme(activeThemePreference)
  applyContentThemePreference(preference)
  const nextResolved = resolveTheme(preference)
  const changed = preference !== activeThemePreference || nextResolved !== prevResolved
  activeThemePreference = preference
  return changed
}

function applyLocalePreference(preference: LocalePreference): boolean {
  const prevLocale = getContentLocale()
  applyContentLocalePreference(preference)
  const changed = preference !== activeLocalePreference || getContentLocale() !== prevLocale
  activeLocalePreference = preference
  return changed
}

export function syncContentAppearanceFromHealth(
  state: Parameters<typeof resolveAppearanceFromDesktop>[0]
): boolean {
  const { theme, locale } = resolveAppearanceFromDesktop(state)
  let changed = false

  if (theme !== activeThemePreference) {
    changed = applyThemePreference(theme) || changed
  } else if (theme === 'system') {
    changed = applyThemePreference('system') || changed
  }

  if (locale !== activeLocalePreference) {
    changed = applyLocalePreference(locale) || changed
  } else if (locale === 'system') {
    changed = applyLocalePreference('system') || changed
  }

  if (changed) notifyAppearanceChange()
  return changed
}

export async function syncContentAppearanceFromDesktop(force = false): Promise<boolean> {
  try {
    const state = await sendMessage<DesktopConnectionState>({
      type: force ? 'REFRESH_DESKTOP_STATE' : 'GET_DESKTOP_STATE'
    })
    return syncContentAppearanceFromHealth(state)
  } catch {
    return syncContentAppearanceFromHealth(null)
  }
}

function setupSystemAppearanceWatchers(): void {
  unsubscribeSystemTheme?.()
  unsubscribeSystemTheme = subscribeSystemThemeChange(() => {
    if (activeThemePreference !== 'system') return
    if (applyThemePreference('system')) notifyAppearanceChange()
  })

  unsubscribeSystemLocale?.()
  unsubscribeSystemLocale = subscribeSystemLocaleChange(() => {
    if (activeLocalePreference !== 'system') return
    if (applyLocalePreference('system')) notifyAppearanceChange()
  })
}

export async function initContentAppearance(): Promise<void> {
  setupSystemAppearanceWatchers()
  await syncContentAppearanceFromDesktop()
}
