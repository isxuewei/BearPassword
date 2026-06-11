/** 实际生效的界面语言 */
export type ResolvedLocale = 'zh-CN' | 'en' | 'ja'

/** 用户可选择的语言偏好（含跟随系统） */
export type LocalePreference = ResolvedLocale | 'system'

export type MessageDict = Record<string, string>
