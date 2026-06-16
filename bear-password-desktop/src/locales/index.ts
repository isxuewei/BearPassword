import type { Language } from 'element-plus/es/locale'
import elementZhCn from 'element-plus/es/locale/lang/zh-cn'
import elementEn from 'element-plus/es/locale/lang/en'
import elementJa from 'element-plus/es/locale/lang/ja'
import type { MessageDict, ResolvedLocale } from './types'
import zhCN from './zh-CN'
import en from './en'
import ja from './ja'

export type { LocalePreference, ResolvedLocale, MessageDict } from './types'

const messages: Record<ResolvedLocale, MessageDict> = {
  'zh-CN': zhCN,
  en,
  ja
}

const elementLocales: Record<ResolvedLocale, Language> = {
  'zh-CN': elementZhCn,
  en: elementEn,
  ja: elementJa
}

export function getElementPlusLocale(locale: ResolvedLocale): Language {
  return elementLocales[locale] ?? elementZhCn
}

/** 翻译函数，支持 {name} 占位符 */
export function t(
  key: string,
  locale: ResolvedLocale = 'zh-CN',
  params?: Record<string, string | number>
): string {
  let text = messages[locale]?.[key] ?? messages['zh-CN']?.[key] ?? key
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value))
    }
  }
  return text
}

export function getThemeLabelKey(value: string): string {
  return value === 'system' ? 'theme.system' : `theme.${value}`
}

export function getThemeDescKey(value: string): string {
  return value === 'system' ? 'theme.systemDesc' : `theme.${value}Desc`
}

export function getFontDescKey(value: string): string {
  return value === 'system' ? 'font.systemDesc' : 'font.cangerDesc'
}

export function getAutoLockLabelKey(minutes: number): string {
  return `autoLock.${minutes}`
}

export function getClipboardClearLabelKey(seconds: number): string {
  return seconds === 0 ? 'clipboardClear.never' : `clipboardClear.${seconds}`
}

export default messages
