import type { AuthenticatorContent } from '@/shared/types'

const DEFAULT_ALGORITHM: AuthenticatorContent['algorithm'] = 'SHA1'
const DEFAULT_DIGITS = 6
const DEFAULT_PERIOD = 30

function normalizeAlgorithm(value: unknown): AuthenticatorContent['algorithm'] {
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
