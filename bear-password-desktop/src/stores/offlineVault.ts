import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { OfflineVaultSettings } from '../../shared/offlineVault'
import { setOfflineVaultModeEnabled, isOfflineVaultApiAvailable } from '@/utils/offlineVaultMode'
import { fetchAllPasswordEntriesRaw } from '@/api/vaultRaw'
import { getFavoriteMetaApi } from '@/api/favorites'
import { getRecentVisitMetaApi } from '@/api/recent'
import { useVaultStore } from '@/stores/vault'

export const useOfflineVaultStore = defineStore('offlineVault', () => {
  const enabled = ref(false)
  const dataDir = ref('')
  const defaultDataDir = ref('')
  const initialized = ref(false)
  const saving = ref(false)

  function applySettings(settings: OfflineVaultSettings): void {
    enabled.value = settings.enabled
    dataDir.value = settings.dataDir
    setOfflineVaultModeEnabled(settings.enabled)
  }

  async function loadSettings(): Promise<void> {
    if (!isOfflineVaultApiAvailable()) {
      initialized.value = true
      return
    }

    const [settings, defaultDir] = await Promise.all([
      window.offlineVaultApi!.getSettings(),
      window.offlineVaultApi!.getDefaultDataDir()
    ])

    defaultDataDir.value = defaultDir
    applySettings(settings)
    initialized.value = true
  }

  async function persistSettings(partial: Partial<OfflineVaultSettings>): Promise<boolean> {
    if (!isOfflineVaultApiAvailable()) return false

    saving.value = true
    try {
      const result = await window.offlineVaultApi!.setSettings(partial)
      if (!result.ok) return false
      applySettings(result.settings)
      return true
    } finally {
      saving.value = false
    }
  }

  async function pickDataDir(): Promise<string | null> {
    if (!isOfflineVaultApiAvailable()) return null
    return window.offlineVaultApi!.pickDataDir(dataDir.value || defaultDataDir.value)
  }

  async function setDataDir(
    nextDir: string,
    options: { migrateSnapshot?: unknown } = {}
  ): Promise<boolean> {
    const trimmed = nextDir.trim()
    if (!trimmed) return false

    const ok = await persistSettings({ dataDir: trimmed })
    if (!ok) return false

    if (options.migrateSnapshot) {
      const result = await window.offlineVaultApi!.importSnapshot(options.migrateSnapshot)
      if (!result.ok) return false

      const vaultStore = useVaultStore()
      vaultStore.reset()
      await vaultStore.refresh()
    }

    return true
  }

  async function importCurrentVaultToLocal(): Promise<boolean> {
    if (!isOfflineVaultApiAvailable()) return false

    const [entries, favorites, recents] = await Promise.all([
      fetchAllPasswordEntriesRaw(),
      getFavoriteMetaApi().catch(() => []),
      getRecentVisitMetaApi().catch(() => [])
    ])

    const maxId = entries.reduce((max, entry) => Math.max(max, Number(entry.id) || 0), 0)
    const result = await window.offlineVaultApi!.importSnapshot({
      version: 1,
      nextId: maxId + 1,
      entries,
      favorites: favorites.map((item) => ({
        passwordId: item.passwordId,
        time: item.time
      })),
      recentVisits: recents.map((item) => ({
        passwordId: item.passwordId,
        time: item.time
      }))
    })

    return result.ok
  }

  async function setEnabled(
    nextEnabled: boolean,
    options: { migrate?: boolean } = {}
  ): Promise<boolean> {
    if (nextEnabled) {
      if (options.migrate !== false) {
        const imported = await importCurrentVaultToLocal()
        if (!imported) return false
      }
      const ok = await persistSettings({ enabled: true })
      if (!ok) return false
    } else {
      const ok = await persistSettings({ enabled: false })
      if (!ok) return false
    }

    const vaultStore = useVaultStore()
    vaultStore.reset()
    await vaultStore.refresh()

    return true
  }

  return {
    enabled,
    dataDir,
    defaultDataDir,
    initialized,
    saving,
    loadSettings,
    pickDataDir,
    setDataDir,
    setEnabled,
    importCurrentVaultToLocal
  }
})
