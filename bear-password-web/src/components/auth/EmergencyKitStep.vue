<template>
  <div class="emergency-kit-step">
    <p class="emergency-kit-step__lead">{{ t('register.emergencyKitBody') }}</p>

    <label class="emergency-kit-step__label">{{ t('register.emergencyKitKeyLabel') }}</label>
    <el-input
      :model-value="accountSecretKey"
      type="textarea"
      readonly
      :rows="4"
      resize="none"
      class="emergency-kit-step__key-input"
    />

    <p class="emergency-kit-step__fingerprint">
      {{ t('register.emergencyKitFingerprint', { fingerprint: secretKeyFingerprint }) }}
    </p>

    <el-checkbox v-model="backedUp" class="emergency-kit-step__confirm">
      {{ t('register.emergencyKitConfirm') }}
    </el-checkbox>

    <div class="emergency-kit-step__actions">
      <el-button size="large" class="emergency-kit-step__btn" @click="handleDownload">
        {{ t('register.emergencyKitDownload') }}
      </el-button>
      <el-button
        type="primary"
        size="large"
        class="emergency-kit-step__btn emergency-kit-step__btn--primary"
        :disabled="!backedUp"
        :loading="submitting"
        @click="handleConfirm"
      >
        {{ t('register.emergencyKitDone') }}
      </el-button>
    </div>

    <button type="button" class="emergency-kit-step__back" @click="emit('back')">
      {{ t('register.emergencyKitBack') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import {
  buildEmergencyKitFileContent,
  buildEmergencyKitFileName
} from '@/utils/vaultCrypto/emergencyKit'

const props = defineProps<{
  username: string
  accountSecretKey: string
  secretKeyFingerprint: string
  loading?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  back: []
}>()

const { t } = useI18n()
const backedUp = ref(false)
const submitting = ref(false)

watch(
  () => props.loading,
  (value) => {
    submitting.value = value === true
  }
)

async function handleDownload(): Promise<void> {
  try {
    const { downloadTextFile } = await import('@/utils/downloadFile')
    downloadTextFile(
      buildEmergencyKitFileContent({
        version: 2,
        username: props.username,
        accountSecretKey: props.accountSecretKey,
        secretKeyFingerprint: props.secretKeyFingerprint,
        createdAt: new Date().toISOString()
      }),
      buildEmergencyKitFileName(props.username)
    )
    ElMessage.success(t('register.emergencyKitDownloaded'))
  } catch {
    ElMessage.error(t('msg.securityKeyBackupFailed'))
  }
}

function handleConfirm(): void {
  emit('confirm')
}
</script>

<style scoped lang="scss">
.emergency-kit-step {
  &__lead {
    margin: 0 0 $spacing-md;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    line-height: 1.65;
    text-align: left;
  }

  &__label {
    display: block;
    margin-bottom: $spacing-xs;
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-text-primary;
    text-align: left;
  }

  &__key-input {
    :deep(.el-textarea__inner) {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      line-height: 1.5;
      word-break: break-all;
    }
  }

  &__fingerprint {
    margin: $spacing-sm 0 $spacing-md;
    font-size: $font-size-xs;
    color: $color-text-muted;
    word-break: break-all;
    text-align: left;
  }

  &__confirm {
    display: flex;
    align-items: flex-start;
    margin-bottom: $spacing-md;

    :deep(.el-checkbox__label) {
      white-space: normal;
      line-height: 1.5;
    }
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__btn {
    width: 100%;
    height: 44px;
    margin: 0;
    border-radius: $radius-md !important;

    &--primary {
      font-weight: 600;
    }
  }

  &__back {
    display: block;
    width: 100%;
    margin-top: $spacing-md;
    padding: 0;
    border: none;
    background: transparent;
    color: $color-text-muted;
    font-size: $font-size-sm;
    cursor: pointer;
    transition: color $transition-fast;

    &:hover {
      color: $color-accent;
    }
  }
}
</style>
