<template>
  <div class="vault-view">
    <header class="vault-view__topbar">
      <div class="vault-view__topbar-left">
        <el-dropdown trigger="click" popper-class="vault-sort-dropdown" @command="handleSortCommand">
          <button type="button" class="vault-view__sort-btn" :aria-label="t('vault.sortAriaLabel')">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 4.5H15M3 9H11M3 13.5H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M13.5 7.5V13.5M13.5 13.5L12 12M13.5 13.5L15 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <template #dropdown>
            <el-dropdown-menu class="vault-sort-menu">
              <div class="vault-sort-menu__header">{{ t('vault.sortHeader', { count: total }) }}</div>
              <el-dropdown-item
                v-for="option in sortFieldOptions"
                :key="option.value"
                :command="{ type: 'field', value: option.value }"
                :class="{ 'is-active': sortState.field === option.value }"
              >
                <span>{{ option.label }}</span>
                <svg
                  v-if="sortState.field === option.value"
                  class="vault-sort-menu__check"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </el-dropdown-item>
              <el-dropdown-item
                v-for="(option, index) in sortOrderOptions"
                :key="option.value"
                :divided="index === 0"
                :command="{ type: 'order', value: option.value }"
                :class="{ 'is-active': sortState.order === option.value }"
              >
                <span>{{ option.label }}</span>
                <svg
                  v-if="sortState.order === option.value"
                  class="vault-sort-menu__check"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-select
          v-if="!isSpecialListMode"
          v-model="filterType"
          :placeholder="t('vault.allCategories')"
          clearable
          size="large"
          class="vault-view__category"
          @change="handleSearch"
        >
          <template v-if="filterType" #prefix>
            <span
              class="vault-view__category-prefix-icon"
              :style="{ background: getPasswordTypeColor(filterType) }"
            >
              <VaultEntryTypeIcon :type="getPasswordTypeIconType(filterType)" :size="14" />
            </span>
          </template>
          <el-option
            v-for="item in passwordTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
            <span class="vault-view__category-option">
              <span
                class="vault-view__category-option-icon"
                :style="{ background: getPasswordTypeColor(item.value) }"
              >
                <VaultEntryTypeIcon :type="getPasswordTypeIconType(item.value)" :size="14" />
              </span>
              <span>{{ item.label }}</span>
            </span>
          </el-option>
        </el-select>
        <el-input
          ref="searchInputRef"
          v-model="keyword"
          :placeholder="t('vault.searchPlaceholder')"
          clearable
          size="large"
          :prefix-icon="Search"
          class="vault-view__search"
          @input="scheduleSearch"
          @clear="handleSearch"
          @keyup.enter="onSearchEnter"
        />
      </div>
      <el-button v-if="!isSpecialListMode" type="primary" size="large" :icon="Plus" @click="openCreate">
        {{ t('vault.newItem') }}
      </el-button>
    </header>

    <div v-loading="loading" class="vault-view__split">
      <aside class="vault-view__list-pane">
        <div v-if="!loading && entries.length === 0" class="vault-view__list-empty">
          <p>{{ emptyListText }}</p>
          <button v-if="!isSpecialListMode" type="button" class="vault-view__list-empty-btn" @click="openCreate">
            + {{ t('vault.newItem') }}
          </button>
        </div>

        <div v-else class="vault-view__list-scroll">
          <section
            v-for="group in groupedEntries"
            :key="group.label"
            class="vault-view__group"
          >
            <h3 v-if="group.label" class="vault-view__group-title">{{ group.label }}</h3>
            <div
              v-for="entry in group.entries"
              :key="entry.id"
              class="vault-view__list-item"
              :class="{ 'is-active': selectedEntryId === entry.id }"
            >
              <button
                type="button"
                class="vault-view__list-item-main"
                @click="selectEntry(entry.id)"
                @contextmenu.prevent="onItemContextMenu($event, entry)"
              >
                <span class="vault-view__item-icon" :style="{ background: getEntryTypeColor(entry) }">
                  <VaultEntryTypeIcon :type="getEntryIconType(entry)" :size="18" />
                </span>
                <span class="vault-view__item-text">
                  <span class="vault-view__item-title">{{ getEntryTitle(entry) }}</span>
                  <span class="vault-view__item-subtitle">{{ getEntrySubtitle(entry) }}</span>
                </span>
                <span
                  v-if="isEntryFavorite(entry)"
                  class="vault-view__item-favorite"
                  aria-hidden="true"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1.5L10.2 5.8L15 6.5L11.5 9.8L12.3 14.5L8 12.2L3.7 14.5L4.5 9.8L1 6.5L5.8 5.8L8 1.5Z"/>
                  </svg>
                </span>
              </button>

              <el-dropdown
                :ref="(el) => setEntryDropdownRef(entry.id, el)"
                trigger="click"
                placement="bottom-end"
                @visible-change="(visible) => onEntryMenuVisibleChange(visible, entry.id)"
                @command="(cmd) => handleEntryMenuCommand(cmd as EntryMenuCommand, entry)"
              >
                <button
                  type="button"
                  class="vault-view__item-more"
                  :aria-label="t('vault.detail.moreActions')"
                  @click.stop
                  @contextmenu.prevent="onItemContextMenu($event, entry)"
                >
                  <el-icon :size="16"><MoreFilled /></el-icon>
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="favorite" :disabled="favoriteLoading">
                      {{ isEntryFavorite(entry) ? t('vault.detail.unfavorite') : t('vault.detail.favorite') }}
                    </el-dropdown-item>
                    <el-dropdown-item command="share">{{ t('vault.detail.share') }}</el-dropdown-item>
                    <el-dropdown-item command="duplicate">{{ t('vault.detail.duplicate') }}</el-dropdown-item>
                    <el-dropdown-item command="edit">{{ t('vault.detail.edit') }}</el-dropdown-item>
                    <el-dropdown-item command="delete" divided class="vault-view__menu-item--danger">
                      {{ t('vault.detail.delete') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </section>
        </div>

        <div v-if="total > pageSize" class="vault-view__list-footer">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[20, 50, 100]"
            layout="prev, pager, next"
            small
            @current-change="loadEntries"
            @size-change="handleSizeChange"
          />
        </div>
      </aside>

      <main class="vault-view__detail-pane">
        <div v-if="selectedEntry" class="vault-view__detail-inner">
          <div class="vault-view__field-panel">
            <div class="vault-view__panel-hero">
              <span
                class="vault-view__detail-icon"
                :style="{ background: getEntryTypeColor(selectedEntry), boxShadow: `0 8px 20px ${getEntryTypeColor(selectedEntry)}33` }"
              >
                <VaultEntryTypeIcon :type="getEntryIconType(selectedEntry)" :size="24" />
              </span>
              <div class="vault-view__detail-heading">
                <h2 class="vault-view__detail-title">{{ getEntryDetailTitle(selectedEntry) }}</h2>
                <span
                  class="vault-view__detail-type-pill"
                  :style="{ color: getEntryTypeColor(selectedEntry), background: `${getEntryTypeColor(selectedEntry)}18` }"
                >
                  {{ passwordTypeLabel(resolveEntryType(selectedEntry)) }}
                </span>
              </div>
              <button
                type="button"
                class="vault-view__favorite-btn"
                :class="{ 'is-active': isEntryFavorite(selectedEntry) }"
                :disabled="favoriteLoading"
                :aria-label="isEntryFavorite(selectedEntry) ? t('vault.detail.unfavorite') : t('vault.detail.addFavorite')"
                @click="handleToggleFavorite(selectedEntry)"
              >
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M8 1.5L10.2 5.8L15 6.5L11.5 9.8L12.3 14.5L8 12.2L3.7 14.5L4.5 9.8L1 6.5L5.8 5.8L8 1.5Z"
                    :fill="isEntryFavorite(selectedEntry) ? 'currentColor' : 'none'"
                    stroke="currentColor"
                    stroke-width="1.2"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div class="vault-view__field-divider" />

            <div
              v-for="(item, index) in getPreviewFields(selectedEntry)"
              :key="item.label"
              class="vault-view__field-row"
              :class="{ 'vault-view__field-row--secret': item.secret }"
            >
              <div v-if="index > 0" class="vault-view__field-divider" />
              <div class="vault-view__field-body">
                <span class="vault-view__field-label">{{ item.label }}</span>
                <div class="vault-view__field-value-wrap">
                  <div
                    v-if="item.links?.length"
                    class="vault-view__field-value vault-view__field-value--links"
                    @click="handleFieldClick(selectedEntry.id, item)"
                  >
                    <template v-for="(link, linkIndex) in item.links" :key="`${link}-${linkIndex}`">
                      <span v-if="linkIndex > 0">, </span>
                      <a
                        :href="normalizeWebsiteHref(link)"
                        target="_blank"
                        rel="noopener noreferrer"
                        @click.stop
                      >{{ link }}</a>
                    </template>
                  </div>
                  <button
                    v-else
                    type="button"
                    class="vault-view__field-value"
                    :class="{
                      'vault-view__field-value--secret': item.secret,
                      'is-masked': item.secret && !isFieldVisible(selectedEntry.id, item.label)
                    }"
                    @click="handleFieldClick(selectedEntry.id, item)"
                  >
                    <template v-if="item.secret">
                      {{ isFieldVisible(selectedEntry.id, item.label) ? item.value : '••••••••••••' }}
                    </template>
                    <template v-else>{{ item.value }}</template>
                  </button>
                  <button
                    v-if="item.secret"
                    type="button"
                    class="vault-view__field-action"
                    @click.stop="toggleFieldVisible(selectedEntry.id, item.label)"
                  >
                    {{ isFieldVisible(selectedEntry.id, item.label) ? t('vault.detail.hide') : t('vault.detail.show') }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedEntry.passwordLabels.length" class="vault-view__info-panel">
            <h4 class="vault-view__panel-label">{{ t('vault.detail.tags') }}</h4>
            <div class="vault-view__tags">
              <span v-for="label in selectedEntry.passwordLabels" :key="label" class="vault-view__tag">{{ label }}</span>
            </div>
          </div>

          <div v-if="selectedEntry.remark" class="vault-view__info-panel">
            <h4 class="vault-view__panel-label">{{ t('vault.detail.remark') }}</h4>
            <p class="vault-view__remark">{{ selectedEntry.remark }}</p>
          </div>

          <footer class="vault-view__detail-footer">
            <span
              v-if="selectedEntry.updateTime || selectedEntry.createTime"
              class="vault-view__detail-meta"
            >
              {{
                t('vault.detail.lastEdited', {
                  time: formatDateTime(selectedEntry.updateTime || selectedEntry.createTime)
                })
              }}
            </span>
            <div class="vault-view__detail-actions">
              <el-tooltip
                :content="isEntryFavorite(selectedEntry) ? t('vault.detail.unfavorite') : t('vault.detail.favorite')"
                placement="top"
              >
                <button
                  type="button"
                  class="vault-view__action-btn"
                  :class="{ 'vault-view__action-btn--active': isEntryFavorite(selectedEntry) }"
                  :disabled="favoriteLoading"
                  :aria-label="isEntryFavorite(selectedEntry) ? t('vault.detail.unfavorite') : t('vault.detail.favorite')"
                  @click="handleToggleFavorite(selectedEntry)"
                >
                  <el-icon>
                    <StarFilled v-if="isEntryFavorite(selectedEntry)" />
                    <Star v-else />
                  </el-icon>
                </button>
              </el-tooltip>
              <el-tooltip :content="t('vault.detail.share')" placement="top">
                <button
                  type="button"
                  class="vault-view__action-btn"
                  :aria-label="t('vault.detail.share')"
                  @click="handleCopyEntry(selectedEntry)"
                >
                  <el-icon><Share /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip :content="t('vault.detail.duplicate')" placement="top">
                <button
                  type="button"
                  class="vault-view__action-btn"
                  :aria-label="t('vault.detail.duplicate')"
                  @click="handleDuplicateEntry(selectedEntry)"
                >
                  <el-icon><CopyDocument /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip :content="t('vault.detail.edit')" placement="top">
                <button
                  type="button"
                  class="vault-view__action-btn"
                  :aria-label="t('vault.detail.edit')"
                  @click="openEdit(selectedEntry)"
                >
                  <el-icon><EditPen /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip :content="t('vault.detail.delete')" placement="top">
                <button
                  type="button"
                  class="vault-view__action-btn vault-view__action-btn--danger"
                  :aria-label="t('vault.detail.delete')"
                  @click="handleDelete(selectedEntry)"
                >
                  <el-icon><Delete /></el-icon>
                </button>
              </el-tooltip>
            </div>
          </footer>
        </div>

        <div v-else class="vault-view__detail-empty">
          <p>{{ t('vault.empty.selectItem') }}</p>
        </div>
      </main>
    </div>

    <PasswordTypePicker
      v-model:visible="pickerVisible"
      @select="onTypeSelected"
    />

    <PasswordEntryDialog
      v-model:visible="dialogVisible"
      :entry="editingEntry"
      :preset-type="presetType"
      :preset-label="presetLabel"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Plus,
  Search,
  MoreFilled,
  Star,
  StarFilled,
  Share,
  CopyDocument,
  EditPen,
  Delete
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { DropdownInstance, InputInstance } from 'element-plus'
import PasswordEntryDialog from '@/components/vault/PasswordEntryDialog.vue'
import PasswordTypePicker from '@/components/vault/PasswordTypePicker.vue'
import VaultEntryTypeIcon from '@/components/vault/VaultEntryTypeIcon.vue'
import {
  addFavoriteApi,
  createPasswordApi,
  deletePasswordApi,
  getFavoriteIdsApi,
  getFavoriteListApi,
  getPasswordListApi,
  getRecentVisitListApi,
  recordRecentVisitApi,
  removeFavoriteApi,
  updatePasswordApi
} from '@/api'
import type { PasswordEntry, PasswordEntryParams, PasswordType } from '@/types'
import { useI18n } from '@/composables/useI18n'
import {
  getPasswordTypeFilterOptions,
  getPasswordTypeLabel
} from '@/utils/passwordTypeI18n'
import { useServerStore } from '@/stores/server'
import { useTrayStore } from '@/stores/tray'
import { isSecretCustomField, normalizeCustomContent } from '@/utils/customContent'
import { normalizeDatabaseContent } from '@/utils/databaseContent'
import { normalizeBankCardContent } from '@/utils/bankCardContent'
import { normalizeIdentityContent } from '@/utils/identityContent'
import {
  getLoginUsername,
  normalizeWebsiteHref,
  normalizeLoginContent
} from '@/utils/loginContent'
import { resolveEntryTitle, stripTitleFromContent } from '@/utils/passwordTitle'
import {
  formatWebsitesDisplay,
  resolveEntryWebsites,
  stripWebsitesFromContent
} from '@/utils/passwordWebsites'
import { getSecureNoteBodyPreview, normalizeSecureNoteContent } from '@/utils/secureNoteContent'
import {
  getEntryIconType,
  getEntryTypeColor,
  getPasswordTypeColor,
  getPasswordTypeIconType,
  resolveEntryType
} from '@/utils/vaultEntryDisplay'
import { isSecretVaultFieldLabel, translateVaultFieldLabel } from '@/utils/vaultFieldI18n'
import {
  getVaultSortOrderOptions,
  loadVaultSort,
  recordRecentAccess,
  saveVaultSort,
  sortAndGroupEntries,
  VAULT_SORT_FIELD_OPTIONS,
  type VaultSortField,
  type VaultSortOrder,
  type VaultSortState
} from '@/utils/vaultSort'

interface PreviewField {
  label: string
  value: string
  secret?: boolean
  links?: string[]
}

interface EntryGroup {
  label: string
  entries: PasswordEntry[]
}

const route = useRoute()
const { t, locale } = useI18n()
const serverStore = useServerStore()
const trayStore = useTrayStore()
const listMode = computed(() => (route.meta.mode as string | undefined) ?? 'vault')
const isFavoritesMode = computed(() => listMode.value === 'favorites')
const isRecentMode = computed(() => listMode.value === 'recent')
const isSpecialListMode = computed(() => isFavoritesMode.value || isRecentMode.value)
const emptyListText = computed(() => {
  if (isFavoritesMode.value) return t('vault.empty.favorites')
  if (isRecentMode.value) return t('vault.empty.recent')
  return t('vault.empty.default')
})

function previewFieldLabel(label: string): string {
  return translateVaultFieldLabel(label, locale.value)
}

const sortState = ref<VaultSortState>(loadVaultSort())

const passwordTypeOptions = computed(() => getPasswordTypeFilterOptions(locale.value))

const sortFieldOptions = computed(() =>
  VAULT_SORT_FIELD_OPTIONS.map((option) => ({
    value: option.value,
    label: t(`vault.sort.field.${option.value}`)
  }))
)

const sortOrderOptions = computed(() => {
  const field = sortState.value.field
  return getVaultSortOrderOptions(field).map((option) => {
    const orderKey =
      field === 'title'
        ? option.value === 'asc'
          ? 'titleAsc'
          : 'titleDesc'
        : option.value === 'desc'
          ? 'newest'
          : 'oldest'
    return {
      value: option.value,
      label: t(`vault.sort.order.${orderKey}`)
    }
  })
})

const loading = ref(false)
const entries = ref<PasswordEntry[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const keyword = ref('')
const filterType = ref<PasswordType | ''>('')
const selectedEntryId = ref<number | null>(null)
const searchInputRef = ref<InputInstance>()
let searchTimer: ReturnType<typeof setTimeout> | null = null

const dialogVisible = ref(false)
const pickerVisible = ref(false)
const editingEntry = ref<PasswordEntry | null>(null)
const presetType = ref<PasswordType | null>(null)
const presetLabel = ref<string | null>(null)
const visibleFields = ref<Record<string, boolean>>({})
const favoriteIds = ref<number[]>([])
const favoriteLoading = ref(false)
const entryDropdownRefs = new Map<number, DropdownInstance>()

type EntryMenuCommand = 'favorite' | 'share' | 'duplicate' | 'edit' | 'delete'

const selectedEntry = computed(() =>
  entries.value.find((entry) => entry.id === selectedEntryId.value) ?? null
)

const entriesForDisplay = computed(() => {
  if (isFavoritesMode.value) {
    return entries.value.map((entry) => ({
      ...entry,
      createTime: entry.favoriteTime ?? entry.createTime
    }))
  }
  if (isRecentMode.value) {
    return entries.value.map((entry) => ({
      ...entry,
      createTime: entry.recentVisitTime ?? entry.createTime
    }))
  }
  return entries.value
})

const groupedEntries = computed(() =>
  sortAndGroupEntries(entriesForDisplay.value, sortState.value, getEntryTitle)
)

watch(entries, (list) => {
  if (!list.length) {
    selectedEntryId.value = null
    return
  }
  if (!list.some((entry) => entry.id === selectedEntryId.value)) {
    selectedEntryId.value = list[0].id
  }
})

watch(
  () => route.name,
  () => {
    page.value = 1
    keyword.value = ''
    filterType.value = ''
    if (isFavoritesMode.value) {
      loadEntries()
      return
    }
    loadFavoriteIds().then(() => loadEntries())
  }
)

watch(
  () => serverStore.revision,
  () => {
    if (isFavoritesMode.value) {
      void loadEntries()
      return
    }
    void loadFavoriteIds().then(() => loadEntries())
  }
)

function isEntryFavorite(entry: PasswordEntry): boolean {
  if (isFavoritesMode.value) return true
  return favoriteIds.value.includes(Number(entry.id))
}

async function loadFavoriteIds(): Promise<void> {
  try {
    const ids = await getFavoriteIdsApi()
    favoriteIds.value = ids.map((id) => Number(id))
  } catch {
    // 保留现有状态，避免刷新失败时清空已收藏标记
  }
}

async function handleToggleFavorite(entry: PasswordEntry): Promise<void> {
  const entryId = Number(entry.id)
  const favorited = isEntryFavorite(entry)
  favoriteLoading.value = true
  try {
    if (favorited) {
      await removeFavoriteApi(entryId)
      favoriteIds.value = favoriteIds.value.filter((id) => id !== entryId)
      ElMessage.success(t('vault.msg.favoriteRemoved'))
      if (isFavoritesMode.value) {
        if (entries.value.length === 1 && page.value > 1) {
          page.value -= 1
        }
        await loadEntries()
      }
    } else {
      await addFavoriteApi(entryId)
      if (!favoriteIds.value.includes(entryId)) {
        favoriteIds.value = [...favoriteIds.value, entryId]
      }
      ElMessage.success(t('vault.msg.favoriteAdded'))
    }
    await loadFavoriteIds()
  } catch (err) {
    await loadFavoriteIds().catch(() => undefined)
    ElMessage.error(err instanceof Error ? err.message : t('vault.msg.operationFailed'))
  } finally {
    favoriteLoading.value = false
  }
}

function fieldVisibleKey(entryId: number, label: string): string {
  return `${entryId}:${label}`
}

function isFieldVisible(entryId: number, label: string): boolean {
  return !!visibleFields.value[fieldVisibleKey(entryId, label)]
}

function toggleFieldVisible(entryId: number, label: string): void {
  const key = fieldVisibleKey(entryId, label)
  visibleFields.value[key] = !visibleFields.value[key]
}

async function handleFieldClick(entryId: number, item: PreviewField): Promise<void> {
  if (!item.value || item.value === '-') return

  if (item.secret && !isFieldVisible(entryId, item.label)) {
    toggleFieldVisible(entryId, item.label)
  }

  const copied = await copyText(t('vault.msg.fieldCopied', { label: item.label }), item.value)
  if (!copied) return

  recordRecentAccess(entryId)
  void recordRecentVisitApi(entryId).catch(() => {})
}

function buildEntryCopyText(entry: PasswordEntry): string {
  const lines: string[] = []

  for (const field of getPreviewFields(entry)) {
    if (!field.value || field.value === '-') continue
    lines.push(`${field.label}: ${field.value}`)
  }

  if (entry.remark?.trim()) {
    lines.push(t('vault.msg.remarkLine', { text: entry.remark.trim() }))
  }

  lines.push('')
  lines.push(t('vault.msg.shareFooter'))
  return lines.join('\n')
}

async function handleCopyEntry(entry: PasswordEntry): Promise<void> {
  const text = buildEntryCopyText(entry)
  if (!text.trim()) {
    ElMessage.warning({ message: t('entry.msg.nothingToCopy'), duration: 1500 })
    return
  }
  await copyText(t('vault.msg.shareCopied'), text)
}

function buildDuplicateEntryParams(entry: PasswordEntry): PasswordEntryParams {
  const rawContent = JSON.parse(JSON.stringify(entry.content)) as PasswordEntry['content']
  const content = stripWebsitesFromContent(stripTitleFromContent(rawContent))
  return {
    passwordType: resolveEntryType(entry),
    passwordLabels: [...entry.passwordLabels],
    passwordTitle: `${getEntryDetailTitle(entry)}_副本`,
    websites: [...resolveEntryWebsites(entry)],
    content,
    remark: entry.remark ?? ''
  }
}

async function handleDuplicateEntry(entry: PasswordEntry): Promise<void> {
  try {
    const created = await createPasswordApi(buildDuplicateEntryParams(entry))
    ElMessage.success(t('vault.msg.duplicateCreated'))
    await loadEntries()
    selectedEntryId.value = created.id
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : t('vault.msg.duplicateFailed'))
  }
}

async function copyText(successMessage: string, text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      ElMessage.success({ message: successMessage, duration: 1500 })
      return true
    }
  } catch {
    // fallback below
  }

  ElMessage.warning({ message: t('entry.msg.copyFailed'), duration: 1500 })
  return false
}

function selectEntry(id: number): void {
  selectedEntryId.value = id
}

function setEntryDropdownRef(id: number, el: unknown): void {
  const instance = el as DropdownInstance | null
  if (instance?.handleOpen) {
    entryDropdownRefs.set(id, instance)
  } else {
    entryDropdownRefs.delete(id)
  }
}

function closeAllEntryMenus(exceptId?: number): void {
  entryDropdownRefs.forEach((instance, id) => {
    if (exceptId !== undefined && id === exceptId) return
    instance.handleClose?.()
  })
}

function onEntryMenuVisibleChange(visible: boolean, entryId: number): void {
  if (visible) {
    closeAllEntryMenus(entryId)
  }
}

function openEntryMenu(entry: PasswordEntry): void {
  selectEntry(entry.id)
  closeAllEntryMenus()
  void nextTick(() => {
    entryDropdownRefs.get(entry.id)?.handleOpen()
  })
}

function onItemContextMenu(event: MouseEvent, entry: PasswordEntry): void {
  event.preventDefault()
  openEntryMenu(entry)
}

async function handleEntryMenuCommand(
  command: EntryMenuCommand,
  entry: PasswordEntry
): Promise<void> {
  switch (command) {
    case 'favorite':
      await handleToggleFavorite(entry)
      break
    case 'share':
      await handleCopyEntry(entry)
      break
    case 'duplicate':
      await handleDuplicateEntry(entry)
      break
    case 'edit':
      openEdit(entry)
      break
    case 'delete':
      await handleDelete(entry)
      break
  }
}

function handleSortCommand(command: { type: 'field' | 'order'; value: VaultSortField | VaultSortOrder }): void {
  if (command.type === 'field') {
    sortState.value = { ...sortState.value, field: command.value as VaultSortField }
  } else {
    sortState.value = { ...sortState.value, order: command.value as VaultSortOrder }
  }
  saveVaultSort(sortState.value)
}

async function loadEntries(): Promise<void> {
  loading.value = true
  try {
    if (isFavoritesMode.value) {
      const data = await getFavoriteListApi({
        page: page.value,
        pageSize: pageSize.value,
        keyword: keyword.value.trim() || undefined
      })
      entries.value = data.list.map((entry) => ({ ...entry, favorite: true }))
      total.value = data.total
      return
    }

    if (isRecentMode.value) {
      const data = await getRecentVisitListApi({
        page: page.value,
        pageSize: pageSize.value,
        keyword: keyword.value.trim() || undefined
      })
      entries.value = data.list
      total.value = data.total
      return
    }

    const data = await getPasswordListApi({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      passwordType: filterType.value || undefined
    })
    entries.value = data.list
    total.value = data.total
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch(): void {
  page.value = 1
  loadEntries()
}

function scheduleSearch(): void {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(handleSearch, 300)
}

function onSearchEnter(): void {
  if (searchTimer) clearTimeout(searchTimer)
  handleSearch()
}

function onSearchHotkey(event: KeyboardEvent): void {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
    event.preventDefault()
    searchInputRef.value?.focus()
  }
}

function handleSizeChange(): void {
  page.value = 1
  loadEntries()
}

function openCreate(): void {
  editingEntry.value = null
  presetType.value = null
  presetLabel.value = null
  pickerVisible.value = true
}

function onTypeSelected(type: PasswordType, label: string): void {
  editingEntry.value = null
  dialogVisible.value = false
  presetType.value = type
  presetLabel.value = label
  nextTick(() => {
    dialogVisible.value = true
  })
}

function openEdit(entry: PasswordEntry): void {
  editingEntry.value = entry
  presetType.value = null
  presetLabel.value = null
  dialogVisible.value = true
}

async function handleSubmit(data: PasswordEntryParams): Promise<void> {
  try {
    if (editingEntry.value) {
      await updatePasswordApi(editingEntry.value.id, data)
      ElMessage.success(t('vault.msg.updated'))
    } else {
      await createPasswordApi(data)
      ElMessage.success(t('vault.msg.created'))
    }
    dialogVisible.value = false
    await loadEntries()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : t('vault.msg.saveFailed'))
  }
}

async function handleDelete(entry: PasswordEntry): Promise<void> {
  try {
    await ElMessageBox.confirm(
      t('vault.msg.deleteConfirm', { title: getEntryTitle(entry) }),
      t('vault.msg.deleteConfirmTitle'),
      {
        type: 'warning',
        confirmButtonText: t('vault.detail.delete'),
        cancelButtonText: t('entry.dialog.cancel')
      }
    )
    await deletePasswordApi(entry.id)
    ElMessage.success(t('vault.msg.deleted'))
    if (entries.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadEntries()
  } catch (err) {
    if (err !== 'cancel' && err !== 'close') {
      ElMessage.error(err instanceof Error ? err.message : t('vault.msg.deleteFailed'))
    }
  }
}

function passwordTypeLabel(type: PasswordType): string {
  return getPasswordTypeLabel(type, locale.value)
}

function getEntryDetailTitle(entry: PasswordEntry): string {
  return resolveEntryTitle(entry)
}

function getEntryTitle(entry: PasswordEntry): string {
  const base = resolveEntryTitle(entry)
  if (resolveEntryType(entry) === '银行卡') {
    const cardNumber = (entry.content as Record<string, string>).cardNumber
    return base + maskCard(cardNumber)
  }
  return base
}

function getEntrySubtitle(entry: PasswordEntry): string {
  const entryType = resolveEntryType(entry)
  const content = entry.content as Record<string, unknown>
  switch (entryType) {
    case '服务器': {
      const normalized = normalizeLoginContent(content)
      return normalized.host || normalized.username || passwordTypeLabel('服务器')
    }
    case '登录信息':
      return getLoginUsername(content) || formatWebsitesDisplay(resolveEntryWebsites(entry)) || '-'
    case '数据库': {
      const database = normalizeDatabaseContent(content)
      return database.host || database.username || database.dbType || '-'
    }
    case '银行卡':
      return normalizeBankCardContent(content).cardHolder || '-'
    case '身份信息':
      return normalizeIdentityContent(content).name || '-'
    case '安全备注':
      return getSecureNoteBodyPreview(content)
    case '自定义': {
      const custom = normalizeCustomContent(content)
      const first = custom.fields.find((field) => field.value.trim())
      return first?.value || '-'
    }
    default:
      return '-'
  }
}

function maskCard(cardNumber?: string): string {
  if (!cardNumber) return ''
  const tail = cardNumber.slice(-4)
  return tail ? ` ···${tail}` : ''
}

function getPreviewFields(entry: PasswordEntry): PreviewField[] {
  const entryType = resolveEntryType(entry)
  switch (entryType) {
    case '安全备注': {
      const note = normalizeSecureNoteContent(entry.content as Record<string, unknown>)
      const fields: PreviewField[] = [
        {
          label: previewFieldLabel('内容'),
          value: getSecureNoteBodyPreview(entry.content as Record<string, unknown>)
        }
      ]
      note.extraFields.forEach((field) => {
        if (field.label.trim() || field.value.trim()) {
          fields.push({
            label: previewFieldLabel(field.label),
            value: field.value || '-'
          })
        }
      })
      return fields
    }
    case '服务器': {
      const content = entry.content as Record<string, unknown>
      const normalized = normalizeLoginContent(content)
      const fields: PreviewField[] = [
        { label: previewFieldLabel('主机'), value: normalized.host || '-' },
        { label: previewFieldLabel('用户名'), value: getLoginUsername(content) },
        { label: previewFieldLabel('密码'), value: String(content.password ?? '-'), secret: true }
      ]
      normalized.extraFields.forEach((field) => {
        if (field.label.trim() || field.value.trim()) {
          fields.push({
            label: previewFieldLabel(field.label),
            value: field.value || '-',
            secret: isSecretVaultFieldLabel(field.label)
          })
        }
      })
      return fields
    }
    case '登录信息': {
      const content = entry.content as Record<string, unknown>
      const normalized = normalizeLoginContent(content)
      const websiteList = resolveEntryWebsites(entry)
      const fields: PreviewField[] = [
        {
          label: previewFieldLabel('网站'),
          value: formatWebsitesDisplay(websiteList),
          links: websiteList
        },
        { label: previewFieldLabel('用户名'), value: getLoginUsername(content) },
        { label: previewFieldLabel('密码'), value: String(content.password ?? '-'), secret: true }
      ]
      normalized.extraFields.forEach((field) => {
        if (field.label.trim() || field.value.trim()) {
          fields.push({
            label: previewFieldLabel(field.label),
            value: field.value || '-',
            secret: isSecretVaultFieldLabel(field.label)
          })
        }
      })
      return fields
    }
    case '银行卡': {
      const card = normalizeBankCardContent(entry.content as Record<string, unknown>)
      const fields: PreviewField[] = [
        { label: previewFieldLabel('银行'), value: card.bankName || '-' },
        { label: previewFieldLabel('持卡人'), value: card.cardHolder || '-' },
        { label: previewFieldLabel('卡号'), value: card.cardNumber || '-', secret: true },
        { label: previewFieldLabel('有效期'), value: card.expiry || '-' },
        { label: previewFieldLabel('安全码'), value: card.cvv || '-', secret: true }
      ]
      card.extraFields.forEach((field) => {
        if (field.label.trim() || field.value.trim()) {
          fields.push({
            label: previewFieldLabel(field.label),
            value: field.value || '-',
            secret: isSecretVaultFieldLabel(field.label)
          })
        }
      })
      return fields
    }
    case '身份信息': {
      const identity = normalizeIdentityContent(entry.content as Record<string, unknown>)
      const fields: PreviewField[] = [
        { label: previewFieldLabel('姓名'), value: identity.name || '-' },
        { label: previewFieldLabel('证件号'), value: identity.idNumber || '-', secret: true },
        { label: previewFieldLabel('出生日期'), value: identity.birthDate || '-' },
        { label: previewFieldLabel('农历生日'), value: identity.lunarBirthday || '-' },
        { label: previewFieldLabel('电话'), value: identity.phone || '-' },
        { label: previewFieldLabel('地址'), value: identity.address || '-' }
      ]
      identity.extraFields.forEach((field) => {
        if (field.label.trim() || field.value.trim()) {
          fields.push({
            label: previewFieldLabel(field.label),
            value: field.value || '-',
            secret: isSecretVaultFieldLabel(field.label)
          })
        }
      })
      return fields
    }
    case '数据库': {
      const database = normalizeDatabaseContent(entry.content as Record<string, unknown>)
      const fields: PreviewField[] = [
        { label: previewFieldLabel('类型'), value: database.dbType || '-' },
        { label: previewFieldLabel('主机'), value: database.host || '-' },
        { label: previewFieldLabel('端口'), value: database.port || '-' },
        { label: previewFieldLabel('数据库'), value: database.databaseName || '-' },
        { label: previewFieldLabel('用户名'), value: database.username || '-' },
        { label: previewFieldLabel('密码'), value: database.password || '-', secret: true }
      ]
      database.extraFields.forEach((field) => {
        if (field.label.trim() || field.value.trim()) {
          fields.push({
            label: previewFieldLabel(field.label),
            value: field.value || '-',
            secret: isSecretVaultFieldLabel(field.label)
          })
        }
      })
      return fields
    }
    case '自定义': {
      const custom = normalizeCustomContent(entry.content as Record<string, unknown>)
      return custom.fields.map((field) => ({
        label: previewFieldLabel(field.label),
        value: field.value || '-',
        secret: isSecretCustomField(field.label) || isSecretVaultFieldLabel(field.label)
      }))
    }
    default:
      return []
  }
}

const INTL_LOCALE_MAP = {
  'zh-CN': 'zh-CN',
  en: 'en-US',
  ja: 'ja-JP'
} as const

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleString(INTL_LOCALE_MAP[locale.value], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  if (isFavoritesMode.value) {
    loadEntries()
  } else {
    loadFavoriteIds().then(() => loadEntries())
  }
  window.addEventListener('keydown', onSearchHotkey)
})

watch(
  () => trayStore.quickSearchFocusToken,
  async () => {
    if (trayStore.quickSearchFocusToken === 0) return
    await nextTick()
    searchInputRef.value?.focus()
  }
)

onUnmounted(() => {
  window.removeEventListener('keydown', onSearchHotkey)
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<style scoped lang="scss">
.vault-view {
  $vault-edge: 20px;

  margin: (-$spacing-xl);
  width: calc(100% + #{$spacing-xl * 2});
  height: calc(100vh - #{$titlebar-height});
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: $color-bg-primary;

  &__topbar {
    @include flex-between;
    gap: $spacing-md;
    padding: $vault-edge;
    border-bottom: 1px solid $color-border;
    flex-shrink: 0;
  }

  &__sort-btn {
    width: 40px;
    height: 40px;
    border-radius: $radius-md;
    @include flex-center;
    color: $color-text-secondary;
    background: $color-bg-secondary;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    transition: background $transition-fast, box-shadow $transition-fast, color $transition-fast;

    &:hover {
      background: $color-bg-elevated;
      color: $color-text-primary;
    }

    &:focus-visible {
      outline: none;
      background: $color-bg-elevated;
      box-shadow: 0 0 0 2px $color-accent-subtle;
    }
  }

  &__topbar-left {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    flex: 1;
    min-width: 0;

    :deep(.el-dropdown.is-open) .vault-view__sort-btn {
      background: $color-bg-elevated;
      box-shadow: 0 0 0 2px $color-accent-subtle;
    }
  }

  &__category {
    width: 160px;
    flex-shrink: 0;

    :deep(.el-select__wrapper) {
      border-radius: $radius-md;
      background: $color-bg-secondary;
      box-shadow: none;
      transition: background $transition-fast, box-shadow $transition-fast;

      &:hover {
        background: $color-bg-elevated;
      }

      &.is-focused {
        box-shadow: 0 0 0 2px $color-accent-subtle;
      }
    }

    :deep(.el-select__prefix) {
      margin-right: $spacing-xs;
    }
  }

  &__category-prefix-icon,
  &__category-option-icon {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    @include flex-center;
    flex-shrink: 0;
  }

  &__category-option {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__search {
    flex: 1;
    min-width: 240px;
    max-width: 560px;

    :deep(.el-input__wrapper) {
      border-radius: 999px;
      padding-left: 6px;
      background: $color-bg-secondary;
      box-shadow: none;
      transition: background $transition-fast, box-shadow $transition-fast;

      &:hover {
        background: $color-bg-elevated;
      }

      &.is-focus {
        background: $color-bg-elevated;
        box-shadow: 0 0 0 2px $color-accent-subtle;
      }
    }

    :deep(.el-input__prefix) {
      color: $color-text-muted;
    }

    :deep(.el-input__suffix) {
      color: $color-text-muted;
    }
  }

  &__split {
    flex: 1;
    display: flex;
    min-height: 0;
  }

  &__list-pane {
    width: 320px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid $color-border;
    background: $color-bg-secondary;
    min-height: 0;
  }

  &__list-scroll {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-sm 0;
  }

  &__list-empty {
    flex: 1;
    @include flex-center;
    flex-direction: column;
    gap: $spacing-md;
    color: $color-text-muted;
    padding: $spacing-xl;
    text-align: center;
  }

  &__list-empty-btn {
    color: $color-accent;
    font-size: $font-size-sm;

    &:hover {
      color: $color-accent-hover;
    }
  }

  &__group {
    & + & {
      margin-top: $spacing-md;
    }
  }

  &__group-title {
    padding: $spacing-xs $vault-edge;
    font-size: $font-size-xs;
    font-weight: 600;
    color: $color-text-muted;
    letter-spacing: 0.02em;
  }

  &__list-item {
    display: flex;
    align-items: center;
    gap: 2px;
    width: 100%;
    padding-right: $spacing-xs;
    transition: background $transition-fast;

    &:hover,
    &.is-active {
      background: $color-surface-hover;

      .vault-view__item-more {
        opacity: 1;
      }
    }

    &.is-active {
      background: $color-surface-hover;
    }
  }

  &__list-item-main {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex: 1;
    min-width: 0;
    padding: $spacing-sm $spacing-sm $spacing-sm $vault-edge;
    text-align: left;
    border: none;
    background: transparent;
    cursor: pointer;
  }

  &__item-more {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    margin-right: $spacing-xs;
    border: none;
    border-radius: $radius-sm;
    background: transparent;
    color: $color-text-muted;
    cursor: pointer;
    opacity: 0;
    @include flex-center;
    transition: opacity $transition-fast, background $transition-fast, color $transition-fast;

    &:hover {
      background: $color-bg-elevated;
      color: $color-text-primary;
    }

    &:focus-visible {
      outline: none;
      opacity: 1;
      box-shadow: 0 0 0 2px $color-accent-subtle;
    }
  }

  :deep(.vault-view__menu-item--danger) {
    color: $color-danger;
  }

  &__item-icon {
    width: 32px;
    height: 32px;
    border-radius: $radius-sm;
    @include flex-center;
    flex-shrink: 0;
  }

  &__item-text {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__item-title {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-text-primary;
    @include text-ellipsis;
  }

  &__item-subtitle {
    font-size: $font-size-xs;
    color: $color-text-muted;
    @include text-ellipsis;
  }

  &__item-favorite {
    flex-shrink: 0;
    color: #ffb020;
    display: flex;
    align-items: center;
  }

  &__list-footer {
    flex-shrink: 0;
    padding: $spacing-sm;
    border-top: 1px solid $color-border;
    display: flex;
    justify-content: center;
  }

  &__detail-pane {
    flex: 1;
    min-width: 360px;
    overflow-y: auto;
    padding: $vault-edge;
    background: $color-bg-primary;
  }

  &__detail-inner {
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__detail-empty {
    flex: 1;
    min-height: 100%;
    @include flex-center;
    color: $color-text-muted;
    font-size: $font-size-md;
  }

  &__detail-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
    padding-top: $spacing-sm;
  }

  &__detail-actions {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-left: auto;
    flex-shrink: 0;
  }

  &__action-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: $radius-sm;
    color: $color-text-secondary;
    background: transparent;
    border: none;
    cursor: pointer;
    @include flex-center;
    transition: color $transition-fast, background $transition-fast;

    .el-icon {
      font-size: 18px;
    }

    &:hover:not(:disabled) {
      color: $color-text-primary;
      background: $color-surface-hover;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--danger:hover:not(:disabled) {
      color: $color-danger;
      background: rgba(255, 77, 79, 0.08);
    }

    &--active {
      color: #ffb020;
    }
  }

  &__favorite-btn {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: $radius-sm;
    background: transparent;
    color: $color-text-muted;
    cursor: pointer;
    @include flex-center;
    transition: color $transition-fast, background $transition-fast;

    &:hover:not(:disabled) {
      color: #ffb020;
      background: rgba(255, 176, 32, 0.1);
    }

    &.is-active {
      color: #ffb020;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__panel-hero {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-md;
  }

  &__detail-icon {
    width: 48px;
    height: 48px;
    border-radius: $radius-md;
    @include flex-center;
    flex-shrink: 0;
  }

  &__detail-heading {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__detail-title {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $color-text-primary;
    letter-spacing: -0.02em;
    margin: 0;
    line-height: 1.25;
    word-break: break-word;
  }

  &__detail-type-pill {
    align-self: flex-start;
    font-size: $font-size-xs;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
  }

  &__field-panel,
  &__info-panel {
    width: 100%;
    box-sizing: border-box;
    background: $color-bg-secondary;
    border: 1px solid $color-border;
    border-radius: $radius-md;
    overflow: hidden;
  }

  &__info-panel {
    padding: $spacing-sm $spacing-md;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__panel-label {
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-weight: 600;
    margin: 0;
    letter-spacing: 0.02em;
  }

  &__field-row {
    position: relative;
  }

  &__field-divider {
    height: 1px;
    background: $color-border;
    margin: 0 $spacing-md;
  }

  &__field-body {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    min-height: 44px;
    padding: $spacing-xs $spacing-md;
    transition: background $transition-fast;

    &:hover {
      background: $color-surface-hover;
    }
  }

  &__field-label {
    width: 72px;
    flex-shrink: 0;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    font-weight: 500;
    line-height: 1.35;
    text-align: left;
  }

  &__field-value-wrap {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
  }

  &__field-value {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    padding: 0;
    text-align: left;
    font-size: $font-size-md;
    color: $color-text-primary;
    line-height: 1.45;
    word-break: break-word;
    cursor: pointer;

    &--secret {
      font-family: $font-family-mono;
      letter-spacing: 0.04em;

      &.is-masked {
        -webkit-text-security: disc;
        text-security: disc;
        letter-spacing: 0.08em;
      }
    }

    &--links {
      a {
        color: $color-accent;
        text-decoration: none;

        &:hover {
          color: $color-accent-hover;
          text-decoration: underline;
        }
      }
    }
  }

  &__field-action {
    flex-shrink: 0;
    font-size: $font-size-xs;
    color: $color-accent;
    padding: 2px 6px;
    border-radius: $radius-sm;
    border: none;
    background: transparent;

    &:hover {
      color: $color-accent-hover;
      background: $color-accent-subtle;
    }
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }

  &__tag {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    background: $color-bg-elevated;
    border: 1px solid $color-border;
    border-radius: 999px;
    padding: 3px 10px;
  }

  &__remark {
    margin: 0;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    line-height: 1.65;
    white-space: pre-wrap;
  }

  &__detail-meta {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }
}
</style>

<style lang="scss">
.vault-sort-dropdown.el-popper {
  .vault-sort-menu {
    min-width: 240px;
    padding: $spacing-xs 0;
  }

  .vault-sort-menu__header {
    padding: $spacing-xs $spacing-md $spacing-sm;
    font-size: $font-size-xs;
    color: $color-text-muted;
    line-height: 1.4;
  }

  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
    font-size: $font-size-sm;
    color: $color-text-primary;

    &.is-active {
      color: $color-accent;
    }
  }

  .vault-sort-menu__check {
    flex-shrink: 0;
    color: $color-accent;
  }
}
</style>

<style lang="scss">
.vault-sort-dropdown.el-popper {
  .vault-sort-menu {
    min-width: 240px;
    padding: $spacing-xs 0;
  }

  .vault-sort-menu__header {
    padding: $spacing-xs $spacing-md $spacing-sm;
    font-size: $font-size-xs;
    color: $color-text-muted;
    line-height: 1.4;
  }

  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
    font-size: $font-size-sm;
    color: $color-text-primary;

    &.is-active {
      color: $color-accent;
    }
  }

  .vault-sort-menu__check {
    flex-shrink: 0;
    color: $color-accent;
  }
}
</style>
