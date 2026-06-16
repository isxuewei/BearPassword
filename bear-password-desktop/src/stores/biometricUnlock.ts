import { ref } from 'vue'
import { defineStore } from 'pinia'
import { storage } from '@/utils/storage'

const PREFER_BIOMETRIC_UNLOCK_KEY = 'prefer_biometric_unlock'

/**
 * 生物识别解锁偏好（与 autoLock 配合使用）
 */
export const useBiometricUnlockStore = defineStore('biometricUnlock', () => {
  const preferBiometricUnlock = ref(
    storage.get<boolean>(PREFER_BIOMETRIC_UNLOCK_KEY, false) === true
  )

  function setPreferBiometricUnlock(enabled: boolean): void {
    preferBiometricUnlock.value = enabled
    if (enabled) {
      storage.set(PREFER_BIOMETRIC_UNLOCK_KEY, true)
    } else {
      storage.remove(PREFER_BIOMETRIC_UNLOCK_KEY)
    }
  }

  return {
    preferBiometricUnlock,
    setPreferBiometricUnlock
  }
})
