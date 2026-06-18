import { t } from '@/locales'
import type { ResolvedLocale } from '@/locales/types'

/**
 * 数据库 / JSON 中存储的中文字段名 → 文案 key
 * 展示时翻译，读写 content 仍使用中文 key
 */
const FIELD_LABEL_I18N_KEYS: Record<string, string> = {
  网站: 'entry.field.website',
  用户名: 'entry.field.username',
  密码: 'entry.field.password',
  主机: 'entry.field.host',
  内容: 'entry.field.content',
  字段: 'entry.field.generic',
  银行: 'entry.field.bankName',
  持卡人: 'entry.field.cardHolder',
  卡号: 'entry.field.cardNumber',
  有效期: 'entry.field.expiry',
  安全码: 'entry.field.cvv',
  姓名: 'entry.field.name',
  证件号: 'entry.field.idNumber',
  出生日期: 'entry.field.birthDate',
  农历生日: 'entry.field.lunarBirthday',
  电话: 'entry.field.phone',
  地址: 'entry.field.address',
  URL: 'entry.field.url',
  电子邮件: 'entry.field.email',
  日期: 'entry.field.date',
  两步验证: 'entry.form.extraFieldType.authenticator',
  '2FA': 'entry.form.extraFieldType.authenticator',
  '两步验证（2FA）': 'entry.form.extraFieldType.authenticator',
  类型: 'entry.field.dbType',
  端口: 'entry.field.port',
  数据库: 'entry.field.databaseName',
  数据库名: 'entry.field.databaseNameLegacy',
  发行方: 'entry.field.issuer',
  账户: 'entry.field.account',
  密钥: 'entry.field.secret',
  算法: 'entry.field.algorithm',
  位数: 'entry.field.digits',
  周期: 'entry.field.period',
  验证码: 'entry.field.totpCode',
  备注: 'entry.form.remark',
  标签: 'entry.form.tags',
  标题: 'entry.form.fieldTitle'
}

/** 将存储的中文字段名转为当前语言的展示标签；用户自定义标签原样返回 */
export function translateVaultFieldLabel(label: string, locale: ResolvedLocale): string {
  const trimmed = label.trim()
  if (!trimmed) {
    return t('entry.field.generic', locale)
  }
  const key = FIELD_LABEL_I18N_KEYS[trimmed]
  return key ? t(key, locale) : trimmed
}

/** 判断自定义字段是否应视为敏感信息（支持中/英/日常见关键词） */
export function isSecretVaultFieldLabel(label: string): boolean {
  return /密码|pwd|pass|pin|cvv|secret|密钥|安全码|证件|身份证|id|パスワード|セキュリティ/i.test(
    label
  )
}
