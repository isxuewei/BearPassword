import { request } from '@/utils/request'
import type { LoginResult } from '@/types'

export interface MfaStatus {
  totpEnabled: boolean
  mfaRequired: boolean
}

export interface TotpSetupResult {
  pendingToken: string
  secret: string
  otpauthUri: string
  qrCodeBase64: string
}

export function getMfaStatusApi(): Promise<MfaStatus> {
  return request.get<MfaStatus>('/auth/mfa/status')
}

export function setupTotpApi(): Promise<TotpSetupResult> {
  return request.post<TotpSetupResult>('/auth/mfa/totp/setup')
}

export function enableTotpApi(pendingToken: string, code: string): Promise<void> {
  return request.post<void>('/auth/mfa/totp/enable', { pendingToken, code })
}

export function disableTotpApi(code: string): Promise<void> {
  return request.post<void>('/auth/mfa/totp/disable', { code })
}

export function verifyTotpLoginApi(mfaToken: string, code: string): Promise<LoginResult> {
  return request.post<LoginResult>('/auth/mfa/totp/verify', { mfaToken, code })
}
