<template>
  <Teleport to="body">
    <el-dialog
      :model-value="visible"
      :title="t('vaultSetup.title')"
      width="480px"
      class="vault-setup-dialog"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      append-to-body
      align-center
    >
      <p class="vault-setup-dialog__intro">{{ t('vaultSetup.intro') }}</p>

      <el-form class="vault-setup-dialog__form" label-position="top" @submit.prevent="handleSubmit">
        <el-form-item :label="t('vaultSetup.masterPasswordLabel')">
          <el-input
            v-model="masterPassword"
            type="password"
            show-password
            size="large"
            class="vault-setup-dialog__field"
            :placeholder="t('vaultSetup.masterPasswordPlaceholder')"
            :disabled="loading"
            autocomplete="off"
          />
        </el-form-item>

        <el-form-item :label="t('vaultSetup.securityKeyLabel')">
          <el-input
            v-model="accountSecretKey"
            type="password"
            show-password
            size="large"
            class="vault-setup-dialog__field vault-setup-dialog__field--secret"
            :placeholder="t('vaultSetup.securityKeyPlaceholder')"
            :disabled="loading"
            autocomplete="off"
          />
        </el-form-item>

        <p v-if="errorMsg" class="vault-setup-dialog__error">{{ errorMsg }}</p>

        <p class="vault-setup-dialog__hint">{{ t('vaultSetup.hint') }}</p>
      </el-form>

      <template #footer>
        <div class="vault-setup-dialog__footer">
          <el-button
            type="primary"
            size="large"
            class="vault-setup-dialog__submit"
            :loading="loading"
            @click="handleSubmit"
          >
            {{ t('vaultSetup.submit') }}
          </el-button>
          <button type="button" class="vault-setup-dialog__logout" :disabled="loading" @click="handleLogout">
            {{ t('vaultSetup.logout') }}
          </button>
        </div>
      </template>
    </el-dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useSecurityStore } from '@/stores/security'
import { useI18n } from '@/composables/useI18n'
import { completeLocalVaultSetup, LocalVaultSetupError } from '@/utils/localVaultSetup'

const router = useRouter()
const authStore = useAuthStore()
const securityStore = useSecurityStore()
const { t } = useI18n()

const masterPassword = ref('')
const accountSecretKey = ref('')
const loading = ref(false)
const errorMsg = ref('')

const visible = computed(
  () =>
    authStore.isLoggedIn &&
    securityStore.isVaultConfigured &&
    securityStore.needsVaultSetup
)

watch(visible, (show) => {
  if (!show) {
    masterPassword.value = ''
    accountSecretKey.value = ''
    errorMsg.value = ''
    loading.value = false
  }
})

async function handleSubmit(): Promise<void> {
  if (loading.value) return
  errorMsg.value = ''
  loading.value = true
  try {
    await completeLocalVaultSetup(masterPassword.value, accountSecretKey.value)
    ElMessage.success(t('vaultSetup.success'))
  } catch (err) {
    const message =
      err instanceof LocalVaultSetupError
        ? err.message
        : err instanceof Error
          ? err.message
          : t('vaultSetup.failed')
    errorMsg.value = message
  } finally {
    loading.value = false
  }
}

async function handleLogout(): Promise<void> {
  await authStore.logout()
  void router.replace({ name: 'Login' })
}
</script>

<style scoped lang="scss">
.vault-setup-dialog {
  &__intro {
    margin: 0 0 $spacing-lg;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    line-height: 1.65;
  }

  &__form {
    :deep(.el-form-item) {
      margin-bottom: $spacing-md;
    }

    :deep(.el-form-item:last-of-type) {
      margin-bottom: 0;
    }

    :deep(.el-form-item__label) {
      padding-bottom: $spacing-xs;
      color: $color-text-primary;
      font-size: $font-size-sm;
      font-weight: 600;
      line-height: 1.4;
    }

    :deep(.vault-setup-dialog__field) {
      width: 100%;

      .el-input__wrapper {
        border-radius: $radius-md;
        box-shadow: 0 0 0 1px $color-border inset;
      }
    }
  }

  &__field--secret {
    :deep(.el-input__inner) {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: $font-size-sm;
      letter-spacing: 0.02em;
    }
  }

  &__error {
    margin: $spacing-sm 0 0;
    font-size: $font-size-sm;
    color: $color-danger;
    line-height: 1.5;
  }

  &__hint {
    margin: $spacing-lg 0 0;
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-xs;
    color: $color-text-muted;
    line-height: 1.6;
    background: $color-badge-bg;
    border-radius: $radius-sm;
  }

  &__footer {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-md;
    width: 100%;
  }

  &__submit {
    width: 100%;
    margin: 0;
  }

  &__logout {
    display: block;
    width: 100%;
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    color: $color-text-secondary;
    font-size: $font-size-sm;
    line-height: 1.5;
    cursor: pointer;
    transition: color $transition-fast;

    &:hover:not(:disabled) {
      color: $color-accent;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>

<style lang="scss">
.vault-setup-dialog.el-dialog {
  border-radius: $radius-xl;
  max-width: calc(100vw - 32px);

  .el-dialog__header {
    padding: $spacing-lg $spacing-lg $spacing-sm;
    margin-right: 0;
  }

  .el-dialog__title {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-text-primary;
  }

  .el-dialog__body {
    padding: $spacing-sm $spacing-lg $spacing-md;
  }

  .el-dialog__footer {
    padding: 0 $spacing-lg $spacing-lg;
  }
}
</style>
