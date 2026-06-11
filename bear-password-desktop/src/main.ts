import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import App from './App.vue'
import router from './router'
import pinia from './stores'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { bindUnauthorizedHandler } from '@/utils/request'
import { initFontOnBoot } from '@/utils/font'
import { initLocaleOnBoot } from '@/utils/localePreference'
import { initThemeOnBoot } from '@/utils/theme'
import '@/styles/index.scss'

// 在 Vue 挂载前应用主题、字体与语言，避免首屏闪烁
initThemeOnBoot()
initFontOnBoot()
initLocaleOnBoot()

/**
 * 应用入口
 * 挂载 Vue 实例，注册 Pinia、Router、Element Plus
 */
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(ElementPlus, { size: 'default' })

// Pinia 就绪后立即初始化主题与系统外观监听
void useAppStore().initTheme()

bindUnauthorizedHandler(() => {
  const authStore = useAuthStore()
  authStore.clearSession()
  if (router.currentRoute.value.name !== 'Login') {
    void router.replace({ name: 'Login' })
  }
})

app.mount('#app')
