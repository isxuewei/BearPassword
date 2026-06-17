<template>
  <div class="mfa-settings">
    <div class="mfa-settings__row">
      <div class="mfa-settings__row-label">
        <span>{{ t('settings.mfaTotp') }}</span>
        <small>{{ t('settings.mfaTotpDesc') }}</small>
      </div>
      <span
        class="mfa-settings__badge"
        :class="{ 'mfa-settings__badge--active': mfaStatus?.totpEnabled }"
      >
        {{ mfaStatus?.totpEnabled ? t('settings.mfaEnabled') : t('settings.mfaDisabled') }}
      </span>
    </div>

    <div class="mfa-settings__panel">
      <template v-if="!mfaStatus?.totpEnabled">
        <div class="mfa-settings__actions">
          <el-button type="primary" size="large" :loading="totpSetupLoading" @click="handleSetupTotp">
            {{ t('settings.mfaTotpSetup') }}
          </el-button>
        </div>
      </template>
      <template v-else>
        <div class="mfa-settings__disable-row">
          <el-input
            v-model="disableTotpCode"
            :placeholder="t('settings.mfaTotpDisablePlaceholder')"
            size="large"
            class="mfa-settings__input"
            maxlength="6"
            @keyup.enter="handleDisableTotp"
          />
          <el-button size="large" :loading="disableTotpLoading" @click="handleDisableTotp">
            {{ t('settings.mfaTotpDisable') }}
          </el-button>
        </div>
      </template>
    </div>

    <el-dialog
      v-model="totpDialogVisible"
      :title="t('settings.mfaTotpSetupTitle')"
      :z-index="Z_INDEX_SETTINGS_OVERLAY"
      width="420px"
      class="mfa-settings__dialog"
      :close-on-click-modal="false"
      append-to-body
      @closed="resetTotpSetup"
    >
      <p class="mfa-settings__dialog-tip">{{ t('settings.mfaTotpSetupBody') }}</p>
      <img
        v-if="totpSetup?.qrCodeBase64"
        class="mfa-settings__qr"
        :src="`data:image/png;base64,${totpSetup.qrCodeBase64}`"
        alt="TOTP QR"
      />
      <el-input :model-value="totpSetup?.secret ?? ''" readonly class="mfa-settings__secret" />
      <el-input
        v-model="enableTotpCode"
        :placeholder="t('settings.mfaTotpEnablePlaceholder')"
        size="large"
        maxlength="6"
        @keyup.enter="handleEnableTotp"
      />
      <template #footer>
        <el-button @click="totpDialogVisible = false">{{ t('msg.cancel') }}</el-button>
        <el-button type="primary" :loading="enableTotpLoading" @click="handleEnableTotp">
          {{ t('settings.mfaTotpEnable') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  disableTotpApi,
  enableTotpApi,
  getMfaStatusApi,
  setupTotpApi,
  type MfaStatus,
  type TotpSetupResult
} from '@/api/mfa'
import { useI18n } from '@/composables/useI18n'
import { Z_INDEX_SETTINGS_OVERLAY } from '@/constants/zIndex'

const { t } = useI18n()

const mfaStatus = ref<MfaStatus | null>(null)

const totpSetupLoading = ref(false)
const disableTotpLoading = ref(false)
const enableTotpLoading = ref(false)

const totpDialogVisible = ref(false)
const totpSetup = ref<TotpSetupResult | null>(null)
const enableTotpCode = ref('')
const disableTotpCode = ref('')

async function refreshMfa(): Promise<void> {
  mfaStatus.value = await getMfaStatusApi()
}

async function handleSetupTotp(): Promise<void> {
  totpSetupLoading.value = true
  try {
    totpSetup.value = await setupTotpApi()
    enableTotpCode.value = ''
    totpDialogVisible.value = true
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : String(err))
  } finally {
    totpSetupLoading.value = false
  }
}

async function handleEnableTotp(): Promise<void> {
  if (!totpSetup.value) return
  enableTotpLoading.value = true
  try {
    await enableTotpApi(totpSetup.value.pendingToken, enableTotpCode.value.trim())
    totpDialogVisible.value = false
    ElMessage.success(t('settings.mfaTotpEnabledMsg'))
    await refreshMfa()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : String(err))
  } finally {
    enableTotpLoading.value = false
  }
}

async function handleDisableTotp(): Promise<void> {
  disableTotpLoading.value = true
  try {
    await disableTotpApi(disableTotpCode.value.trim())
    disableTotpCode.value = ''
    ElMessage.success(t('settings.mfaTotpDisabledMsg'))
    await refreshMfa()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : String(err))
  } finally {
    disableTotpLoading.value = false
  }
}

function resetTotpSetup(): void {
  totpSetup.value = null
  enableTotpCode.value = ''
}

onMounted(() => {
  void refreshMfa()
})
</script>

<style scoped lang="scss">
.mfa-settings {
  padding-bottom: $spacing-md;
  margin-bottom: $spacing-sm;
  border-bottom: 1px solid $color-border;

  &__row {
    @include flex-between;
    align-items: flex-start;
    gap: $spacing-lg;
    padding: $spacing-md 0 $spacing-sm;
  }

  &__row-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;

    span {
      color: $color-text-primary;
      font-size: $font-size-md;
    }

    small {
      color: $color-text-muted;
      font-size: $font-size-sm;
      line-height: 1.5;
    }
  }

  &__badge {
    flex-shrink: 0;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    background: $color-badge-bg;
    padding: 4px 12px;
    border-radius: $radius-sm;

    &--active {
      color: $color-success;
      background: rgba(82, 196, 26, 0.12);
    }
  }

  &__panel {
    padding: 0 0 $spacing-md;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__disable-row {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    width: 100%;

    .el-button {
      flex-shrink: 0;
    }
  }

  &__input {
    flex: 1;
    min-width: 0;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }

  &__dialog-tip {
    margin: 0 0 $spacing-md;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    line-height: 1.6;
  }

  &__qr {
    display: block;
    width: 180px;
    height: 180px;
    margin: 0 auto $spacing-md;
  }

  &__secret {
    margin-bottom: $spacing-md;
  }
}
</style>
