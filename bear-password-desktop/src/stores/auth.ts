import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, logoutApi, registerApi } from '@/api'
import { useSecurityStore } from '@/stores/security'
import { useVaultStore } from '@/stores/vault'
import { storage } from '@/utils/storage'
import type { LoginParams, RegisterParams, UserInfo, UserProfile } from '@/types'

function resolveNickname(nickname: string | undefined, username: string): string {
  const trimmed = nickname?.trim()
  return trimmed || username
}

function toUserInfo(result: { username: string; nickname?: string; avatar?: string; token: string }): UserInfo {
  return {
    username: result.username,
    nickname: resolveNickname(result.nickname, result.username),
    avatar: result.avatar,
    token: result.token
  }
}

/**
 * 认证状态管理
 * 管理登录态、用户信息与 Token 持久化
 */
export const useAuthStore = defineStore('auth', () => {
  const stored = storage.get<UserInfo>('user')
  const userInfo = ref<UserInfo | null>(
    stored
      ? {
          ...stored,
          nickname: resolveNickname(stored.nickname, stored.username)
        }
      : null
  )
  const loading = ref(false)

  const isLoggedIn = computed(() => !!userInfo.value?.token)
  const username = computed(() => userInfo.value?.username ?? '')
  const nickname = computed(() => userInfo.value?.nickname?.trim() || username.value)
  const displayName = computed(() => nickname.value)
  const avatar = computed(() => userInfo.value?.avatar ?? '')

  /** 登录 */
  async function login(params: LoginParams): Promise<void> {
    loading.value = true
    try {
      const result = await loginApi(params)
      const info = toUserInfo(result)
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
      const info = toUserInfo(result)
      userInfo.value = info
      storage.set('user', info)
      storage.set('token', result.token)
    } finally {
      loading.value = false
    }
  }

  /** 退出登录（手动）：清除登录态与本机安全密钥 */
  async function logout(): Promise<void> {
    try {
      await logoutApi()
    } catch {
      // 登录过期时 logout 接口可能失败，仍应清理本地状态
    }
    clearSession()
    useSecurityStore().setSecurityKey(null)
  }

  /** 清除本地登录态（不请求服务端） */
  function clearSession(): void {
    userInfo.value = null
    storage.remove('user')
    storage.remove('token')
    useVaultStore().reset()
  }

  /** 更新本地头像 URL（上传成功后同步侧边栏等展示） */
  function updateAvatar(avatar: string): void {
    if (!userInfo.value) return
    userInfo.value = { ...userInfo.value, avatar }
    storage.set('user', userInfo.value)
  }

  /** 更新本地用户名（修改成功后同步） */
  function updateUsername(username: string): void {
    if (!userInfo.value) return
    userInfo.value = { ...userInfo.value, username }
    storage.set('user', userInfo.value)
  }

  /** 更新本地昵称（修改成功后同步侧边栏等展示） */
  function updateNickname(nickname: string): void {
    if (!userInfo.value) return
    const normalized = resolveNickname(nickname, userInfo.value.username)
    userInfo.value = { ...userInfo.value, nickname: normalized }
    storage.set('user', userInfo.value)
  }

  /** 从服务端用户详情同步本地展示信息 */
  function syncProfile(profile: UserProfile): void {
    if (!userInfo.value) return
    userInfo.value = {
      ...userInfo.value,
      username: profile.username,
      nickname: resolveNickname(profile.nickname, profile.username),
      avatar: profile.avatar
    }
    storage.set('user', userInfo.value)
  }

  return {
    userInfo,
    loading,
    isLoggedIn,
    username,
    nickname,
    displayName,
    avatar,
    login,
    register,
    logout,
    clearSession,
    updateAvatar,
    updateUsername,
    updateNickname,
    syncProfile
  }
})
