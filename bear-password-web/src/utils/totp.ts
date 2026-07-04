import * as OTPAuth from 'otpauth'
import type { AuthenticatorContent } from '@/types'
import { normalizeAuthenticatorContent } from '@/utils/authenticatorContent'

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

export interface ParsedOtpAuthImport {
  title: string
  issuer: string
  account: string
  secret: string
  algorithm: AuthenticatorContent['algorithm']
  digits: number
  period: number
}

export function applyParsedOtpAuthImport(
  content: AuthenticatorContent,
  parsed: ParsedOtpAuthImport
): void {
  content.title = parsed.title
  content.issuer = parsed.issuer
  content.account = parsed.account || parsed.title
  content.secret = parsed.secret
  content.algorithm = parsed.algorithm
  content.digits = parsed.digits
  content.period = parsed.period
}

export function parseOtpAuthUri(input: string): ParsedOtpAuthImport | null {
  const trimmed = input.trim()
  if (!trimmed.toLowerCase().startsWith('otpauth://')) return null

  try {
    const uri = OTPAuth.URI.parse(trimmed)
    if (!(uri instanceof OTPAuth.TOTP)) return null

    const issuer = (uri.issuer ?? '').trim()
    const account = (uri.label ?? '').trim()
    const title = issuer && account ? `${issuer} (${account})` : issuer || account || '两步验证（2FA）'

    return {
      title,
      issuer,
      account,
      secret: uri.secret.base32,
      algorithm: (uri.algorithm as AuthenticatorContent['algorithm']) || 'SHA1',
      digits: uri.digits || 6,
      period: uri.period || 30
    }
  } catch {
    return null
  }
}
