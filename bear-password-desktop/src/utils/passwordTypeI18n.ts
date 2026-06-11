import { t } from '@/locales'
import type { ResolvedLocale } from '@/locales/types'
import type { PasswordType } from '@/types'

/** 数据库中存储的中文类型 → 文案 key */
const PASSWORD_TYPE_I18N_KEYS: Record<PasswordType, string> = {
  登录信息: 'vault.type.login',
  服务器: 'vault.type.server',
  银行卡: 'vault.type.bankCard',
  身份信息: 'vault.type.identity',
  安全备注: 'vault.type.secureNote',
  数据库: 'vault.type.database',
  自定义: 'vault.type.custom'
}

/** 筛选下拉中的类型顺序 */
export const PASSWORD_TYPE_FILTER_ORDER: PasswordType[] = [
  '登录信息',
  '服务器',
  '安全备注',
  '银行卡',
  '身份信息',
  '数据库',
  '自定义'
]

/** 将数据库中的中文类型转为当前语言的展示名 */
export function getPasswordTypeLabel(type: PasswordType, locale: ResolvedLocale): string {
  const key = PASSWORD_TYPE_I18N_KEYS[type]
  return key ? t(key, locale) : type
}

/** 类别筛选下拉选项（value 仍为中文，供 API 查询） */
export function getPasswordTypeFilterOptions(locale: ResolvedLocale): { label: string; value: PasswordType }[] {
  return PASSWORD_TYPE_FILTER_ORDER.map((value) => ({
    value,
    label: getPasswordTypeLabel(value, locale)
  }))
}
