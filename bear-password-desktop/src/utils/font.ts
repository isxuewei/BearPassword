import { storage } from './storage'

/** 界面字体偏好 */
export type FontPreference = 'canger' | 'system'

export const DEFAULT_FONT_PREFERENCE: FontPreference = 'system'

export interface FontOption {
  value: FontPreference
  label: string
  description: string
}

/** 设置页字体选项 */
export const FONT_OPTIONS: readonly FontOption[] = [
  { value: 'system', label: '跟随系统', description: '使用系统界面字体' },
  { value: 'canger', label: '仓耳今楷', description: '使用仓耳今楷05 楷体' }
]

const VALID_FONT_PREFERENCES = new Set<string>(FONT_OPTIONS.map((item) => item.value))

/** 校验并规范化存储的字体偏好 */
export function normalizeFontPreference(value: unknown): FontPreference {
  if (typeof value === 'string' && VALID_FONT_PREFERENCES.has(value)) {
    return value as FontPreference
  }
  return DEFAULT_FONT_PREFERENCE
}

/** 字体偏好说明（设置页副标题） */
export function getFontPreferenceDescription(preference: FontPreference): string {
  return FONT_OPTIONS.find((item) => item.value === preference)?.description ?? ''
}

/** 将字体偏好应用到 document */
export function applyFontPreference(preference: FontPreference): void {
  document.documentElement.setAttribute('data-font', preference)
}

/** 应用启动时尽早初始化，减少字体闪烁 */
export function initFontOnBoot(): void {
  const preference = normalizeFontPreference(storage.get('font', DEFAULT_FONT_PREFERENCE))
  applyFontPreference(preference)
}
