import { getThemeTokens, THEME_PRESETS, type ThemePresetId } from '@/shared/theme/presets'
import { loadThemePreference, saveThemePreference } from '@/shared/storage/theme'

export type { ThemePresetId }
export type ThemePreference = ThemePresetId | 'system'
export type ResolvedTheme = ThemePresetId

export interface ThemeOption {
  value: ThemePreference
}

export const THEME_PRESET_OPTIONS: readonly ThemeOption[] = [
  { value: 'light' },
  { value: 'ocean' },
  { value: 'warm' },
  { value: 'bloom' },
  { value: 'rose' },
  { value: 'mint' },
  { value: 'lagoon' },
  { value: 'forest' },
  { value: 'violet' },
  { value: 'earth' },
  { value: 'dark' },
  { value: 'midnight' },
  { value: 'noir' }
]

export const THEME_OPTIONS: ThemeOption[] = [...THEME_PRESET_OPTIONS, { value: 'system' }]

const VALID_THEME_PREFERENCES = new Set<string>(THEME_OPTIONS.map((item) => item.value))

export const SYSTEM_LIGHT_THEME: ThemePresetId = 'earth'
export const SYSTEM_DARK_THEME: ThemePresetId = 'midnight'

type SystemThemeListener = () => void

let systemThemeListeners: SystemThemeListener[] = []
let systemThemeUnsubscribe: (() => void) | null = null

export function normalizeThemePreference(value: unknown): ThemePreference {
  if (typeof value === 'string' && VALID_THEME_PREFERENCES.has(value)) {
    return value as ThemePreference
  }
  return 'earth'
}

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function subscribeSystemThemeChange(listener: SystemThemeListener): () => void {
  systemThemeListeners.push(listener)
  ensureSystemThemeWatching()
  return () => {
    systemThemeListeners = systemThemeListeners.filter((item) => item !== listener)
  }
}

function ensureSystemThemeWatching(): void {
  if (systemThemeUnsubscribe || typeof window === 'undefined') return

  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (): void => {
    systemThemeListeners.forEach((listener) => listener())
  }
  media.addEventListener('change', handler)
  systemThemeUnsubscribe = () => media.removeEventListener('change', handler)
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return getSystemTheme() === 'dark' ? SYSTEM_DARK_THEME : SYSTEM_LIGHT_THEME
  }
  return preference
}

function isDarkResolvedTheme(theme: ResolvedTheme): boolean {
  return theme === 'dark' || theme === 'midnight' || theme === 'noir'
}

/** 将主题令牌应用到 document */
export function applyResolvedTheme(theme: ResolvedTheme): void {
  const tokens = getThemeTokens(theme)
  const root = document.documentElement

  root.setAttribute('data-theme', theme)
  root.classList.toggle('bear-theme-dark', isDarkResolvedTheme(theme))

  root.style.setProperty('--bear-bg', tokens.bg)
  root.style.setProperty('--bear-surface', tokens.surface)
  root.style.setProperty('--bear-surface-2', tokens.surface2)
  root.style.setProperty('--bear-surface-glass', tokens.surfaceGlass)
  root.style.setProperty('--bear-border', tokens.border)
  root.style.setProperty('--bear-border-hover', tokens.borderHover)
  root.style.setProperty('--bear-primary', tokens.primary)
  root.style.setProperty('--bear-primary-hover', tokens.primaryHover)
  root.style.setProperty('--bear-primary-light', tokens.primaryLight)
  root.style.setProperty('--bear-accent-subtle', tokens.accentSubtle)
  root.style.setProperty('--bear-accent-glow', tokens.accentGlow)
  root.style.setProperty('--bear-warning', tokens.warning)
  root.style.setProperty('--bear-badge-bg', tokens.badgeBg)
  root.style.setProperty('--bear-text', tokens.text)
  root.style.setProperty('--bear-text-secondary', tokens.textSecondary)
  root.style.setProperty('--bear-text-muted', tokens.textMuted)
  root.style.setProperty('--bear-danger', tokens.danger)
  root.style.setProperty('--bear-surface-hover', tokens.surfaceHover)
  root.style.setProperty('--bear-shadow-sm', tokens.shadowSm)
  root.style.setProperty('--bear-shadow-md', tokens.shadowMd)
  root.style.setProperty('--bear-shadow-lg', tokens.shadowLg)
  root.style.setProperty('--bear-scrollbar-thumb', tokens.scrollbarThumb)
  root.style.setProperty('--bear-scrollbar-thumb-hover', tokens.scrollbarThumbHover)
}

export async function initThemeOnBoot(): Promise<ThemePreference> {
  const preference = await loadThemePreference()
  applyResolvedTheme(resolveTheme(preference))
  return preference
}

export async function setThemePreference(preference: ThemePreference): Promise<void> {
  const normalized = normalizeThemePreference(preference)
  await saveThemePreference(normalized)
  applyResolvedTheme(resolveTheme(normalized))
}

export function isValidThemePreset(theme: string): theme is ThemePresetId {
  return theme in THEME_PRESETS
}
