<template>
  <div class="auth-panel" :class="{ 'auth-panel--kit': step === 'kit' }">
    <div class="auth-panel__header">
      <AppLogo size="lg" />
      <p class="auth-panel__subtitle">
        {{ step === 'kit' ? t('register.emergencyKitTitle') : t('register.title') }}
      </p>
      <p v-if="step === 'kit'" class="auth-panel__step-hint">{{ t('register.emergencyKitStepHint') }}</p>
    </div>

    <template v-if="step === 'form'">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="auth-panel__form"
        @submit.prevent="handleRegister"
      >
        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            :placeholder="t('register.email')"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item prop="code">
          <div class="register-form__code-row">
            <el-input
              v-model="form.code"
              :placeholder="t('register.code')"
              size="large"
              maxlength="6"
              :prefix-icon="Key"
              @keyup.enter="handleRegister"
            />
            <el-button
              size="large"
              class="register-form__code-btn"
              :disabled="codeSending || countdown > 0"
              :loading="codeSending"
              @click="handleSendCode"
            >
              {{
                countdown > 0
                  ? `${countdown}s`
                  : codeSent
                    ? t('register.resendCode')
                    : t('register.sendCode')
              }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            :placeholder="t('register.username')"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            :placeholder="t('register.loginPassword')"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            :placeholder="t('register.confirmLoginPassword')"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="masterPassword">
          <el-input
            v-model="form.masterPassword"
            type="password"
            :placeholder="t('register.masterPassword')"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="confirmMasterPassword">
          <el-input
            v-model="form.confirmMasterPassword"
            type="password"
            :placeholder="t('register.confirmMasterPassword')"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleRegister"
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="auth-panel__submit"
          :loading="preparingVault"
          @click="handleRegister"
        >
          {{ t('register.submit') }}
        </el-button>
      </el-form>

      <p v-if="errorMsg" class="auth-panel__error">{{ errorMsg }}</p>

      <router-link :to="{ name: 'Login' }" class="auth-panel__link">
        {{ t('register.loginLink') }}
      </router-link>
    </template>

    <template v-else>
      <EmergencyKitStep
        :username="form.username.trim()"
        :account-secret-key="pendingVault.accountSecretKey"
        :secret-key-fingerprint="pendingVault.secretKeyFingerprint"
        :loading="authStore.loading"
        @confirm="handleEmergencyKitConfirmed"
        @back="handleKitBack"
      />

      <p v-if="errorMsg" class="auth-panel__error">{{ errorMsg }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Message, Key } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import AppLogo from '@/components/common/AppLogo.vue'
import EmergencyKitStep from '@/components/auth/EmergencyKitStep.vue'
import { sendRegisterCodeApi, createSrpCredentials } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import type { RegisterParams } from '@/types'
import { buildEmergencyKitFileContent } from '@/utils/vaultCrypto/emergencyKit'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const emit = defineEmits<{
  kitStepChange: [active: boolean]
}>()

type RegisterStep = 'form' | 'kit'

const formRef = ref<FormInstance>()
const errorMsg = ref('')
const codeSending = ref(false)
const codeSent = ref(false)
const countdown = ref(0)
const preparingVault = ref(false)
const step = ref<RegisterStep>('form')
const pendingVault = ref({
  accountSecretKey: '',
  secretKeyFingerprint: '',
  vaultCrypto: null as RegisterParams['vaultCrypto'] | null
})
let countdownTimer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  email: '',
  code: '',
  username: '',
  password: '',
  confirmPassword: '',
  masterPassword: '',
  confirmMasterPassword: ''
})

watch(
  step,
  (value) => {
    emit('kitStepChange', value === 'kit')
  },
  { immediate: true }
)

const rules = computed<FormRules>(() => ({
  email: [
    { required: true, message: t('register.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('register.emailInvalid'), trigger: 'blur' }
  ],
  code: [
    { required: true, message: t('register.codeRequired'), trigger: 'blur' },
    { pattern: /^\d{6}$/, message: t('register.codeInvalid'), trigger: 'blur' }
  ],
  username: [
    { required: true, message: t('register.usernameRequired'), trigger: 'blur' },
    { min: 2, max: 32, message: t('register.usernameLength'), trigger: 'blur' },
    {
      pattern: /^[\u4e00-\u9fff\w]+$/,
      message: t('register.usernamePattern'),
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: t('register.passwordRequired'), trigger: 'blur' },
    { min: 6, max: 64, message: t('register.passwordLength'), trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: t('register.confirmPasswordRequired'), trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.password) {
          callback(new Error(t('register.passwordMismatch')))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  masterPassword: [
    { required: true, message: t('register.masterPasswordRequired'), trigger: 'blur' },
    { min: 6, max: 64, message: t('register.passwordLength'), trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value === form.password) {
          callback(new Error(t('register.masterPasswordMustDiffer')))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  confirmMasterPassword: [
    { required: true, message: t('register.confirmMasterPasswordRequired'), trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.masterPassword) {
          callback(new Error(t('register.masterPasswordMismatch')))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}))

function startCountdown(seconds = 60): void {
  countdown.value = seconds
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

async function handleSendCode(): Promise<void> {
  if (codeSending.value || countdown.value > 0) return

  const emailValid = await formRef.value?.validateField('email').catch(() => false)
  if (!emailValid) return

  codeSending.value = true
  errorMsg.value = ''
  try {
    await sendRegisterCodeApi({ email: form.email.trim() })
    codeSent.value = true
    startCountdown()
    ElMessage.success(t('register.codeSent'))
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : t('register.codeSendFailed')
  } finally {
    codeSending.value = false
  }
}

async function handleRegister(): Promise<void> {
  errorMsg.value = ''
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  preparingVault.value = true
  try {
    const prepared = await authStore.prepareRegistrationVault()
    pendingVault.value = {
      accountSecretKey: prepared.accountSecretKey,
      secretKeyFingerprint: prepared.vaultCrypto.secretKeyFingerprint,
      vaultCrypto: prepared.vaultCrypto
    }
    step.value = 'kit'
  } catch (err) {
    const message = err instanceof Error ? err.message : t('register.failed')
    errorMsg.value = message
    ElMessage.error(message)
  } finally {
    preparingVault.value = false
  }
}

function handleKitBack(): void {
  step.value = 'form'
  errorMsg.value = ''
}

async function handleEmergencyKitConfirmed(): Promise<void> {
  if (!pendingVault.value.vaultCrypto) return

  errorMsg.value = ''
  try {
    const username = form.username.trim()
    const srp = await createSrpCredentials(username, form.password)
    const emergencyKitContent = buildEmergencyKitFileContent({
      version: 2,
      username,
      accountSecretKey: pendingVault.value.accountSecretKey,
      secretKeyFingerprint: pendingVault.value.secretKeyFingerprint,
      createdAt: new Date().toLocaleString()
    })
    const result = await authStore.register({
      email: form.email.trim(),
      code: form.code.trim(),
      username,
      srp,
      vaultCrypto: pendingVault.value.vaultCrypto,
      emergencyKitContent,
      masterPassword: form.masterPassword,
      accountSecretKey: pendingVault.value.accountSecretKey
    })
    if (result.emergencyKitEmailSent) {
      ElMessage.success(t('register.emergencyKitEmailSent'))
    } else {
      ElMessage.warning(t('register.emergencyKitEmailSkipped'))
    }
    router.push({ name: 'Dashboard' })
  } catch (err) {
    const message = err instanceof Error ? err.message : t('register.failed')
    errorMsg.value = message
    ElMessage.error(message)
    step.value = 'kit'
  }
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped lang="scss">
.register-form {
  &__code-row {
    display: flex;
    gap: $spacing-sm;
    width: 100%;
  }

  &__code-btn {
    flex-shrink: 0;
    min-width: 108px;
    border-radius: $radius-md !important;
  }
}
</style>

<style lang="scss">
.auth-panel {
  &__step-hint {
    margin: $spacing-xs 0 0;
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  &--kit {
    .auth-panel__header {
      margin-bottom: $spacing-lg;
    }
  }
}
</style>
