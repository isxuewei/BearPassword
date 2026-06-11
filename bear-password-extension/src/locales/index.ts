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

export default messages
