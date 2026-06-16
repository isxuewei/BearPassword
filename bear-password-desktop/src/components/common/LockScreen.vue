<template>
  <Teleport to="body">
    <Transition name="lock-screen-fade">
      <div
        v-if="visible"
        class="lock-screen"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lock-screen-title"
      >
        <div class="lock-screen__backdrop" />

        <div class="lock-screen__card lock-screen__card--integrated">
          <div class="lock-screen__locked">
            <div class="lock-screen__app-icon lock-screen__app-icon--static">
              <img :src="logoUrl" alt="" class="lock-screen__app-icon-image" />
            </div>

            <h2 id="lock-screen-title" class="lock-screen__title lock-screen__title--app">
              {{ t('lock.lockedTitle') }}
            </h2>

            <p class="lock-screen__hint lock-screen__hint--integrated">
              {{ lockHintText }}
            </p>

            <el-form
              class="lock-screen__form lock-screen__form--integrated"
              @submit.prevent="handleUnlock"
            >
              <div class="lock-screen__unlock-row">
                <button
                  v-if="showBiometricUnlock"
                  type="button"
                  class="lock-screen__biometric-btn"
                  :class="{ 'lock-screen__biometric-btn--waiting': biometricLoading }"
                  :disabled="unlocking"
                  :aria-label="biometricButtonLabel"
                  @click="handleBiometricUnlock()"
                >
                  <BiometricFingerprintIcon />
                </button>
                <div
                  class="lock-screen__password-wrap"
                  :class="{ 'lock-screen__password-wrap--shake': passwordShaking }"
                >
                  <el-input
                    ref="passwordInputRef"
                    v-model="password"
                    type="password"
                    show-password
                    size="large"
                    class="lock-screen__password-input"
                    :class="{ 'lock-screen__password-input--error': passwordShaking }"
                    :placeholder="t('lock.passwordInputPlaceholder')"
                    :disabled="unlocking"
                    @mousedown="handlePasswordInteraction"
                    @keyup.enter="handleUnlock"
                  />
                </div>
              </div>
            </el-form>

            <p v-if="errorMsg" class="lock-screen__error">{{ errorMsg }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { InputInstance } from 'element-plus'
import logoUrl from '@/assets/logo.svg'
import BiometricFingerprintIcon from '@/components/common/BiometricFingerprintIcon.vue'
import { useAuthStore } from '@/stores/auth'
import { useAutoLockStore } from '@/stores/autoLock'
import { useBiometricUnlockStore } from '@/stores/biometricUnlock'
import { useSecurityStore } from '@/stores/security'
import { useI18n } from '@/composables/useI18n'
import { verifyVaultUnlockContext } from '@/utils/vaultUnlockVerify'
import { isUnauthorizedError } from '@/utils/request'
import {
  clearPersistedVaultPassword,
  loadPersistedVaultPassword,
  persistVaultPassword
} from '@/utils/vaultPasswordStorage'

const { t } = useI18n()

const BIOMETRIC_AUTO_PROMPT_DELAY_MS = 350
const BIOMETRIC_WINDOW_FOCUS_TIMEOUT_MS = 2500

const router = useRouter()
const authStore = useAuthStore()
const autoLockStore = useAutoLockStore()
const biometricUnlockStore = useBiometricUnlockStore()
const securityStore = useSecurityStore()

const visible = ref(false)
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const biometricLoading = ref(false)
const biometricAvailable = ref(false)
const biometricKind = ref<'touchId' | 'windowsHello' | null>(null)
/** 本机已保存主密码（至少成功解锁过一次）时才允许生物识别 */
const hasPersistedVaultPassword = ref(false)
const passwordInputRef = ref<InputInstance>()
const passwordShaking = ref(false)

const unlocking = computed(() => loading.value || biometricLoading.value)

const showBiometricUnlock = computed(
  () =>
    hasPersistedVaultPassword.value &&
    biometricAvailable.value &&
    biometricUnlockStore.preferBiometricUnlock
)

const lockHintText = computed(() => {
  if (showBiometricUnlock.value) {
    return t('lock.integratedHint')
  }
  return t('lock.idleHint')
})

const biometricButtonLabel = computed(() => {
  if (biometricKind.value === 'touchId') return t('lock.biometricTouchId')
  if (biometricKind.value === 'windowsHello') return t('lock.biometricWindowsHello')
  return t('lock.biometricUnlock')
})

let biometricAutoPromptTimer: ReturnType<typeof setTimeout> | null = null
let passwordShakeTimer: ReturnType<typeof setTimeout> | null = null

const PASSWORD_SHAKE_MS = 480

function clearBiometricAutoPromptTimer(): void {
  if (biometricAutoPromptTimer) {
    clearTimeout(biometricAutoPromptTimer)
    biometricAutoPromptTimer = null
  }
}

function clearTimers(): void {
  clearBiometricAutoPromptTimer()
  if (passwordShakeTimer) {
    clearTimeout(passwordShakeTimer)
    passwordShakeTimer = null
  }
}

function isWrongPasswordError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  return err.message === t('lock.wrongPassword')
}

async function triggerPasswordShake(): Promise<void> {
  errorMsg.value = ''
  password.value = ''
  if (passwordShakeTimer) {
    clearTimeout(passwordShakeTimer)
    passwordShakeTimer = null
  }
  passwordShaking.value = false
  await nextTick()
  passwordShaking.value = true
  passwordShakeTimer = setTimeout(() => {
    passwordShaking.value = false
    passwordShakeTimer = null
  }, PASSWORD_SHAKE_MS)
  await focusPasswordInput()
}

function shouldAutoPromptBiometric(autoPromptBiometric: boolean): boolean {
  return autoPromptBiometric && showBiometricUnlock.value
}

async function waitForWindowFocus(timeoutMs = BIOMETRIC_WINDOW_FOCUS_TIMEOUT_MS): Promise<void> {
  if (document.hasFocus()) return

  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener('focus', onFocus)
      resolve()
    }, timeoutMs)

    const onFocus = (): void => {
      window.clearTimeout(timeout)
      window.removeEventListener('focus', onFocus)
      resolve()
    }

    window.addEventListener('focus', onFocus)
  })
}

function scheduleBiometricAutoPrompt(): void {
  clearBiometricAutoPromptTimer()
  if (!showBiometricUnlock.value) return

  biometricAutoPromptTimer = setTimeout(() => {
    biometricAutoPromptTimer = null
    void handleBiometricUnlock({ silent: true })
  }, BIOMETRIC_AUTO_PROMPT_DELAY_MS)
}

async function refreshBiometricAvailability(): Promise<void> {
  biometricAvailable.value = false
  biometricKind.value = null
  hasPersistedVaultPassword.value = false

  const persisted = await loadPersistedVaultPassword()
  hasPersistedVaultPassword.value = !!persisted

  if (!window.biometricApi) return

  try {
    const availability = await window.biometricApi.getAvailability()
    biometricAvailable.value = availability.available
    biometricKind.value = availability.kind
  } catch {
    biometricAvailable.value = false
    biometricKind.value = null
  }
}

async function focusPasswordInput(): Promise<void> {
  await waitForWindowFocus()
  await nextTick()

  passwordInputRef.value?.focus()
  passwordInputRef.value?.select()

  const inputEl = passwordInputRef.value?.input
  if (!(inputEl instanceof HTMLInputElement)) return
  if (document.activeElement === inputEl) return

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 120)
  })
  await nextTick()
  passwordInputRef.value?.focus()
  passwordInputRef.value?.select()
}

function isBiometricCanceled(result: { canceled: boolean; error?: string }): boolean {
  if (result.canceled) return true
  const message = result.error?.trim() ?? ''
  return message.includes('取消') || /cancel/i.test(message)
}

async function onLockScreenReady(autoPromptBiometric: boolean): Promise<void> {
  await refreshBiometricAvailability()

  if (shouldAutoPromptBiometric(autoPromptBiometric)) {
    await waitForWindowFocus()
    await nextTick()
    scheduleBiometricAutoPrompt()
    return
  }

  await focusPasswordInput()
}

function presentLockScreen(): void {
  clearTimers()
  visible.value = true
  password.value = ''
  errorMsg.value = ''
  passwordShaking.value = false
  loading.value = false
  void onLockScreenReady(true)
}

function hideLockScreen(): void {
  clearTimers()
  visible.value = false
}

function handlePasswordInteraction(): void {
  clearBiometricAutoPromptTimer()
}

function redirectToLoginIfNeeded(): void {
  hideLockScreen()
  if (authStore.isLoggedIn) return
  if (router.currentRoute.value.name !== 'Login') {
    void router.replace({ name: 'Login' })
  }
}

function handleUnlockError(err: unknown): void {
  if (isUnauthorizedError(err)) {
    redirectToLoginIfNeeded()
    return
  }
  if (isWrongPasswordError(err)) {
    void triggerPasswordShake()
    return
  }
  errorMsg.value = err instanceof Error ? err.message : t('lock.wrongPassword')
}

watch(
  () => ({ locked: autoLockStore.isLocked, loggedIn: authStore.isLoggedIn }),
  ({ locked, loggedIn }) => {
    if (!loggedIn || !locked) {
      hideLockScreen()
      if (!loggedIn && router.currentRoute.value.name !== 'Login') {
        void router.replace({ name: 'Login' })
      }
      return
    }
    presentLockScreen()
  },
  { immediate: true, flush: 'sync' }
)

watch(
  () => autoLockStore.lockPresentToken,
  () => {
    if (autoLockStore.isLocked && authStore.isLoggedIn) {
      presentLockScreen()
    }
  }
)

function handleWindowVisibilityChange(): void {
  if (!autoLockStore.isLocked || visible.value || document.hidden) return
  autoLockStore.requestLockPresentation()
}

onMounted(() => {
  document.addEventListener('visibilitychange', handleWindowVisibilityChange)
  window.addEventListener('focus', handleWindowVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleWindowVisibilityChange)
  window.removeEventListener('focus', handleWindowVisibilityChange)
})

async function completeUnlock(): Promise<boolean> {
  if (!securityStore.hasVaultAccess) {
    errorMsg.value = t('lock.securityKeyMissing')
    return false
  }

  password.value = ''
  hideLockScreen()
  autoLockStore.unlock()
  return true
}

async function unlockWithMasterPassword(masterPassword: string): Promise<boolean> {
  try {
    await securityStore.unlockWithMasterPassword(masterPassword)
  } catch (err) {
    throw err instanceof Error ? err : new Error(t('lock.wrongPassword'))
  }

  const unlock = securityStore.getUnlockContext()
  if (!unlock) {
    throw new Error(t('lock.wrongPassword'))
  }

  const verified = await verifyVaultUnlockContext(unlock)
  if (!verified) {
    securityStore.unloadFromMemory()
    throw new Error(t('lock.wrongPassword'))
  }

  const persisted = await persistVaultPassword(masterPassword)
  if (!persisted.ok && biometricUnlockStore.preferBiometricUnlock) {
    console.warn('[lock] vault password persist failed:', persisted.error)
  }

  return completeUnlock()
}

async function handleBiometricUnlock(options: { silent?: boolean } = {}): Promise<void> {
  if (!visible.value || unlocking.value || !showBiometricUnlock.value) return
  if (!window.biometricApi) return

  clearBiometricAutoPromptTimer()
  biometricLoading.value = true
  errorMsg.value = ''
  let focusPasswordAfterCancel = false
  try {
    const result = await window.biometricApi.prompt(t('lock.biometricReason'))
    if (!result.ok) {
      if (isBiometricCanceled(result)) {
        errorMsg.value = ''
        focusPasswordAfterCancel = true
      } else if (!options.silent && result.error) {
        errorMsg.value = result.error
      }
      return
    }

    const storedPassword = await loadPersistedVaultPassword()
    if (!storedPassword) {
      if (!options.silent) {
        errorMsg.value = t('lock.biometricPasswordMissing')
      }
      focusPasswordAfterCancel = true
      return
    }

    try {
      const unlocked = await unlockWithMasterPassword(storedPassword)
      if (!unlocked) {
        focusPasswordAfterCancel = true
      }
    } catch (err) {
      await clearPersistedVaultPassword()
      if (isUnauthorizedError(err)) {
        redirectToLoginIfNeeded()
      } else if (isWrongPasswordError(err)) {
        await triggerPasswordShake()
      } else if (!options.silent) {
        errorMsg.value = err instanceof Error ? err.message : t('lock.wrongPassword')
      }
      focusPasswordAfterCancel = true
    }
  } catch (err) {
    if (!options.silent) {
      errorMsg.value = err instanceof Error ? err.message : t('lock.biometricFailed')
    }
  } finally {
    biometricLoading.value = false
    if (focusPasswordAfterCancel) {
      void focusPasswordInput()
    }
  }
}

async function handleUnlock(): Promise<void> {
  if (!visible.value || unlocking.value) return

  if (!password.value.trim()) {
    void triggerPasswordShake()
    return
  }

  clearBiometricAutoPromptTimer()
  loading.value = true
  errorMsg.value = ''
  try {
    const unlocked = await unlockWithMasterPassword(password.value)
    if (!unlocked) return
  } catch (err) {
    handleUnlockError(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.lock-screen {
  position: fixed;
  inset: 0;
  z-index: 10000;
  @include flex-center;
  padding: $spacing-xl;

  &__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.62);
    backdrop-filter: blur(10px);
  }

  &__card {
    position: relative;
    z-index: 1;
    width: min(400px, 100%);
    padding: $spacing-xl $spacing-xl $spacing-lg;
    border-radius: $radius-xl;
    background: $color-bg-elevated;
    border: 1px solid $color-border;
    box-shadow: $shadow-lg, 0 0 60px rgba(108, 92, 231, 0.12);
    text-align: center;
    overflow: hidden;

    &--integrated {
      width: min(420px, 100%);
      padding: $spacing-xl $spacing-xl $spacing-xl;
      border-radius: 18px;
    }
  }

  &__locked {
    min-height: 120px;
  }

  &__app-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    margin: 0 auto $spacing-md;
    padding: 0;
    border: none;
    border-radius: 16px;
    background: transparent;

    &--static {
      cursor: default;
    }
  }

  &__app-icon-image {
    width: 72px;
    height: 72px;
    border-radius: 16px;
    object-fit: contain;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  &__unlock-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__biometric-btn {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: none;
    border-radius: $radius-md;
    background: $color-bg-elevated;
    box-shadow: 0 0 0 1px $color-border inset;
    cursor: pointer;
    transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

    &--waiting {
      animation: lock-touch-id-pulse 1.4s ease-in-out infinite;
    }

    &:hover:not(:disabled) {
      background: $color-surface-hover;
      box-shadow: 0 0 0 1px $color-border-hover inset;
    }

    &:active:not(:disabled) {
      transform: scale(0.98);
    }

    &:disabled {
      cursor: wait;
      opacity: 0.72;
    }
  }

  &__password-wrap {
    flex: 1;
    min-width: 0;

    &--shake {
      animation: lock-password-shake 0.48s ease;
    }
  }

  &__password-input {
    width: 100%;

    &--error :deep(.el-input__wrapper),
    &--error :deep(.el-input__wrapper.is-focus) {
      box-shadow: 0 0 0 2px $color-danger inset !important;
    }
  }

  &__title {
    margin: $spacing-md 0 $spacing-xs;
    font-size: $font-size-xl;
    font-weight: 700;
    color: $color-text-primary;

    &--app {
      margin-top: 0;
      font-size: $font-size-lg;
      font-weight: 600;
    }
  }

  &__hint {
    margin: 0 0 $spacing-lg;
    font-size: $font-size-sm;
    color: $color-text-muted;
    line-height: 1.55;

    &--integrated {
      max-width: 320px;
      margin-left: auto;
      margin-right: auto;
      margin-bottom: $spacing-md;
      color: $color-text-secondary;
    }
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;

    &--integrated {
      max-width: 300px;
      margin: 0 auto;
    }
  }

  &__error {
    margin: $spacing-md 0 0;
    font-size: $font-size-sm;
    color: $color-danger;
  }
}

.lock-screen-fade-enter-active,
.lock-screen-fade-leave-active {
  transition: opacity 0.35s ease;
}

.lock-screen-fade-enter-from,
.lock-screen-fade-leave-to {
  opacity: 0;
}

@keyframes lock-touch-id-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.04);
  }
}

@keyframes lock-password-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-8px);
  }
  40% {
    transform: translateX(8px);
  }
  60% {
    transform: translateX(-5px);
  }
  80% {
    transform: translateX(5px);
  }
}
</style>
