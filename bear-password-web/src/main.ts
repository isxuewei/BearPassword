import { createApp } from 'vue'
import ElementPlus, { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import App from './App.vue'
import router from './router'
import pinia from './stores'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useAutoLockStore } from '@/stores/autoLock'
import { useSecurityStore } from '@/stores/security'
import { bindUnauthorizedHandler } from '@/utils/request'
import { initFontOnBoot } from '@/utils/font'
import { initLocaleOnBoot } from '@/utils/localePreference'
import { initThemeOnBoot } from '@/utils/theme'
import '@/styles/index.scss'

initThemeOnBoot()
initFontOnBoot()
initLocaleOnBoot()

async function bootstrap(): Promise<void> {
  const app = createApp(App)

  app.use(pinia)
  const autoLockStore = useAutoLockStore()
  const authStore = useAuthStore()
  await useSecurityStore().init()
  if (authStore.isLoggedIn) {
    try {
      await useSecurityStore().refreshVaultCryptoMeta()
      await useSecurityStore().reloadFromStorage()
    } catch {
      authStore.clearSession()
    }
  }
  autoLockStore.ensureSecureLockState()
  autoLockStore.ensureVaultSessionLocked()
  app.use(router)
  app.use(ElementPlus, { size: 'default' })

  void useAppStore().initTheme()

  bindUnauthorizedHandler(() => {
    authStore.clearSession()
    if (router.currentRoute.value.name !== 'Login') {
      void router.replace({ name: 'Login' })
    }
  })

  app.mount('#app')
  ElMessage._context = app._context
}

void bootstrap()
