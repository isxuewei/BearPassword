import * as OTPAuth from 'otpauth'
import type { AuthenticatorContent } from '@/shared/types'
import { normalizeAuthenticatorContent } from '@/shared/utils/authenticatorContent'

export interface TotpSnapshot {
  code: string
  remainingSeconds: number
  period: number
}

function buildTotp(content: AuthenticatorContent): OTPAuth.TOTP | null {
  const normalized = normalizeAuthenticatorContent(content as unknown as Record<string, unknown>)
  const secret = normalized.secret.trim()
  if (!secret) return null

  try {
    return new OTPAuth.TOTP({
      issuer: normalized.issuer || undefined,
      label: normalized.account || normalized.title || normalized.issuer || 'Account',
      algorithm: normalized.algorithm,
      digits: normalized.digits,
      period: normalized.period,
      secret: OTPAuth.Secret.fromBase32(secret)
    })
  } catch {
    return null
  }
}

export function isValidAuthenticatorSecret(secret: string): boolean {
  const cleaned = secret.replace(/\s+/g, '').toUpperCase()
  if (!cleaned) return false
  try {
    OTPAuth.Secret.fromBase32(cleaned)
    return true
  } catch {
    return false
  }
}

export function generateTotpSnapshot(content: AuthenticatorContent, nowMs = Date.now()): TotpSnapshot | null {
  const totp = buildTotp(content)
  if (!totp) return null

  const period = totp.period
  const epochSeconds = Math.floor(nowMs / 1000)
  const remainingSeconds = period - (epochSeconds % period)

  return {
    code: totp.generate({ timestamp: nowMs }),
    remainingSeconds: remainingSeconds === period ? period : remainingSeconds,
    period
  }
}
