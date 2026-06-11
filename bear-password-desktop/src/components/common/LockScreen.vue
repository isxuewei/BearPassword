<template>
  <Teleport to="body">
    <Transition name="lock-screen-fade">
      <div
        v-if="visible"
        class="lock-screen"
        :class="{
          'lock-screen--unlocking': phase === 'unlocking',
          'lock-screen--exiting': exiting
        }"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lock-screen-title"
      >
        <div class="lock-screen__backdrop" />

        <div
          class="lock-screen__card"
          :class="{
            'lock-screen__card--enter': phase === 'locking',
            'lock-screen__card--exit': exiting
          }"
        >
          <AnimatedPadlock
            :phase="padlockPhase"
            :shaking="shaking"
          />

          <Transition name="lock-screen-content" mode="out-in">
            <div v-if="phase === 'locking'" key="locking" class="lock-screen__status">
              <h2 class="lock-screen__title">{{ t('lock.locking') }}</h2>
              <p class="lock-screen__hint">{{ t('lock.pleaseWait') }}</p>
            </div>

            <div v-else-if="phase === 'unlocking'" key="unlocking" class="lock-screen__status">
              <h2 class="lock-screen__title lock-screen__title--success">{{ t('lock.unlockSuccess') }}</h2>
              <p class="lock-screen__hint">{{ t('lock.welcomeBack') }}</p>
            </div>

            <div v-else key="locked" class="lock-screen__locked">
              <h2 id="lock-screen-title" class="lock-screen__title">{{ t('lock.locked') }}</h2>
              <p class="lock-screen__subtitle">{{ authStore.username }}</p>
              <p class="lock-screen__hint">{{ t('lock.idleHint') }}</p>

              <el-form class="lock-screen__form" @submit.prevent="handleUnlock">
                <el-input
                  ref="passwordInputRef"
                  v-model="password"
                  type="password"
                  show-password
                  size="large"
                  :placeholder="t('lock.passwordPlaceholder')"
                  :prefix-icon="Lock"
                  @keyup.enter="handleUnlock"
                />
                <el-button
                  type="primary"
                  size="large"
                  class="lock-screen__submit"
                  :loading="loading"
                  @click="handleUnlock"
                >
                  {{ t('lock.unlock') }}
                </el-button>
              </el-form>

              <p v-if="errorMsg" class="lock-screen__error">{{ errorMsg }}</p>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Lock } from '@element-plus/icons-vue'
import type { InputInstance } from 'element-plus'
import AnimatedPadlock, { type PadlockPhase } from '@/components/common/AnimatedPadlock.vue'
import { useAuthStore } from '@/stores/auth'
import { useAutoLockStore } from '@/stores/autoLock'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

const LOCK_ANIM_MS = 900
/** 锁头开锁 +「解锁成功」停留 */
const UNLOCK_PLAY_MS = 1400
/** 卡片与遮罩淡出 */
const UNLOCK_EXIT_MS = 800

const authStore = useAuthStore()
const autoLockStore = useAutoLockStore()

const visible = ref(false)
const phase = ref<'locking' | 'locked' | 'unlocking'>('locking')
const exiting = ref(false)
const shaking = ref(false)
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const passwordInputRef = ref<InputInstance>()

let lockTimer: ReturnType<typeof setTimeout> | null = null
let unlockTimer: ReturnType<typeof setTimeout> | null = null
let shakeTimer: ReturnType<typeof setTimeout> | null = null

const padlockPhase = computed<PadlockPhase>(() => {
  if (phase.value === 'locking') return 'locking'
  if (phase.value === 'unlocking') return 'unlocking'
  return 'locked'
})

function clearTimers(): void {
  if (lockTimer) {
    clearTimeout(lockTimer)
    lockTimer = null
  }
  if (unlockTimer) {
    clearTimeout(unlockTimer)
    unlockTimer = null
  }
  if (shakeTimer) {
    clearTimeout(shakeTimer)
    shakeTimer = null
  }
}

function triggerShake(): void {
  shaking.value = true
  if (shakeTimer) clearTimeout(shakeTimer)
  shakeTimer = setTimeout(() => {
    shaking.value = false
  }, 480)
}

function startLockingSequence(): void {
  clearTimers()
  visible.value = true
  phase.value = 'locking'
  password.value = ''
  errorMsg.value = ''
  loading.value = false

  lockTimer = setTimeout(async () => {
    phase.value = 'locked'
    await nextTick()
    passwordInputRef.value?.focus()
  }, LOCK_ANIM_MS)
}

/** 展示锁定界面；skipAnimation 用于恢复锁定态或快捷键唤起 */
function presentLockScreen(skipAnimation: boolean): void {
  clearTimers()
  visible.value = true
  password.value = ''
  errorMsg.value = ''
  loading.value = false

  if (skipAnimation) {
    phase.value = 'locked'
    void nextTick(() => passwordInputRef.value?.focus())
    return
  }

  startLockingSequence()
}

function hideLockScreen(): void {
  clearTimers()
  visible.value = false
  phase.value = 'locking'
  exiting.value = false
}

function finishUnlockingSequence(): void {
  clearTimers()
  phase.value = 'unlocking'
  exiting.value = false

  unlockTimer = setTimeout(() => {
    exiting.value = true
    unlockTimer = setTimeout(() => {
      visible.value = false
      autoLockStore.unlock()
      phase.value = 'locking'
      exiting.value = false
    }, UNLOCK_EXIT_MS)
  }, UNLOCK_PLAY_MS)
}

watch(
  () => autoLockStore.isLocked,
  (locked, previous) => {
    if (locked) {
      presentLockScreen(previous !== false)
      return
    }
    if (previous) {
      hideLockScreen()
    }
  },
  { immediate: true, flush: 'sync' }
)

watch(
  () => autoLockStore.lockPresentToken,
  () => {
    if (autoLockStore.isLocked) {
      presentLockScreen(true)
    }
  }
)

async function handleUnlock(): Promise<void> {
  if (phase.value !== 'locked' || loading.value) return

  if (!password.value) {
    errorMsg.value = t('lock.passwordRequired')
    triggerShake()
    return
  }

  loading.value = true
  errorMsg.value = ''
  try {
    await authStore.login({
      username: authStore.username,
      password: password.value
    })
    password.value = ''
    finishUnlockingSequence()
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : t('lock.wrongPassword')
    triggerShake()
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

    &--enter {
      animation: lock-card-enter 0.55s cubic-bezier(0.22, 1, 0.36, 1);
    }

    &--exit {
      animation: lock-card-exit 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
  }

  &--unlocking &__backdrop {
    background: rgba(0, 0, 0, 0.58);
  }

  &--exiting &__backdrop {
    animation: lock-backdrop-out 0.8s ease forwards;
  }

  &__status,
  &__locked {
    min-height: 120px;
  }

  &__title {
    margin: $spacing-md 0 $spacing-xs;
    font-size: $font-size-xl;
    font-weight: 700;
    color: $color-text-primary;

    &--success {
      color: $color-success;
      animation: lock-success-pop 0.55s cubic-bezier(0.22, 1.2, 0.36, 1) 0.35s both;
    }
  }

  &__subtitle {
    margin: 0 0 $spacing-xs;
    font-size: $font-size-md;
    color: $color-text-secondary;
  }

  &__hint {
    margin: 0 0 $spacing-lg;
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  &__status &__hint {
    margin-bottom: 0;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__submit {
    width: 100%;
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

.lock-screen-content-enter-active,
.lock-screen-content-leave-active {
  transition: opacity 0.32s ease, transform 0.32s ease;
}

.lock-screen-content-enter-active {
  transition-delay: 0.08s;
}

.lock-screen-content-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.lock-screen-content-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@keyframes lock-card-enter {
  0% {
    opacity: 0;
    transform: scale(0.88) translateY(24px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes lock-card-exit {
  0% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  100% {
    opacity: 0;
    transform: scale(1.06) translateY(-18px);
  }
}

@keyframes lock-backdrop-out {
  0% {
    opacity: 1;
    backdrop-filter: blur(10px);
  }
  100% {
    opacity: 0;
    backdrop-filter: blur(0);
  }
}

@keyframes lock-success-pop {
  0% {
    opacity: 0;
    transform: scale(0.88) translateY(6px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
