import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  type DesktopConnectionState,
  type FillCredential,
  type MatchingCredentialsResult
} from '@/shared/types'
import type { WakeDesktopResult } from '@/shared/api/desktopBridge'
import { sendMessage } from '@/shared/utils/messaging'
import { t } from '@/popup/i18n'
import { useLocaleStore } from '@/popup/stores/locale'
import { useThemeStore } from '@/popup/stores/theme'

export const useSessionStore = defineStore('session', () => {
  const desktopState = ref<DesktopConnectionState | null>(null)
  const loading = ref(false)
  const error = ref('')
  const wakeHint = ref('')

  const isReady = computed(() => desktopState.value?.unlocked === true)
  const isLoggedIn = isReady
  const username = computed(() => desktopState.value?.username ?? '')
  const desktopStatus = computed(() => {
    const state = desktopState.value
    if (!state?.ready) return 'offline' as const
    if (!state.loggedIn) return 'notLoggedIn' as const
    if (state.locked || !state.unlocked) return 'locked' as const
    return 'ready' as const
  })

  function clearFeedback(): void {
    error.value = ''
    wakeHint.value = ''
  }

  function syncAppearance(state: DesktopConnectionState | null): void {
    useThemeStore().syncFromDesktop(state)
    useLocaleStore().syncFromDesktop(state)
  }

  async function refreshDesktopState(silent = false): Promise<void> {
    if (!silent) loading.value = true
    error.value = ''
    try {
      desktopState.value = await sendMessage<DesktopConnectionState>({
        type: 'GET_DESKTOP_STATE'
      })
    } catch (err) {
      desktopState.value = {
        ready: false,
        loggedIn: false,
        locked: false,
        unlocked: false,
        username: null,
        themePreference: null,
        localePreference: null
      }
      if (!silent) {
        error.value = err instanceof Error ? err.message : t('session.desktopFailed')
      }
    } finally {
      syncAppearance(desktopState.value)
      if (!silent) loading.value = false
    }
  }

  async function init(): Promise<void> {
    await refreshDesktopState()
  }

  async function wakeDesktop(): Promise<void> {
    error.value = ''
    wakeHint.value = ''
    try {
      const result = await sendMessage<WakeDesktopResult>({ type: 'WAKE_DESKTOP' })
      if (result === 'protocol-on-tab' || result === 'fallback-page') {
        wakeHint.value = t('login.protocolConfirm')
      }
      await new Promise((resolve) => setTimeout(resolve, 1200))
      await refreshDesktopState(true)
    } catch (err) {
      error.value = err instanceof Error ? err.message : t('session.wakeDesktopFailed')
      throw err
    }
  }

  return {
    desktopState,
    loading,
    error,
    wakeHint,
    isReady,
    isLoggedIn,
    username,
    desktopStatus,
    init,
    refreshDesktopState,
    wakeDesktop,
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

  async function autofill(credentialId: string): Promise<void> {
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
