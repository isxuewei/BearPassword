<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useI18n } from '@/popup/composables/useI18n'
import { useLocaleStore } from '@/popup/stores/locale'
import { useSessionStore } from '@/popup/stores/session'
import { useThemeStore } from '@/popup/stores/theme'
import { usePopupStore } from '@/popup/stores/popup'
import { useVersionStore } from '@/popup/stores/version'
import LoginView from '@/popup/views/LoginView.vue'
import VaultView from '@/popup/views/VaultView.vue'
import SettingsView from '@/popup/views/SettingsView.vue'
import AppLogo from '@/popup/components/AppLogo.vue'

const localeStore = useLocaleStore()
const sessionStore = useSessionStore()
const themeStore = useThemeStore()
const popupStore = usePopupStore()
const versionStore = useVersionStore()
const { t } = useI18n()
const ready = ref(false)

onMounted(async () => {
  await Promise.all([localeStore.init(), themeStore.init(), sessionStore.init()])
  ready.value = true
  void versionStore.checkForUpdate()
})

watch(
  () => sessionStore.serverOrigin,
  () => {
    void versionStore.checkForUpdate()
  }
)
</script>

<template>
  <div v-if="!ready" class="loading-screen">
    <AppLogo size="md" />
    <p class="loading-text">{{ t('app.loading') }}</p>
  </div>
  <SettingsView v-else-if="popupStore.page === 'settings'" />
  <LoginView v-else-if="!sessionStore.isLoggedIn" />
  <VaultView v-else />
</template>

<style scoped>
.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 480px;
  background: var(--bear-bg);
}

.loading-text {
  font-size: 13px;
  color: var(--bear-text-muted);
}
</style>
