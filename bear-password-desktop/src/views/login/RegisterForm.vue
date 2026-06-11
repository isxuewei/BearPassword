<template>
  <div class="auth-panel">
    <div class="auth-panel__header">
      <AppLogo size="lg" />
      <p class="auth-panel__subtitle">{{ t('register.title') }}</p>
    </div>

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
            {{ countdown > 0 ? `${countdown}s` : codeSent ? t('register.resendCode') : t('register.sendCode') }}
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
          :placeholder="t('register.password')"
          size="large"
          :prefix-icon="Lock"
          show-password
        />
      </el-form-item>

      <el-form-item prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          :placeholder="t('register.confirmPassword')"
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
        :loading="authStore.loading"
        @click="handleRegister"
      >
        {{ t('register.submit') }}
      </el-button>
    </el-form>

    <p class="auth-panel__error">{{ errorMsg }}</p>

    <router-link :to="{ name: 'Login' }" class="auth-panel__link">
      {{ t('register.loginLink') }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Message, Key } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import AppLogo from '@/components/common/AppLogo.vue'
import { sendRegisterCodeApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const formRef = ref<FormInstance>()
const errorMsg = ref('')
const codeSending = ref(false)
const codeSent = ref(false)
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  email: '',
  code: '',
  username: '',
  password: '',
  confirmPassword: ''
})

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
    ElMessage.success('验证码已发送，请查收邮件')
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '验证码发送失败'
  } finally {
    codeSending.value = false
  }
}

async function handleRegister(): Promise<void> {
  errorMsg.value = ''
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    await authStore.register({
      email: form.email.trim(),
      code: form.code.trim(),
      username: form.username.trim(),
      password: form.password
    })
    router.push({ name: 'Dashboard' })
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '注册失败'
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
