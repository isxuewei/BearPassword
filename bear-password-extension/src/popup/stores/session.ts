import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi } from '@/shared/api/auth'
import type {
  ExtensionSession,
  FillCredential,
  MatchingCredentialsResult,
  SecurityKeyApplyResult
} from '@/shared/types'
import { loadServerOrigin, saveServerOrigin } from '@/shared/storage/session'
import { sendMessage } from '@/shared/utils/messaging'
import { probeServerOrigin } from '@/shared/utils/serverUrl'
import { t } from '@/popup/i18n'

export const useSessionStore = defineStore('session', () => {
  const session = ref<ExtensionSession | null>(null)
  const serverOrigin = ref('')
  const loading = ref(false)
  const error = ref('')

  const isLoggedIn = computed(() => !!session.value?.token)
  const username = computed(() => session.value?.username ?? '')
  const hasSecurityKey = computed(() => !!session.value?.securityKey)
  const securityKey = computed(() => session.value?.securityKey ?? '')
  const success = ref('')

  function clearFeedback(): void {
    error.value = ''
    success.value = ''
  }

  async function init(): Promise<void> {
    serverOrigin.value = await loadServerOrigin()
    await refreshSession()
  }

  async function refreshSession(): Promise<void> {
    session.value = await sendMessage<ExtensionSession | null>({ type: 'GET_SESSION' })
  }

  async function login(usernameInput: string, password: string): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      const origin = serverOrigin.value || (await loadServerOrigin())
      await probeServerOrigin(origin)
      serverOrigin.value = origin

      const result = await loginApi(origin, { username: usernameInput, password })
      const newSession: ExtensionSession = {
        token: result.token,
        username: result.username,
        avatar: result.avatar,
        serverOrigin: origin,
        securityKey: null
      }
      session.value = await sendMessage<ExtensionSession>({
        type: 'SET_SESSION',
        payload: newSession
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : t('session.loginFailed')
      throw err
    } finally {
      loading.value = false
    }
  }

  function formatSecurityKeySuccess(usableCount: number, encryptedTotal: number): string {
    if (encryptedTotal > 0) {
      return t('session.securityKeySuccessEncrypted', {
        usable: usableCount,
        encrypted: encryptedTotal
      })
    }
    return t('session.securityKeySuccess', { count: usableCount })
  }

  async function logout(): Promise<void> {
    await sendMessage({ type: 'LOGOUT' })
    session.value = null
    error.value = ''
    success.value = ''
  }

  async function updateServer(input: string): Promise<void> {
    loading.value = true
    error.value = ''
    success.value = ''
    try {
      const origin = await probeServerOrigin(input)
      await saveServerOrigin(origin)
      serverOrigin.value = origin
      if (session.value?.token) {
        session.value = await sendMessage<ExtensionSession>({
          type: 'SET_SESSION',
          payload: { ...session.value, serverOrigin: origin }
        })
      }
      success.value = t('session.serverUpdated')
    } catch (err) {
      error.value = err instanceof Error ? err.message : t('session.serverFailed')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function applySecurityKey(securityKey: string): Promise<void> {
    loading.value = true
    error.value = ''
    success.value = ''
    try {
      const result = await sendMessage<SecurityKeyApplyResult>({
        type: 'SET_SECURITY_KEY',
        payload: { securityKey }
      })
      session.value = result.session
      success.value = formatSecurityKeySuccess(result.usableCount, result.encryptedTotal)
      await sendMessage({ type: 'UPDATE_BADGE' })
    } catch (err) {
      error.value = err instanceof Error ? err.message : t('session.securityKeyInvalid')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function clearSecurityKey(): Promise<void> {
    loading.value = true
    error.value = ''
    success.value = ''
    try {
      session.value = await sendMessage<ExtensionSession | null>({ type: 'CLEAR_SECURITY_KEY' })
      success.value = t('session.securityKeyCleared')
    } catch (err) {
      error.value = err instanceof Error ? err.message : t('session.operationFailed')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    session,
    serverOrigin,
    loading,
    error,
    success,
    isLoggedIn,
    hasSecurityKey,
    securityKey,
    username,
    init,
    refreshSession,
    login,
    logout,
    updateServer,
    applySecurityKey,
    clearSecurityKey,
    clearFeedback
  }
})

export interface LoginEntryFormData {
  title: string
  username: string
  password: string
  website: string
}

export const useVaultStore = defineStore('vault', () => {
  const matching = ref<FillCredential[]>([])
  const needsSecurityKey = ref(false)
  const keyword = ref('')
  const currentUrl = ref('')
  const loading = ref(false)
  const toast = ref('')
  const pendingDelete = ref<FillCredential | null>(null)
  const deleting = ref(false)
  const entryDialogOpen = ref(false)
  const editingCredential = ref<FillCredential | null>(null)
  const entrySaving = ref(false)
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  function showToast(message: string): void {
    toast.value = message
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toast.value = ''
      toastTimer = null
    }, 2000)
  }

  const filtered = computed(() => {
    const q = keyword.value.trim().toLowerCase()
    if (!q) return matching.value
    return matching.value.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.username.toLowerCase().includes(q)
    )
  })

  async function loadCurrentTab(): Promise<void> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    currentUrl.value = tab?.url ?? ''
  }

  async function refresh(silent = false): Promise<void> {
    if (!silent) loading.value = true
    try {
      await loadCurrentTab()
      if (currentUrl.value) {
        const result = await sendMessage<MatchingCredentialsResult>({
          type: 'GET_MATCHING_CREDENTIALS',
          payload: { url: currentUrl.value, matchBy: 'host' }
        })
        matching.value = result.credentials
        needsSecurityKey.value = result.needsSecurityKey
      } else {
        matching.value = []
        needsSecurityKey.value = false
      }
    } finally {
      if (!silent) loading.value = false
    }
  }

  async function autofill(credentialId: number): Promise<void> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) {
      showToast(t('vault.toast.fillNoTab'))
      return
    }
    try {
      await sendMessage({
        type: 'AUTOFILL',
        payload: { credentialId, tabId: tab.id }
      })
      window.close()
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('vault.toast.fillFailed'))
    }
  }

  async function copyText(text: string): Promise<void> {
    await navigator.clipboard.writeText(text)
  }

  async function shareCredential(credential: FillCredential): Promise<void> {
    const lines = [
      `${t('vault.share.title')}: ${credential.title}`,
      `${t('vault.share.username')}: ${credential.username}`,
      `${t('vault.share.password')}: ${credential.password}`,
      '',
      t('vault.share.footer')
    ]
    await navigator.clipboard.writeText(lines.join('\n'))
    showToast(t('vault.toast.shareCopied'))
  }

  async function toggleFavorite(credential: FillCredential): Promise<void> {
    const favorited = !!credential.favorite
    try {
      await sendMessage({
        type: 'TOGGLE_FAVORITE',
        payload: { credentialId: credential.id, favorite: favorited }
      })
      matching.value = matching.value.map((item) =>
        item.id === credential.id ? { ...item, favorite: !favorited } : item
      )
      showToast(favorited ? t('vault.toast.unfavorited') : t('vault.toast.favorited'))
      await refresh(true)
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('vault.toast.favoriteFailed'))
      await refresh(true)
    }
  }

  function requestDelete(credential: FillCredential): void {
    pendingDelete.value = credential
  }

  function cancelDelete(): void {
    if (deleting.value) return
    pendingDelete.value = null
  }

  async function confirmDelete(): Promise<void> {
    const credential = pendingDelete.value
    if (!credential || deleting.value) return

    deleting.value = true
    try {
      await sendMessage({
        type: 'DELETE_CREDENTIAL',
        payload: { credentialId: credential.id }
      })
      pendingDelete.value = null
      showToast(t('vault.toast.deleted'))
      await refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('vault.toast.deleteFailed'))
    } finally {
      deleting.value = false
    }
  }

  function openCreate(): void {
    editingCredential.value = null
    entryDialogOpen.value = true
  }

  function openEdit(credential: FillCredential): void {
    editingCredential.value = credential
    entryDialogOpen.value = true
  }

  function closeEntryDialog(): void {
    if (entrySaving.value) return
    entryDialogOpen.value = false
    editingCredential.value = null
  }

  async function saveEntry(data: LoginEntryFormData): Promise<void> {
    if (entrySaving.value) return

    const websites = data.website ? [data.website] : []
    const payload = {
      title: data.title,
      username: data.username,
      password: data.password,
      websites
    }

    entrySaving.value = true
    try {
      if (editingCredential.value) {
        await sendMessage({
          type: 'UPDATE_CREDENTIAL',
          payload: { ...payload, credentialId: editingCredential.value.id }
        })
        showToast(t('vault.toast.updated'))
      } else {
        await sendMessage({
          type: 'CREATE_CREDENTIAL',
          payload
        })
        showToast(t('vault.toast.created'))
      }
      entryDialogOpen.value = false
      editingCredential.value = null
      await refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('vault.toast.saveFailed'))
    } finally {
      entrySaving.value = false
    }
  }

  return {
    matching,
    needsSecurityKey,
    keyword,
    currentUrl,
    loading,
    toast,
    pendingDelete,
    deleting,
    entryDialogOpen,
    editingCredential,
    entrySaving,
    filtered,
    refresh,
    autofill,
    copyText,
    shareCredential,
    toggleFavorite,
    requestDelete,
    cancelDelete,
    confirmDelete,
    openCreate,
    openEdit,
    closeEntryDialog,
    saveEntry
  }
})
