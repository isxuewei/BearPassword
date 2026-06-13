<template>
  <div
    class="island-root"
    :class="{ 'island-root--expanded': expanded }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="island-shell" :class="{ 'island-shell--expanded': expanded }">
      <div v-if="!expanded" class="island-pill">
        <span class="island-pill__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" />
            <path d="M20 20L16.2 16.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </span>
        <span class="island-pill__text">{{ t('island.hint') }}</span>
        <span class="island-pill__pulse" aria-hidden="true" />
      </div>

      <div v-else class="island-panel">
        <header class="island-panel__header">
          <span class="island-panel__title">{{ t('island.title') }}</span>
          <span class="island-panel__badge">BearPassword</span>
        </header>

        <div v-if="!authStore.isLoggedIn" class="island-panel__empty">
          {{ t('island.loginRequired') }}
        </div>

        <div v-else-if="autoLockStore.isLocked" class="island-panel__empty">
          {{ t('island.locked') }}
        </div>

        <template v-else>
          <div class="island-panel__search">
            <input
              ref="searchInputRef"
              v-model="keyword"
              type="search"
              class="island-panel__input"
              :placeholder="t('island.searchPlaceholder')"
              @input="scheduleSearch"
              @keydown.enter.prevent="handleEnter"
              @keydown.escape.prevent="collapse"
            />
          </div>

          <div v-if="loading" class="island-panel__status">{{ t('island.loading') }}</div>
          <div v-else-if="errorMessage" class="island-panel__status island-panel__status--error">
            {{ errorMessage }}
          </div>
          <div v-else-if="keyword.trim() && !entries.length" class="island-panel__status">
            {{ t('island.noResults') }}
          </div>
          <div v-else-if="!keyword.trim()" class="island-panel__status">
            {{ t('island.searchHint') }}
          </div>

          <ul v-else class="island-panel__results">
            <li
              v-for="(entry, index) in entries"
              :key="entry.id"
              class="island-result"
              :class="{ 'island-result--active': activeIndex === index }"
              @mouseenter="activeIndex = index"
              @click="openEntry(entry)"
            >
              <span class="island-result__icon" :style="{ background: getEntryTypeColor(entry) }">
                {{ getEntryIconLabel(entry) }}
              </span>
              <span class="island-result__content">
                <span class="island-result__title">{{ resolveEntryTitle(entry) }}</span>
                <span class="island-result__meta">{{ getEntryTypeLabel(entry) }}</span>
              </span>
              <button
                type="button"
                class="island-result__copy"
                :title="t('island.copyPassword')"
                @click.stop="copyEntrySecret(entry)"
              >
                {{ t('island.copy') }}
              </button>
            </li>
          </ul>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getPasswordListApi } from '@/api/vault'
import { useI18n } from '@/composables/useI18n'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useAutoLockStore } from '@/stores/autoLock'
import type { PasswordEntry } from '@/types'
import { getEntryPrimarySecret } from '@/utils/entryPrimarySecret'
import { getPasswordTypeLabel as getPasswordTypeLabelUtil } from '@/utils/passwordTypeI18n'
import { resolveEntryTitle } from '@/utils/passwordTitle'
import {
  getEntryTypeColor,
  getPasswordTypeIconType,
  resolveEntryType
} from '@/utils/vaultEntryDisplay'
import { storage } from '@/utils/storage'

const { t, locale } = useI18n()
const authStore = useAuthStore()
const autoLockStore = useAutoLockStore()
const appStore = useAppStore()

const expanded = ref(false)
const keyword = ref('')
const entries = ref<PasswordEntry[]>([])
const loading = ref(false)
const errorMessage = ref('')
const activeIndex = ref(0)
const searchInputRef = ref<HTMLInputElement | null>(null)

let collapseTimer: ReturnType<typeof setTimeout> | null = null
let searchTimer: ReturnType<typeof setTimeout> | null = null
let storageListener: ((event: StorageEvent) => void) | null = null

function syncLockFromStorage(): void {
  autoLockStore.isLocked = storage.get<boolean>('app_locked', false) === true
}

function handleMouseEnter(): void {
  if (collapseTimer) {
    clearTimeout(collapseTimer)
    collapseTimer = null
  }
  if (expanded.value) return
  window.islandApi?.setExpanded(true)
  expanded.value = true
  window.islandApi?.touchActivity()
  void nextTick(() => {
    searchInputRef.value?.focus()
  })
}

function handleMouseLeave(): void {
  if (collapseTimer) clearTimeout(collapseTimer)
  collapseTimer = setTimeout(() => {
    collapse()
  }, 280)
}

function collapse(): void {
  expanded.value = false
  keyword.value = ''
  entries.value = []
  errorMessage.value = ''
  activeIndex.value = 0
  window.islandApi?.setExpanded(false)
}

async function loadResults(): Promise<void> {
  if (!authStore.isLoggedIn || autoLockStore.isLocked) return

  const trimmed = keyword.value.trim()
  if (!trimmed) {
    entries.value = []
    errorMessage.value = ''
    return
  }

  loading.value = true
  errorMessage.value = ''
  window.islandApi?.touchActivity()

  try {
    const data = await getPasswordListApi({
      page: 1,
      pageSize: 8,
      keyword: trimmed
    })
    entries.value = data.list
    activeIndex.value = 0
  } catch (err) {
    entries.value = []
    errorMessage.value = err instanceof Error ? err.message : t('island.loadFailed')
  } finally {
    loading.value = false
  }
}

function scheduleSearch(): void {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    void loadResults()
  }, 220)
}

function handleEnter(): void {
  if (searchTimer) clearTimeout(searchTimer)
  if (!entries.value.length) {
    void loadResults()
    return
  }
  const entry = entries.value[activeIndex.value] ?? entries.value[0]
  openEntry(entry)
}

function openEntry(entry: PasswordEntry): void {
  window.islandApi?.openEntry(Number(entry.id))
  collapse()
}

async function copyEntrySecret(entry: PasswordEntry): Promise<void> {
  const secret = getEntryPrimarySecret(entry)
  if (!secret) {
    ElMessage.info(t('island.noCopyableSecret'))
    return
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(secret)
    } else {
      throw new Error('clipboard unavailable')
    }
    ElMessage.success(t('island.copied'))
    window.islandApi?.touchActivity()
  } catch {
    ElMessage.error(t('island.copyFailed'))
  }
}

function getEntryTypeLabel(entry: PasswordEntry): string {
  return getPasswordTypeLabelUtil(resolveEntryType(entry), locale.value)
}

function getEntryIconLabel(entry: PasswordEntry): string {
  const type = getPasswordTypeIconType(resolveEntryType(entry))
  return type.slice(0, 1)
}

watch(
  () => authStore.isLoggedIn,
  () => {
    if (!authStore.isLoggedIn) {
      collapse()
    }
  }
)

onMounted(async () => {
  void appStore.initTheme()
  syncLockFromStorage()

  storageListener = (event: StorageEvent) => {
    if (event.key === 'bear_password_app_locked') {
      syncLockFromStorage()
      if (autoLockStore.isLocked) {
        collapse()
      }
    }
  }
  window.addEventListener('storage', storageListener)

  window.islandApi?.onAppState((state) => {
    autoLockStore.isLocked = state.locked
    if (state.locked || !state.loggedIn) {
      collapse()
    }
  })
})

onUnmounted(() => {
  if (collapseTimer) clearTimeout(collapseTimer)
  if (searchTimer) clearTimeout(searchTimer)
  if (storageListener) {
    window.removeEventListener('storage', storageListener)
  }
})
</script>

<style scoped lang="scss">
.island-root {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: stretch;
  align-items: stretch;
  background: transparent;
  -webkit-app-region: no-drag;
  overflow: hidden;
}

.island-shell {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.island-pill {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  padding: 0 18px;
  box-sizing: border-box;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(10, 10, 12, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(18px);
  cursor: default;
  overflow: hidden;

  &__icon {
    display: inline-flex;
    width: 16px;
    height: 16px;
    opacity: 0.88;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  &__text {
    font-size: 13px;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  &__pulse {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      120deg,
      transparent 0%,
      rgba(255, 255, 255, 0.08) 45%,
      transparent 100%
    );
    transform: translateX(-120%);
    animation: island-shimmer 3.2s ease-in-out infinite;
  }
}

.island-panel {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 14px;
  border-radius: 22px;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(12, 12, 16, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 18px 50px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: island-expand 0.24s cubic-bezier(0.22, 1, 0.36, 1);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
  }

  &__badge {
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 999px;
    color: rgba(255, 255, 255, 0.72);
    background: rgba(255, 255, 255, 0.08);
  }

  &__search {
    display: flex;
  }

  &__input {
    width: 100%;
    height: 40px;
    padding: 0 14px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.06);
    color: inherit;
    font-size: 14px;
    outline: none;

    &::placeholder {
      color: rgba(255, 255, 255, 0.42);
    }

    &:focus {
      border-color: rgba(108, 92, 231, 0.75);
      box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.18);
    }
  }

  &__status {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.58);
    padding: 8px 2px 2px;

    &--error {
      color: #ff8a8a;
    }
  }

  &__results {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  &__empty {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.62);
    padding: 18px 4px;
    text-align: center;
  }
}

.island-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.16s ease;

  &:hover,
  &--active {
    background: rgba(255, 255, 255, 0.08);
  }

  &__icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }

  &__content {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.48);
  }

  &__copy {
    border: none;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.82);
    font-size: 11px;
    padding: 6px 10px;
    border-radius: 999px;
    cursor: pointer;
    flex-shrink: 0;

    &:hover {
      background: rgba(108, 92, 231, 0.35);
    }
  }
}

@keyframes island-shimmer {
  0%,
  70%,
  100% {
    transform: translateX(-120%);
  }
  85% {
    transform: translateX(120%);
  }
}

@keyframes island-expand {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>

<style lang="scss">
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: transparent !important;
}
</style>
