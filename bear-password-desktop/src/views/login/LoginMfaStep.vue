<template>
  <div class="auth-panel">
    <div class="auth-panel__header">
      <AppLogo size="lg" />
      <p class="auth-panel__subtitle">{{ t('login.mfaTitle') }}</p>
    </div>

    <p class="auth-panel__hint">{{ t('login.mfaHint') }}</p>

    <div class="auth-panel__mfa-block">
      <el-input
        v-model="totpCode"
        :placeholder="t('login.mfaTotpPlaceholder')"
        size="large"
        maxlength="6"
        inputmode="numeric"
        @keyup.enter="handleTotpSubmit"
      />
      <el-button
        type="primary"
        size="large"
        class="auth-panel__submit"
        :loading="loading"
        @click="handleTotpSubmit"
      >
        {{ t('login.mfaTotpSubmit') }}
      </el-button>
    </div>

    <p class="auth-panel__error">{{ errorMsg }}</p>

    <button type="button" class="auth-panel__back" @click="emit('back')">
      {{ t('login.mfaBack') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppLogo from '@/components/common/AppLogo.vue'
import { completeTotpLoginApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import type { MfaLoginChallenge } from '@/types/auth'

const props = defineProps<{
  challenge: MfaLoginChallenge
}>()

const emit = defineEmits<{
  back: []
  success: []
}>()

const authStore = useAuthStore()
const { t } = useI18n()

const totpCode = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleTotpSubmit(): Promise<void> {
  if (loading.value) return
  errorMsg.value = ''
  const code = totpCode.value.trim()
  if (!/^\d{6}$/.test(code)) {
    errorMsg.value = t('login.mfaTotpInvalid')
    return
  }

  loading.value = true
  try {
    const result = await completeTotpLoginApi(props.challenge.mfaToken, code)
    await authStore.applyLoginResult(result)
    emit('success')
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.auth-panel__hint {
  margin: 0 0 20px;
  font-size: 13px;
  color: $color-text-secondary;
  text-align: center;
  line-height: 1.5;
}

.auth-panel__mfa-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auth-panel__back {
  display: block;
  width: 100%;
  margin-top: 16px;
  padding: 0;
  border: none;
  background: none;
  color: $color-text-secondary;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    color: $color-accent;
  }
}
</style>
