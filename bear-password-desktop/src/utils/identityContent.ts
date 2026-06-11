/**
 * 身份信息 content 读写
 */
import type { IdentityContent, LoginExtraField } from '@/types'

export function createEmptyIdentityContent(): IdentityContent {
  return {
    title: '',
    name: '',
    idNumber: '',
    birthDate: '',
    lunarBirthday: '',
    phone: '',
    address: '',
    extraFields: []
  }
}

function normalizeExtraFields(raw: unknown): LoginExtraField[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const field = item as Record<string, unknown>
    return {
      label: String(field.label ?? ''),
      value: String(field.value ?? '')
    }
  })
}

export function normalizeIdentityContent(raw: Record<string, unknown>): IdentityContent {
  return {
    title: String(raw.title ?? '身份标识'),
    name: String(raw.name ?? ''),
    idNumber: String(raw.idNumber ?? ''),
    birthDate: String(raw.birthDate ?? ''),
    lunarBirthday: String(raw.lunarBirthday ?? ''),
    phone: String(raw.phone ?? ''),
    address: String(raw.address ?? ''),
    extraFields: normalizeExtraFields(raw.extraFields)
  }
}

export function serializeIdentityContent(content: IdentityContent): Omit<IdentityContent, 'title'> {
  return {
    name: content.name.trim(),
    idNumber: content.idNumber.trim(),
    birthDate: content.birthDate.trim(),
    lunarBirthday: content.lunarBirthday.trim(),
    phone: content.phone.trim(),
    address: content.address.trim(),
    extraFields: content.extraFields.filter((field) => field.label.trim() || field.value.trim())
  }
}

export function getIdentityTitle(content: Record<string, unknown>): string {
  const identity = normalizeIdentityContent(content)
  if (identity.title.trim() && identity.title !== '身份标识') return identity.title
  if (identity.name.trim()) return identity.name
  return '身份标识'
}
