<template>
  <el-dialog
    :model-value="modelValue"
    :title="t('settings.serverDialogTitle')"
    width="440px"
    append-to-body
    destroy-on-close
    class="server-settings-dialog"
    @update:model-value="emit('update:modelValue', $event)"
    @open="handleOpen"
    @closed="handleClosed"
  >
    <p class="server-settings-dialog__desc">{{ t('settings.serverDesc') }}</p>

    <el-input
      v-model="serverUrlInput"
      size="large"
      clearable
      :placeholder="serverStore.defaultServerOrigin"
      class="server-settings-dialog__input"
    />

    <div class="server-settings-dialog__actions">
      <el-button size="large" @click="handleReset">{{ t('settings.serverReset') }}</el-button>
      <el-button type="primary" size="large" :loading="saving" @click="handleSave">
        {{ t('settings.serverSave') }}
      </el-button>
    </div>

    <div class="server-settings-dialog__status">
      <div class="server-settings-dialog__status-row">
        <span>{{ t('settings.backend') }}</span>
        <span class="server-settings-dialog__health">
          <span
            class="server-settings-dialog__health-dot"
            :class="healthReady ? 'is-ready' : 'is-down'"
          />
          {{ healthStatusText }}
        </span>
      </div>
      <p class="server-settings-dialog__note">
        {{ t('settings.serverCurrent') }}<code>{{ serverStore.serverOrigin }}</code>
        <span v-if="!serverStore.isCustom">{{ t('settings.serverDefault') }}</span>
        <span v-else>{{ t('settings.serverCustom') }}</span>
        · {{ t('settings.serverApi') }}<code>{{ serverStore.apiBaseUrl }}</code>
      </p>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getHealthApi } from '@/api'
import { useI18n } from '@/composables/useI18n'
import { useServerStore } from '@/stores/server'
import { probeServerOrigin } from '@/utils/serverUrl'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()
const serverStore = useServerStore()
const serverUrlInput = ref(serverStore.serverOrigin)
const saving = ref(false)
const healthReady = ref(false)
let healthTimer: ReturnType<typeof setInterval> | null = null

const healthStatusText = computed(() =>
  healthReady.value ? t('settings.backendOk') : t('settings.backendDown')
)

async function checkHealth(): Promise<void> {
  try {
    const data = await getHealthApi()
    healthReady.value = data.status === 'UP'
  } catch {
    healthReady.value = false
  }
}

function clearHealthTimer(): void {
  if (healthTimer) {
    clearInterval(healthTimer)
    healthTimer = null
  }
}

function handleOpen(): void {
  serverUrlInput.value = serverStore.serverOrigin
  void checkHealth()
  healthTimer = setInterval(() => {
    void checkHealth()
  }, 15000)
}

function handleClosed(): void {
  clearHealthTimer()
}

async function handleSave(): Promise<void> {
  const input = serverUrlInput.value.trim()
  if (!input) {
    ElMessage.warning(t('msg.serverUrlRequired'))
    return
  }

  saving.value = true
  try {
    const origin = await probeServerOrigin(input)
    serverStore.setServerOrigin(origin)
    ElMessage.success(t('msg.serverUrlSaved'))
    await checkHealth()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : t('msg.serverConnectFailed'))
  } finally {
    saving.value = false
  }
}

async function handleReset(): Promise<void> {
  serverStore.restoreDefault()
  serverUrlInput.value = serverStore.serverOrigin
  try {
    await checkHealth()
    ElMessage.success(t('msg.serverUrlReset'))
  } catch {
    ElMessage.warning(t('msg.serverUrlResetWarn'))
  }
}
</script>

<style scoped lang="scss">
.server-settings-dialog {
  &__desc {
    margin: 0 0 $spacing-md;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    line-height: 1.5;
  }

  &__input {
    margin-bottom: $spacing-md;
  }

  &__actions {
    display: flex;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;

    .el-button {
      flex: 1;
    }
  }

  &__status {
    padding-top: $spacing-md;
    border-top: 1px solid $color-border;
  }

  &__status-row {
    @include flex-between;
    margin-bottom: $spacing-sm;
    font-size: $font-size-sm;
    color: $color-text-primary;
  }

  &__health {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    color: $color-text-secondary;
  }

  &__health-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $color-text-muted;

    &.is-ready {
      background: $color-success;
      box-shadow: 0 0 0 3px rgba($color-success, 0.2);
    }

    &.is-down {
      background: $color-danger;
      box-shadow: 0 0 0 3px rgba($color-danger, 0.15);
    }
  }

  &__note {
    margin: 0;
    font-size: $font-size-xs;
    color: $color-text-muted;
    line-height: 1.6;

    code {
      padding: 1px 4px;
      border-radius: $radius-sm;
      background: $color-bg-secondary;
      font-size: inherit;
    }
  }
}
</style>
