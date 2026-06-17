<template>
  <div class="offline-vault-settings">
    <div class="offline-vault-settings__row offline-vault-settings__row--toggle">
      <div class="offline-vault-settings__row-label">
        <span>{{ t('settings.offlineMode') }}</span>
        <small>{{ t('settings.offlineModeDesc') }}</small>
      </div>
      <el-switch
        :model-value="offlineVaultStore.enabled"
        :loading="toggling"
        :disabled="!available || offlineVaultStore.saving || securityStore.isMigrating"
        @change="handleToggle"
      />
    </div>

    <div v-if="offlineVaultStore.enabled" class="offline-vault-settings__panel">
      <div class="offline-vault-settings__row-label">
        <span>{{ t('settings.offlineDataDir') }}</span>
        <small>{{ t('settings.offlineDataDirDesc') }}</small>
      </div>

      <div class="offline-vault-settings__dir-row">
        <el-input
          :model-value="displayDataDir"
          readonly
          size="large"
          class="offline-vault-settings__dir-input"
          :title="displayDataDir"
        />
        <el-button
          size="large"
          class="offline-vault-settings__dir-btn"
          :disabled="!available || offlineVaultStore.saving || securityStore.isMigrating"
          @click="handlePickDir"
        >
          {{ t('settings.offlineDataDirChoose') }}
        </el-button>
      </div>

      <p class="offline-vault-settings__note">
        {{ t('settings.offlineModeEnabledNote') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import { useOfflineVaultStore } from '@/stores/offlineVault'
import { useSecurityStore } from '@/stores/security'
import { isOfflineVaultApiAvailable } from '@/utils/offlineVaultMode'
import { settingsMessageBoxConfirm } from '@/utils/settingsMessageBox'

const { t } = useI18n()
const offlineVaultStore = useOfflineVaultStore()
const securityStore = useSecurityStore()

const toggling = ref(false)
const available = computed(() => isOfflineVaultApiAvailable())

const displayDataDir = computed(
  () => offlineVaultStore.dataDir || offlineVaultStore.defaultDataDir || t('settings.offlineDataDirUnset')
)

onMounted(async () => {
  if (!offlineVaultStore.initialized) {
    await offlineVaultStore.loadSettings()
  }
})

async function handleToggle(next: string | number | boolean): Promise<void> {
  const enabled = next === true
  if (enabled === offlineVaultStore.enabled) return

  try {
    if (enabled) {
      await settingsMessageBoxConfirm(
        t('settings.offlineModeEnableConfirm'),
        t('settings.offlineMode'),
        {
          confirmButtonText: t('msg.confirm'),
          cancelButtonText: t('msg.cancel'),
          type: 'warning'
        }
      )
    } else {
      await settingsMessageBoxConfirm(
        t('settings.offlineModeDisableConfirm'),
        t('settings.offlineMode'),
        {
          confirmButtonText: t('msg.confirm'),
          cancelButtonText: t('msg.cancel'),
          type: 'warning'
        }
      )
    }
  } catch {
    return
  }

  toggling.value = true
  try {
    const ok = await offlineVaultStore.setEnabled(enabled)
    if (!ok) {
      ElMessage.error(t('settings.offlineModeSaveFailed'))
      return
    }
    ElMessage.success(enabled ? t('settings.offlineModeEnabled') : t('settings.offlineModeDisabled'))
  } catch (error) {
    const message = error instanceof Error ? error.message : t('settings.offlineModeSaveFailed')
    ElMessage.error(message)
  } finally {
    toggling.value = false
  }
}

async function handlePickDir(): Promise<void> {
  let snapshotToMigrate: unknown = null

  if (offlineVaultStore.enabled) {
    snapshotToMigrate = await window.offlineVaultApi?.readSnapshot()
  }

  const picked = await offlineVaultStore.pickDataDir()
  if (!picked) return

  if (picked === offlineVaultStore.dataDir) return

  if (offlineVaultStore.enabled) {
    try {
      await settingsMessageBoxConfirm(
        t('settings.offlineDataDirChangeConfirm'),
        t('settings.offlineDataDir'),
        {
          confirmButtonText: t('msg.confirm'),
          cancelButtonText: t('msg.cancel'),
          type: 'warning'
        }
      )
    } catch {
      return
    }
  }

  const ok = await offlineVaultStore.setDataDir(picked, {
    migrateSnapshot: offlineVaultStore.enabled ? snapshotToMigrate : undefined
  })
  if (!ok) {
    ElMessage.error(t('settings.offlineDataDirSaveFailed'))
    return
  }

  ElMessage.success(t('settings.offlineDataDirSaved'))
}
</script>

<style scoped lang="scss">
.offline-vault-settings {
  padding-bottom: $spacing-md;
  margin-bottom: 0;
  border-bottom: none;

  &__row {
    @include flex-between;
    align-items: flex-start;
    gap: $spacing-lg;

    &--toggle {
      align-items: center;
      padding: 0;
    }
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

  &__panel {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    padding-top: $spacing-md;
  }

  &__dir-row {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    width: 100%;
  }

  &__dir-input {
    flex: 1;
    min-width: 0;

    :deep(.el-input__wrapper) {
      font-family: $font-family-mono;
      font-size: $font-size-xs;
    }

    :deep(.el-input__inner) {
      font-family: inherit;
      font-size: inherit;
      color: $color-text-secondary;
    }
  }

  &__dir-btn {
    flex-shrink: 0;
    min-width: 108px;
  }

  &__note {
    margin: 0;
    font-size: $font-size-sm;
    color: $color-text-muted;
    line-height: 1.6;
  }
}
</style>
