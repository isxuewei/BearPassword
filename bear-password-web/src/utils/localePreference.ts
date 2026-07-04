import { ref } from 'vue'
import { storage } from './storage'
import type { LocalePreference, ResolvedLocale } from '@/locales/types'

/** 系统语言变化计数，供 computed 追踪 */
export const systemLocaleRevision = ref(0)

export interface LocaleOption {
  value: LocalePreference
  labelKey: string
}

/** 设置页语言选项 */
export const LOCALE_PREFERENCE_OPTIONS: readonly LocaleOption[] = [
  { value: 'system', labelKey: 'locale.system' },
  { value: 'zh-CN', labelKey: 'locale.zh-CN' },
  { value: 'en', labelKey: 'locale.en' },
  { value: 'ja', labelKey: 'locale.ja' }
]

const VALID_LOCALE_PREFERENCES = new Set<string>(
  LOCALE_PREFERENCE_OPTIONS.map((item) => item.value)
)

/** 根据浏览器语言解析系统语言 */
export function getSystemLocale(): ResolvedLocale {
  if (typeof navigator === 'undefined') return 'zh-CN'
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('ja')) return 'ja'
  if (lang.startsWith('zh')) return 'zh-CN'
  if (lang.startsWith('en')) return 'en'
  return 'zh-CN'
}

/** 校验并规范化存储的语言偏好 */
export function normalizeLocalePreference(value: unknown): LocalePreference {
  if (typeof value === 'string') {
    if (value === 'en-US') return 'en'
    if (VALID_LOCALE_PREFERENCES.has(value)) {
      return value as LocalePreference
    }
  }
  return 'zh-CN'
}

/** 根据偏好解析最终语言 */
export function resolveLocale(preference: LocalePreference): ResolvedLocale {
  void systemLocaleRevision.value
  if (preference === 'system') {
    return getSystemLocale()
  }
  return preference
}

/** 同步系统语言（窗口聚焦等场景） */
export function syncSystemLocale(): void {
  systemLocaleRevision.value += 1
}

/** 将语言应用到 document */
export function applyResolvedLocale(locale: ResolvedLocale): void {
  document.documentElement.lang = locale
}

/** 应用启动时尽早初始化 */
export function initLocaleOnBoot(): void {
  const preference = normalizeLocalePreference(storage.get('locale', 'zh-CN'))
  applyResolvedLocale(resolveLocale(preference))
}
