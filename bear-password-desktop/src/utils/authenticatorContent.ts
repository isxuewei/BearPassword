import type { AuthenticatorContent } from '@/types'

export type TotpAlgorithm = AuthenticatorContent['algorithm']

const DEFAULT_ALGORITHM: TotpAlgorithm = 'SHA1'
const DEFAULT_DIGITS = 6
const DEFAULT_PERIOD = 30

export function createEmptyAuthenticatorContent(): AuthenticatorContent {
  return {
    title: '',
    issuer: '',
    account: '',
    secret: '',
    algorithm: DEFAULT_ALGORITHM,
    digits: DEFAULT_DIGITS,
    period: DEFAULT_PERIOD
  }
}

function normalizeAlgorithm(value: unknown): TotpAlgorithm {
  const raw = String(value ?? DEFAULT_ALGORITHM).toUpperCase()
  if (raw === 'SHA256' || raw === 'SHA512') return raw
  return DEFAULT_ALGORITHM
}

function normalizeDigits(value: unknown): number {
  const digits = Number(value)
  if (digits === 8) return 8
  return DEFAULT_DIGITS
}

function normalizePeriod(value: unknown): number {
  const period = Number(value)
  if (Number.isFinite(period) && period >= 15 && period <= 120) {
    return Math.round(period)
  }
  return DEFAULT_PERIOD
}

export function normalizeAuthenticatorContent(raw: Record<string, unknown>): AuthenticatorContent {
  return {
    title: String(raw.title ?? '').trim(),
    issuer: String(raw.issuer ?? '').trim(),
    account: String(raw.account ?? '').trim(),
    secret: String(raw.secret ?? '').replace(/\s+/g, '').toUpperCase(),
    algorithm: normalizeAlgorithm(raw.algorithm),
    digits: normalizeDigits(raw.digits),
    period: normalizePeriod(raw.period)
  }
}

export function serializeAuthenticatorContent(content: AuthenticatorContent): Record<string, unknown> {
  const normalized = normalizeAuthenticatorContent(content as unknown as Record<string, unknown>)
  return { ...normalized }
}

export function getAuthenticatorTitle(content: Record<string, unknown>): string {
  const normalized = normalizeAuthenticatorContent(content)
  if (normalized.title) return normalized.title
  if (normalized.issuer && normalized.account) {
    return `${normalized.issuer} (${normalized.account})`
  }
  return normalized.issuer || normalized.account || '两步验证（2FA）'
}
