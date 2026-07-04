/** 自定义字段预设类型 */
export type ExtraFieldTypeId =
  | 'url'
  | 'email'
  | 'address'
  | 'date'
  | 'phone'
  | 'password'
  | 'authenticator'
  | 'custom'

export const EXTRA_FIELD_TYPE_OPTIONS: { id: ExtraFieldTypeId; labelKey: string }[] = [
  { id: 'custom', labelKey: 'entry.form.extraFieldType.custom' },
  { id: 'url', labelKey: 'entry.form.extraFieldType.url' },
  { id: 'address', labelKey: 'entry.form.extraFieldType.address' },
  { id: 'date', labelKey: 'entry.form.extraFieldType.date' },
  { id: 'phone', labelKey: 'entry.form.extraFieldType.phone' },
  { id: 'password', labelKey: 'entry.form.extraFieldType.password' },
  { id: 'email', labelKey: 'entry.form.extraFieldType.email' },
  { id: 'authenticator', labelKey: 'entry.form.extraFieldType.authenticator' }
]

/** 存储到 content 中的字段名（中文 key，与 vaultFieldI18n 一致） */
const EXTRA_FIELD_LABELS: Record<ExtraFieldTypeId, string> = {
  url: 'URL',
  email: '电子邮件',
  address: '地址',
  date: '日期',
  phone: '电话',
  password: '密码',
  authenticator: '两步验证',
  custom: ''
}

export function getExtraFieldLabel(type: ExtraFieldTypeId): string {
  return EXTRA_FIELD_LABELS[type]
}
