<template>
  <el-config-provider :locale="elementLocale">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { useShortcutsStore } from '@/stores/shortcuts'
import { useI18n } from '@/composables/useI18n'
import { getElementPlusLocale } from '@/locales'
import { initGlobalShortcutBridge } from '@/utils/globalShortcutBridge'
import { initTrayBridge } from '@/utils/trayBridge'

const appStore = useAppStore()
const { t } = useI18n()

const elementLocale = computed(() => getElementPlusLocale(appStore.resolvedLocale))

initGlobalShortcutBridge()
initTrayBridge()

onMounted(async () => {
  const shortcutsStore = useShortcutsStore()
  const result = await shortcutsStore.init()

  if (!window.shortcutApi) return

  if (!result.ok) {
    const messages = Object.values(result.failed ?? {}).filter(Boolean)
    ElMessage.warning(messages[0] ?? t('msg.shortcutRegisterPartial'))
    return
  }

  const status = result.status
  if (!status) return

  const globalFailed =
    (status.open.enabled && !status.open.registered) ||
    (status.lock.enabled && !status.lock.registered)

  if (globalFailed) {
    ElMessage.warning(t('msg.shortcutRegisterGlobalFailed'))
  }
})
</script>
