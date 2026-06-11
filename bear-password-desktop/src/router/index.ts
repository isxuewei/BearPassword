import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from './routes'
import { useAuthStore } from '@/stores/auth'

/**
 * Vue Router 配置
 * Electron 环境使用 Hash 模式，避免 file:// 协议下 History 模式失效
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

/** 全局路由守卫：未登录跳转登录页 */
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth !== false)

  if (requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'Login', replace: true })
  } else if ((to.name === 'Login' || to.name === 'Register') && authStore.isLoggedIn) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
