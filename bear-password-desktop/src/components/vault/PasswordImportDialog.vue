<template>
  <el-dialog
    :model-value="visible"
    width="520px"
    class="password-import-dialog"
    destroy-on-close
    :close-on-click-modal="!importing"
    :close-on-press-escape="!importing"
    @close="handleClose"
  >
    <template #header>
      <h2 class="password-import-dialog__title">{{ t('entry.import.title') }}</h2>
    </template>

    <p class="password-import-dialog__desc">{{ t('entry.import.desc') }}</p>
    <p class="password-import-dialog__security">{{ t('entry.import.securityNote') }}</p>

    <ul class="password-import-dialog__browsers">
      <li>{{ t('entry.import.browser.chrome') }}</li>
      <li>{{ t('entry.import.browser.edge') }}</li>
      <li>{{ t('entry.import.browser.firefox') }}</li>
      <li>{{ t('entry.import.browser.safari') }}</li>
      <li>{{ t('entry.import.browser.brave') }}</li>
    </ul>

    <div class="password-import-dialog__file">
      <el-button type="primary" :disabled="importing" @click="handlePickFile">
        {{ t('entry.import.chooseFile') }}
      </el-button>
      <span v-if="fileName" class="password-import-dialog__filename">{{ fileName }}</span>
    </div>

    <div v-if="parseResult" class="password-import-dialog__summary">
      <p>
        {{ t('entry.import.detectedFormat', { format: formatLabel }) }}
      </p>
      <p>
        {{ t('entry.import.readyCount', { count: parseResult.rows.length }) }}
        <span v-if="parseResult.skipped">
          {{ t('entry.import.skippedCount', { count: parseResult.skipped }) }}
        </span>
      </p>
    </div>

    <el-alert
      v-if="errorMessage"
      class="password-import-dialog__alert"
      type="error"
      :title="errorMessage"
      show-icon
      :closable="false"
    />

    <el-progress
      v-if="importing"
      class="password-import-dialog__progress"
      :percentage="importProgress"
      :stroke-width="8"
    />

    <template #footer>
      <el-button :disabled="importing" @click="handleClose">{{ t('entry.dialog.cancel') }}</el-button>
      <el-button
        type="primary"
        :disabled="!canImport"
        :loading="importing"
        @click="handleImport"
      >
        {{ importing ? t('entry.import.importing') : t('entry.import.start') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createPasswordApi } from '@/api'
import { useI18n } from '@/composables/useI18n'
import { useSecurityStore } from '@/stores/security'
import { SecurityKeyRequiredError } from '@/utils/securityKeyRequired'
import {
  buildLoginImportParams,
  getImportFormatLabelKey,
  parsePasswordImportCsv,
  type PasswordImportParseResult
} from '@/utils/passwordImport'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  imported: []
}>()

const { t } = useI18n()
const securityStore = useSecurityStore()

const fileName = ref('')
const parseResult = ref<PasswordImportParseResult | null>(null)
const errorMessage = ref('')
const importing = ref(false)
const importProgress = ref(0)

const formatLabel = computed(() =>
  parseResult.value ? t(getImportFormatLabelKey(parseResult.value.format)) : ''
)

const canImport = computed(
  () => !!parseResult.value && parseResult.value.rows.length > 0 && !importing.value
)

watch(
  () => props.visible,
  (open) => {
    if (open) resetState()
  }
)

function resetState(): void {
  fileName.value = ''
  parseResult.value = null
  errorMessage.value = ''
  importing.value = false
  importProgress.value = 0
}

function handleClose(): void {
  if (importing.value) return
  emit('update:visible', false)
}

async function handlePickFile(): Promise<void> {
  errorMessage.value = ''
  parseResult.value = null
  fileName.value = ''

  if (!window.fileApi?.pickPasswordCsv) {
    errorMessage.value = t('entry.import.unavailable')
    return
  }

  try {
    const picked = await window.fileApi.pickPasswordCsv()
    if (!picked) return

    fileName.value = picked.fileName
    const result = parsePasswordImportCsv(picked.content)
    if (!result.rows.length) {
      errorMessage.value = t('entry.import.emptyFile')
      return
    }
    parseResult.value = result
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('entry.import.readFailed')
  }
}

async function handleImport(): Promise<void> {
  const rows = parseResult.value?.rows
  if (!rows?.length || importing.value) return

  if (!securityStore.hasSecurityKey) {
    errorMessage.value = t('msg.securityKeyRequiredWrite')
    ElMessage.warning(t('msg.securityKeyRequiredWrite'))
    return
  }

  importing.value = true
  importProgress.value = 0
  errorMessage.value = ''

  let success = 0
  let failed = 0

  for (let i = 0; i < rows.length; i++) {
    try {
      await createPasswordApi(buildLoginImportParams(rows[i]))
      success++
    } catch (err) {
      if (err instanceof SecurityKeyRequiredError) {
        errorMessage.value = t('msg.securityKeyRequiredWrite')
        importing.value = false
        ElMessage.warning(t('msg.securityKeyRequiredWrite'))
        return
      }
      failed++
    }
    importProgress.value = Math.round(((i + 1) / rows.length) * 100)
  }

  importing.value = false

  if (success > 0) {
    ElMessage.success(t('entry.import.done', { success, failed }))
    emit('imported')
    emit('update:visible', false)
    return
  }

  errorMessage.value = t('entry.import.allFailed')
}
</script>

<style scoped lang="scss">
.password-import-dialog {
  &__title {
    margin: 0;
    font-size: $font-size-xl;
    font-weight: 700;
    color: $color-text-primary;
  }

  &__desc {
    margin: 0 0 $spacing-sm;
    font-size: $font-size-sm;
    line-height: 1.6;
    color: $color-text-secondary;
  }

  &__security {
    margin: 0 0 $spacing-md;
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-md;
    border: 1px solid rgba(90, 115, 72, 0.22);
    background: rgba(90, 115, 72, 0.08);
    font-size: $font-size-sm;
    line-height: 1.6;
    color: $color-text-primary;
    font-weight: 500;
  }

  &__browsers {
    margin: 0 0 $spacing-lg;
    padding-left: 1.2em;
    font-size: $font-size-sm;
    line-height: 1.7;
    color: $color-text-secondary;
  }

  &__file {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
  }

  &__filename {
    font-size: $font-size-sm;
    color: $color-text-primary;
    word-break: break-all;
  }

  &__summary {
    padding: $spacing-md;
    border-radius: $radius-md;
    background: $color-bg-secondary;
    font-size: $font-size-sm;
    line-height: 1.6;
    color: $color-text-secondary;

    p {
      margin: 0;

      & + p {
        margin-top: $spacing-xs;
      }
    }
  }

  &__alert {
    margin-top: $spacing-md;
  }

  &__progress {
    margin-top: $spacing-md;
  }
}
</style>

<style lang="scss">
.password-import-dialog.el-dialog {
  border-radius: $radius-xl;

  .el-dialog__header {
    padding: $spacing-lg $spacing-lg $spacing-sm;
    margin-right: 0;
  }

  .el-dialog__body {
    padding: $spacing-sm $spacing-lg;
  }

  .el-dialog__footer {
    padding: $spacing-sm $spacing-lg $spacing-lg;
  }
}
</style>
