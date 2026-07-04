<template>
  <div class="auth-panel">
    <LoginMfaStep
      v-if="mfaChallenge"
      :challenge="mfaChallenge"
      @back="mfaChallenge = null"
      @success="onMfaSuccess"
    />

    <template v-else>
      <div class="auth-panel__header">
        <AppLogo size="lg" />
        <p class="auth-panel__subtitle">{{ t('login.title') }}</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="auth-panel__form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            :placeholder="t('login.username')"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            :placeholder="t('login.password')"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="auth-panel__submit"
          :loading="authStore.loading"
          @click="handleLogin"
        >
          {{ t('login.submit') }}
        </el-button>
      </el-form>

      <p class="auth-panel__error">{{ errorMsg }}</p>

      <router-link :to="{ name: 'Register' }" class="auth-panel__link">
        {{ t('login.registerLink') }}
      </router-link>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import AppLogo from '@/components/common/AppLogo.vue'
import LoginMfaStep from '@/views/login/LoginMfaStep.vue'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import { getErrorMessage } from '@/utils/apiErrorMessage'
import { isMfaLoginChallenge, type MfaLoginChallenge } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const formRef = ref<FormInstance>()
const errorMsg = ref('')
const mfaChallenge = ref<MfaLoginChallenge | null>(null)

const form = reactive({
  username: '',
  password: ''
})

const rules = computed<FormRules>(() => ({
  username: [{ required: true, message: t('login.usernameRequired'), trigger: 'blur' }],
  password: [{ required: true, message: t('login.passwordRequired'), trigger: 'blur' }]
}))

async function handleLogin(): Promise<void> {
  errorMsg.value = ''
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    const result = await authStore.login({ username: form.username.trim(), password: form.password })
    if (isMfaLoginChallenge(result)) {
      mfaChallenge.value = result
      return
    }
    navigateAfterLogin()
  } catch (err) {
    errorMsg.value = getErrorMessage(err, '登录失败，请稍后重试')
  }
}

function navigateAfterLogin(): void {
  void router.replace({ name: 'Dashboard' })
}

function onMfaSuccess(): void {
  navigateAfterLogin()
}
</script>
