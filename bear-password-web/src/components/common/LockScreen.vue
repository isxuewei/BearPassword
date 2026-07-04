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
              {{ t('lock.idleHint') }}
            </p>

            <el-form
              class="lock-screen__form lock-screen__form--integrated"
              @submit.prevent="handleUnlock"
            >
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
                  :disabled="loading"
                  @keyup.enter="handleUnlock"
                />
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
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { InputInstance } from 'element-plus'
import logoUrl from '@/assets/logo.svg'
import { useAuthStore } from '@/stores/auth'
import { useAutoLockStore } from '@/stores/autoLock'
import { useSecurityStore } from '@/stores/security'
import { useI18n } from '@/composables/useI18n'
import { verifyVaultUnlockContext } from '@/utils/vaultUnlockVerify'
import { isUnauthorizedError } from '@/utils/request'
import {
  clearPersistedVaultPassword,
  isRememberMasterPasswordEnabled,
  loadPersistedVaultPassword,
  persistVaultPassword
} from '@/utils/vaultPasswordStorage'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const autoLockStore = useAutoLockStore()
const securityStore = useSecurityStore()

const visible = ref(false)
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const passwordInputRef = ref<InputInstance>()
const passwordShaking = ref(false)

let autoUnlockAttemptId = 0
let passwordShakeTimer: ReturnType<typeof setTimeout> | null = null
const PASSWORD_SHAKE_MS = 480

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

async function focusPasswordInput(): Promise<void> {
  await nextTick()
  passwordInputRef.value?.focus()
}

async function trySilentAutoUnlock(): Promise<boolean> {
  if (!isRememberMasterPasswordEnabled()) return false

  const storedPassword = await loadPersistedVaultPassword()
  if (!storedPassword) return false

  try {
    return await unlockWithMasterPassword(storedPassword)
  } catch (err) {
    if (isUnauthorizedError(err)) {
      redirectToLoginIfNeeded()
      return false
    }
    await clearPersistedVaultPassword()
    return false
  }
}

async function handleLockRequired(): Promise<void> {
  const attemptId = ++autoUnlockAttemptId
  visible.value = false
  password.value = ''
  errorMsg.value = ''
  passwordShaking.value = false
  loading.value = false

  const autoUnlocked = await trySilentAutoUnlock()
  if (attemptId !== autoUnlockAttemptId) return
  if (autoUnlocked) return

  visible.value = true
  await focusPasswordInput()
}

function hideLockScreen(): void {
  autoUnlockAttemptId += 1
  visible.value = false
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
  () => ({
    locked: autoLockStore.isLocked,
    loggedIn: authStore.isLoggedIn,
    needsUnlock: securityStore.needsVaultUnlock
  }),
  ({ locked, loggedIn, needsUnlock }) => {
    if (!loggedIn || !locked || !needsUnlock) {
      hideLockScreen()
      if (!loggedIn && router.currentRoute.value.name !== 'Login') {
        void router.replace({ name: 'Login' })
      }
      return
    }
    void handleLockRequired()
  },
  { immediate: true, flush: 'sync' }
)

watch(
  () => autoLockStore.lockPresentToken,
  () => {
    if (autoLockStore.isLocked && authStore.isLoggedIn && securityStore.needsVaultUnlock) {
      void handleLockRequired()
    }
  }
)

onMounted(() => {
  if (
    autoLockStore.isLocked &&
    authStore.isLoggedIn &&
    securityStore.needsVaultUnlock &&
    !document.hidden
  ) {
    autoLockStore.requestLockPresentation()
  }
})

onUnmounted(() => {
  if (passwordShakeTimer) {
    clearTimeout(passwordShakeTimer)
  }
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
  let derivedVuk: Uint8Array
  try {
    derivedVuk = await securityStore.deriveVukForMasterPassword(masterPassword)
  } catch (err) {
    throw err instanceof Error ? err : new Error(t('lock.wrongPassword'))
  }

  const verified = await verifyVaultUnlockContext({ vuk: derivedVuk }, { masterPassword })
  if (!verified) {
    throw new Error(t('lock.wrongPassword'))
  }

  await securityStore.reloadFromStorage()
  securityStore.applyVaultUnlock(derivedVuk)

  const persisted = await persistVaultPassword(masterPassword)
  if (!persisted.ok) {
    console.warn('[lock] vault password persist failed:', persisted.error)
  }

  return completeUnlock()
}

async function handleUnlock(): Promise<void> {
  if (!visible.value || loading.value) return

  if (!password.value.trim()) {
    void triggerPasswordShake()
    return
  }

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
  z-index: 5000;
  @include flex-center;
  padding: $spacing-xl;

  &__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.55);
    backdrop-filter: blur(8px);
  }

  &__card {
    position: relative;
    z-index: 1;
    width: min(420px, 100%);
    padding: $spacing-xl;
    border-radius: $radius-xl;
    background: $color-bg-elevated;
    border: 1px solid $color-border;
    box-shadow: $shadow-lg;
    text-align: center;
  }

  &__app-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto $spacing-md;
    border-radius: $radius-lg;
    overflow: hidden;
  }

  &__app-icon-image {
    width: 100%;
    height: 100%;
    display: block;
  }

  &__title {
    margin: 0 0 $spacing-sm;
    font-size: $font-size-xl;
    font-weight: 700;
    color: $color-text-primary;
  }

  &__hint {
    margin: 0 0 $spacing-lg;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    line-height: 1.5;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__password-wrap {
    width: 100%;

    &--shake {
      animation: lock-shake 0.45s ease;
    }
  }

  &__password-input {
    width: 100%;
  }

  &__error {
    margin: $spacing-md 0 0;
    font-size: $font-size-sm;
    color: $color-danger;
    line-height: 1.5;
  }
}

.lock-screen-fade-enter-active,
.lock-screen-fade-leave-active {
  transition: opacity $transition-fast;

  .lock-screen__card {
    transition: transform $transition-fast, opacity $transition-fast;
  }
}

.lock-screen-fade-enter-from,
.lock-screen-fade-leave-to {
  opacity: 0;

  .lock-screen__card {
    transform: scale(0.98);
    opacity: 0;
  }
}

@keyframes lock-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-6px);
  }
  40%,
  80% {
    transform: translateX(6px);
  }
}

@media (max-width: 767px) {
  .lock-screen {
    padding: $spacing-md;
    align-items: flex-end;
    padding-bottom: calc($spacing-xl + env(safe-area-inset-bottom));
  }

  .lock-screen__card {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
}
</style>
