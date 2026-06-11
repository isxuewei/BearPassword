import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '@/utils/storage'
import {
  type ThemePreference,
  type ResolvedTheme,
  resolveTheme,
  applyResolvedTheme,
  getThemePreferenceLabel,
  normalizeThemePreference,
  subscribeSystemThemeChange,
  syncSystemThemeFromPlatform,
  systemThemeRevision
} from '@/utils/theme'
import {
  type FontPreference,
  applyFontPreference,
  initFontOnBoot,
  normalizeFontPreference
} from '@/utils/font'
import {
  type LocalePreference,
  type ResolvedLocale,
  resolveLocale,
  applyResolvedLocale,
  initLocaleOnBoot,
  normalizeLocalePreference,
  syncSystemLocale,
  systemLocaleRevision
} from '@/utils/localePreference'

/**
 * 应用全局状态
 * 管理主题、语言等全局配置
 */
export const useAppStore = defineStore('app', () => {
  const themePreference = ref<ThemePreference>(
    normalizeThemePreference(storage.get<ThemePreference>('theme', 'light'))
  )
  const localePreference = ref<LocalePreference>(
    normalizeLocalePreference(storage.get<LocalePreference>('locale', 'zh-CN'))
  )
  const fontPreference = ref<FontPreference>(
    normalizeFontPreference(storage.get<FontPreference>('font', 'canger'))
  )

  /** 当前实际生效的主题（systemThemeRevision 确保跟随系统时随 OS 变化更新） */
  const resolvedTheme = computed<ResolvedTheme>(() => {
    void systemThemeRevision.value
    return resolveTheme(themePreference.value)
  })

  /** 当前实际生效的语言 */
  const resolvedLocale = computed<ResolvedLocale>(() => {
    void systemLocaleRevision.value
    return resolveLocale(localePreference.value)
  })

  let unsubscribeSystemTheme: (() => void) | null = null

  /** 应用解析后的主题到 DOM */
  function applyTheme(): void {
    applyResolvedTheme(resolveTheme(themePreference.value))
  }

  /** 应用解析后的字体到 DOM */
  function applyFont(): void {
    applyFontPreference(fontPreference.value)
  }

  /** 应用解析后的语言到 DOM */
  function applyLocale(): void {
    applyResolvedLocale(resolveLocale(localePreference.value))
  }

  /** 设置界面字体偏好 */
  function setFontPreference(preference: unknown): void {
    const normalized = normalizeFontPreference(preference)
    fontPreference.value = normalized
    storage.set('font', normalized)
    applyFont()
  }

  /** 设置语言偏好 */
  function setLocalePreference(preference: unknown): void {
    const normalized = normalizeLocalePreference(preference)
    localePreference.value = normalized
    storage.set('locale', normalized)
    applyLocale()
  }

  /** 设置主题偏好 */
  function setThemePreference(preference: unknown): void {
    const normalized = normalizeThemePreference(preference)
    themePreference.value = normalized
    storage.set('theme', normalized)
    applyTheme()
  }

  /** @deprecated 使用 setLocalePreference */
  function setLocale(lang: string): void {
    setLocalePreference(lang)
  }

  /** 初始化主题、字体与语言 */
  async function initTheme(): Promise<void> {
    initFontOnBoot()
    initLocaleOnBoot()
    applyFont()
    applyLocale()
    await syncSystemThemeFromPlatform()
    applyTheme()
    watchSystemTheme()

    window.addEventListener('focus', handleWindowFocus)
  }

  /** 窗口重新获得焦点时同步系统外观与语言 */
  async function handleWindowFocus(): Promise<void> {
    if (themePreference.value === 'system') {
      await syncSystemThemeFromPlatform()
      applyTheme()
    }
    if (localePreference.value === 'system') {
      syncSystemLocale()
      applyLocale()
    }
  }

  /** 监听系统主题变化（仅在「跟随系统」时响应） */
  function watchSystemTheme(): void {
    if (typeof window === 'undefined') return

    unsubscribeSystemTheme?.()
    unsubscribeSystemTheme = subscribeSystemThemeChange(() => {
      if (themePreference.value === 'system') {
        applyTheme()
      }
    })
  }

  /** 主题偏好显示文案 */
  const themePreferenceLabel = computed(() => getThemePreferenceLabel(themePreference.value))

  return {
    themePreference,
    resolvedTheme,
    themePreferenceLabel,
    localePreference,
    resolvedLocale,
    fontPreference,
    locale: resolvedLocale,
    setThemePreference,
    setFontPreference,
    setLocalePreference,
    setLocale,
    initTheme,
    applyTheme,
    applyFont,
    applyLocale
  }
})
