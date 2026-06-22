import type { AuthenticatorContent, LoginContent, LoginExtraField } from '@/shared/types'
import { normalizeAuthenticatorContent } from '@/shared/utils/authenticatorContent'
import { isValidAuthenticatorSecret } from '@/shared/utils/totp'

function parseExtraFieldType(raw: unknown): LoginExtraField['type'] {
  const valid = new Set([
    'url',
    'email',
    'address',
    'date',
    'phone',
    'password',
    'authenticator',
    'custom'
  ])
  if (typeof raw === 'string' && valid.has(raw)) {
    return raw as NonNullable<LoginExtraField['type']>
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
    if (field.type !== 'authenticator') continue
    const auth = extraFieldToAuthenticatorContent(field)
    if (auth.secret && isValidAuthenticatorSecret(auth.secret)) {
      return auth
    }
  }
  return undefined
}
