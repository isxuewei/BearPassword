import { systemPreferences } from 'electron'
import type {
  BiometricAvailability,
  BiometricKind,
  BiometricUnavailableReason
} from '../../shared/biometric'

export type { BiometricAvailability, BiometricKind, BiometricUnavailableReason }

export type BiometricPromptResult =
  | { ok: true }
  | { ok: false; canceled: boolean; error?: string }

type WindowsSecurityModule = typeof import('electron-windows-security')

let windowsSecurityModulePromise: Promise<WindowsSecurityModule | null> | null = null

function unavailable(
  reason: BiometricUnavailableReason,
  kind: BiometricKind | null = null
): BiometricAvailability {
  return { available: false, kind, unavailableReason: reason }
}

async function loadWindowsSecurityModule(): Promise<WindowsSecurityModule | null> {
  if (process.platform !== 'win32') {
    return null
  }

  if (!windowsSecurityModulePromise) {
    windowsSecurityModulePromise = import('electron-windows-security')
      .then((mod) => mod)
      .catch((error) => {
        console.warn('[biometric] failed to load electron-windows-security', error)
        return null
      })
  }

  return windowsSecurityModulePromise
}

function promisifyWindowsAvailability(
  mod: WindowsSecurityModule
): Promise<WindowsSecurityModule['UserConsentVerifierAvailability']> {
  return new Promise((resolve, reject) => {
    mod.UserConsentVerifier.checkAvailabilityAsync((error, result) => {
      if (error) {
        reject(error)
        return
      }
      resolve(result)
    })
  })
}

function promisifyWindowsVerification(
  mod: WindowsSecurityModule,
  message: string
): Promise<WindowsSecurityModule['UserConsentVerificationResult']> {
  return new Promise((resolve, reject) => {
    mod.UserConsentVerifier.requestVerificationAsync(message, (error, result) => {
      if (error) {
        reject(error)
        return
      }
      resolve(result)
    })
  })
}

function mapWindowsUnavailableReason(
  mod: WindowsSecurityModule,
  availability: WindowsSecurityModule['UserConsentVerifierAvailability']
): BiometricUnavailableReason {
  const states = mod.UserConsentVerifierAvailability
  if (availability === states.notConfiguredForUser) return 'notConfigured'
  if (availability === states.deviceNotPresent) return 'deviceNotPresent'
  if (availability === states.disabledByPolicy) return 'disabledByPolicy'
  if (availability === states.deviceBusy) return 'deviceBusy'
  return 'unavailable'
}

export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  if (process.platform === 'darwin') {
    const available = systemPreferences.canPromptTouchID()
    if (available) {
      return { available: true, kind: 'touchId', unavailableReason: null }
    }
    return unavailable('touchIdUnavailable')
  }

  if (process.platform === 'win32') {
    const mod = await loadWindowsSecurityModule()
    if (!mod) {
      return unavailable('moduleLoadFailed', 'windowsHello')
    }

    try {
      const availability = await promisifyWindowsAvailability(mod)
      if (availability === mod.UserConsentVerifierAvailability.available) {
        return { available: true, kind: 'windowsHello', unavailableReason: null }
      }
      return {
        available: false,
        kind: 'windowsHello',
        unavailableReason: mapWindowsUnavailableReason(mod, availability)
      }
    } catch (error) {
      console.warn('[biometric] windows availability check failed', error)
      return unavailable('checkFailed', 'windowsHello')
    }
  }

  return unavailable('notSupported')
}

function isBiometricPromptCanceled(message: string): boolean {
  const normalized = message.trim().toLowerCase()
  if (!normalized) return false
  return (
    normalized.includes('cancel') ||
    normalized.includes('cancelled') ||
    message.includes('取消') ||
    message.includes('已取消')
  )
}

export async function promptBiometricUnlock(reason: string): Promise<BiometricPromptResult> {
  const message = reason.trim() || 'Unlock BearPassword'

  if (process.platform === 'darwin') {
    if (!systemPreferences.canPromptTouchID()) {
      return { ok: false, canceled: false, error: '此设备不支持 Touch ID' }
    }

    try {
      await systemPreferences.promptTouchID(message)
      return { ok: true }
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error)
      const canceled = isBiometricPromptCanceled(errMessage)
      return {
        ok: false,
        canceled,
        error: canceled ? undefined : errMessage || 'Touch ID 验证失败'
      }
    }
  }

  if (process.platform === 'win32') {
    const mod = await loadWindowsSecurityModule()
    if (!mod) {
      return { ok: false, canceled: false, error: 'Windows Hello 不可用' }
    }

    try {
      const result = await promisifyWindowsVerification(mod, message)
      if (result === mod.UserConsentVerificationResult.verified) {
        return { ok: true }
      }
      if (result === mod.UserConsentVerificationResult.canceled) {
        return { ok: false, canceled: true }
      }
      return {
        ok: false,
        canceled: false,
        error: 'Windows Hello 验证未通过'
      }
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error)
      return { ok: false, canceled: false, error: errMessage || 'Windows Hello 验证失败' }
    }
  }

  return { ok: false, canceled: false, error: '当前平台不支持生物识别解锁' }
}
