import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, logoutApi, registerApi } from '@/api'
import { storage } from '@/utils/storage'
import type { LoginParams, RegisterParams, UserInfo } from '@/types'

/**
 * 认证状态管理
 * 管理登录态、用户信息与 Token 持久化
 */
export const useAuthStore = defineStore('auth', () => {
  const userInfo = ref<UserInfo | null>(storage.get<UserInfo>('user'))
  const loading = ref(false)

  const isLoggedIn = computed(() => !!userInfo.value?.token)
  const username = computed(() => userInfo.value?.username ?? '')
  const avatar = computed(() => userInfo.value?.avatar ?? '')

  /** 登录 */
  async function login(params: LoginParams): Promise<void> {
    loading.value = true
    try {
      const result = await loginApi(params)
      const info: UserInfo = {
        username: result.username,
        avatar: result.avatar,
        token: result.token
      }
      userInfo.value = info
      storage.set('user', info)
      storage.set('token', result.token)
    } finally {
      loading.value = false
    }
  }

  /** 注册并自动登录 */
  async function register(params: RegisterParams): Promise<void> {
    loading.value = true
    try {
      const result = await registerApi(params)
      const info: UserInfo = {
        username: result.username,
        avatar: result.avatar,
        token: result.token
      }
      userInfo.value = info
      storage.set('user', info)
      storage.set('token', result.token)
    } finally {
      loading.value = false
    }
  }

  /** 退出登录 */
  async function logout(): Promise<void> {
    try {
      await logoutApi()
    } catch {
      // 登录过期时 logout 接口可能失败，仍应清理本地状态
    }
    clearSession()
  }

  /** 清除本地登录态（不请求服务端） */
  function clearSession(): void {
    userInfo.value = null
    storage.remove('user')
    storage.remove('token')
  }

  /** 更新本地头像 URL（上传成功后同步侧边栏等展示） */
  function updateAvatar(avatar: string): void {
    if (!userInfo.value) return
    userInfo.value = { ...userInfo.value, avatar }
    storage.set('user', userInfo.value)
  }

  return {
    userInfo,
    loading,
    isLoggedIn,
    username,
    avatar,
    login,
    register,
    logout,
    clearSession,
    updateAvatar
  }
})
