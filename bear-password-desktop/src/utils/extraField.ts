import {
  EXTRA_FIELD_TYPE_OPTIONS,
  getExtraFieldLabel,
  type ExtraFieldTypeId
} from '@/constants/extraFieldTypes'
import type { AuthenticatorContent, LoginContent, LoginExtraField } from '@/types'
import { normalizeAuthenticatorContent } from '@/utils/authenticatorContent'
import { applyParsedOtpAuthImport, isValidAuthenticatorSecret, type ParsedOtpAuthImport } from '@/utils/totp'

const VALID_EXTRA_FIELD_TYPES = new Set<ExtraFieldTypeId>(
  EXTRA_FIELD_TYPE_OPTIONS.map((item) => item.id)
)

function parseExtraFieldType(raw: unknown): ExtraFieldTypeId {
  if (typeof raw === 'string' && VALID_EXTRA_FIELD_TYPES.has(raw as ExtraFieldTypeId)) {
    return raw as ExtraFieldTypeId
  }
  return 'custom'
}

export function normalizeExtraField(raw: unknown): LoginExtraField {
  const field = (raw ?? {}) as Record<string, unknown>
  const type = parseExtraFieldType(field.type)
  const normalized: LoginExtraField = {
    label: String(field.label ?? ''),
    value: String(field.value ?? ''),
    type
  }

  if (type === 'authenticator') {
    const auth = normalizeAuthenticatorContent({
      secret: field.secret ?? field.value,
      issuer: field.issuer,
      account: field.account,
      algorithm: field.algorithm,
      digits: field.digits,
      period: field.period
    })
    normalized.secret = auth.secret
    normalized.issuer = auth.issuer
    normalized.account = auth.account
    normalized.algorithm = auth.algorithm
    normalized.digits = auth.digits
    normalized.period = auth.period
  }

  return normalized
}

export function normalizeExtraFields(raw: unknown): LoginExtraField[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeExtraField)
}

export function resolveExtraFieldType(field: Pick<LoginExtraField, 'type'>): ExtraFieldTypeId {
  return field.type ?? 'custom'
}

export function createAuthenticatorExtraField(): LoginExtraField {
  return {
    label: getExtraFieldLabel('authenticator'),
    value: '',
    type: 'authenticator',
    secret: '',
    issuer: '',
    account: '',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  }
}

export function addExtraFieldByType(fields: LoginExtraField[], type: ExtraFieldTypeId): void {
  if (type === 'authenticator') {
    fields.push(createAuthenticatorExtraField())
    return
  }

  fields.push({
    label: getExtraFieldLabel(type),
    value: '',
    type
  })
}

export function isSecretExtraField(field: Pick<LoginExtraField, 'type'>): boolean {
  return resolveExtraFieldType(field) === 'password'
}

export function isAuthenticatorExtraField(field: Pick<LoginExtraField, 'type'>): boolean {
  return resolveExtraFieldType(field) === 'authenticator'
}

export function isLinkExtraField(field: Pick<LoginExtraField, 'type'>): boolean {
  const type = resolveExtraFieldType(field)
  return type === 'url' || type === 'email'
}

export function extraFieldToAuthenticatorContent(field: LoginExtraField): AuthenticatorContent {
  return normalizeAuthenticatorContent({
    title: field.label,
    issuer: field.issuer ?? '',
    account: field.account ?? '',
    secret: field.secret ?? '',
    algorithm: field.algorithm,
    digits: field.digits,
    period: field.period
  })
}

export function extractLoginAuthenticatorFromContent(
  content: Pick<LoginContent, 'extraFields'>
): AuthenticatorContent | undefined {
  for (const field of normalizeExtraFields(content.extraFields)) {
    if (!isAuthenticatorExtraField(field)) continue
    const auth = extraFieldToAuthenticatorContent(field)
    if (auth.secret && isValidAuthenticatorSecret(auth.secret)) {
      return auth
    }
  }
  return undefined
}

export function applyParsedOtpAuthToExtraField(
  field: LoginExtraField,
  parsed: ParsedOtpAuthImport
): void {
  const content = extraFieldToAuthenticatorContent(field)
  applyParsedOtpAuthImport(content, parsed)
  field.secret = content.secret
  field.issuer = content.issuer
  field.account = content.account
  field.algorithm = content.algorithm
  field.digits = content.digits
  field.period = content.period
}

export function hasExtraFieldContent(field: LoginExtraField): boolean {
  if (isAuthenticatorExtraField(field)) {
    return Boolean(field.label.trim() || field.secret?.trim())
  }
  return Boolean(field.label.trim() || field.value.trim())
}

export function filterNonemptyExtraFields(fields: LoginExtraField[]): LoginExtraField[] {
  return fields.filter(hasExtraFieldContent)
}

export function getExtraFieldLinkHref(
  type: ExtraFieldTypeId,
  value: string
): string {
  const trimmed = value.trim()
  if (!trimmed) return '#'
  if (type === 'email') return `mailto:${trimmed}`
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}
