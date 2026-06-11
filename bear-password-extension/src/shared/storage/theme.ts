import { normalizeThemePreference, type ThemePreference } from '@/shared/theme/theme'

const THEME_KEY = 'bear_extension_theme'

export async function loadThemePreference(): Promise<ThemePreference> {
  const result = await chrome.storage.local.get(THEME_KEY)
  return normalizeThemePreference(result[THEME_KEY])
}

export async function saveThemePreference(preference: ThemePreference): Promise<void> {
  await chrome.storage.local.set({ [THEME_KEY]: preference })
}
