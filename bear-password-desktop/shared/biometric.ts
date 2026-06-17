export type BiometricKind = 'touchId' | 'windowsHello'

/** 生物识别不可用时，供 UI 展示的原因码 */
export type BiometricUnavailableReason =
  | 'notSupported'
  | 'moduleLoadFailed'
  | 'notConfigured'
  | 'deviceNotPresent'
  | 'disabledByPolicy'
  | 'deviceBusy'
  | 'touchIdUnavailable'
  | 'checkFailed'
  | 'unavailable'

export interface BiometricAvailability {
  available: boolean
  kind: BiometricKind | null
  unavailableReason: BiometricUnavailableReason | null
}

export const BIOMETRIC_UNAVAILABLE_I18N_KEY: Record<BiometricUnavailableReason, string> = {
  notSupported: 'settings.biometricUnavailableNotSupported',
  moduleLoadFailed: 'settings.biometricUnavailableModuleFailed',
  notConfigured: 'settings.biometricUnavailableNotConfigured',
  deviceNotPresent: 'settings.biometricUnavailableDeviceNotPresent',
  disabledByPolicy: 'settings.biometricUnavailableDisabledByPolicy',
  deviceBusy: 'settings.biometricUnavailableDeviceBusy',
  touchIdUnavailable: 'settings.biometricUnavailableTouchId',
  checkFailed: 'settings.biometricUnavailableCheckFailed',
  unavailable: 'settings.biometricUnavailableGeneric'
}
