<template>
  <!-- Dashboard 首页：展示密码库统计数据 -->
  <div class="dashboard-view">
    <header class="dashboard-view__header">
      <h1 class="dashboard-view__title">{{ t('dashboard.welcome') }}</h1>
      <p class="dashboard-view__desc">{{ t('dashboard.tagline') }}</p>
    </header>

    <div
      v-if="versionStore.hasUpdate"
      class="dashboard-view__update-banner"
    >
      <div class="dashboard-view__update-text">
        <h3>{{ t('dashboard.updateTitle') }}</h3>
        <p>{{ t('dashboard.updateBody', { version: versionStore.latestVersion }) }}</p>
      </div>
      <button type="button" class="dashboard-view__action" @click="versionStore.openDownload">
        {{ t('dashboard.updateDownload') }}
      </button>
    </div>

    <div class="dashboard-view__stats">
      <StatCard
        :label="t('dashboard.totalPasswords')"
        :value="stats.totalPasswords"
        :loading="loading"
        icon-bg="rgba(108, 92, 231, 0.15)"
        :icon="icons.total"
        clickable
        @click="goVault"
      />
      <StatCard
        :label="t('dashboard.favorites')"
        :value="stats.favoriteCount"
        :loading="loading"
        icon-bg="rgba(255, 176, 32, 0.15)"
        :icon="icons.favorite"
        clickable
        @click="goFavorites"
      />
      <StatCard
        :label="t('dashboard.recent')"
        :value="stats.recentCount"
        :loading="loading"
        icon-bg="rgba(0, 196, 140, 0.15)"
        :icon="icons.recent"
        clickable
        @click="goRecent"
      />
    </div>

    <div class="dashboard-view__tips">
      <div class="dashboard-view__tip-card">
        <h3>{{ t('dashboard.tipSecurityTitle') }}</h3>
        <p>{{ t('dashboard.tipSecurityBody') }}</p>
      </div>
      <div class="dashboard-view__tip-card">
        <h3>{{ t('dashboard.tipQuickTitle') }}</h3>
        <p class="dashboard-view__tip-desc">{{ t('dashboard.tipQuickBody') }}</p>
        <div class="dashboard-view__actions">
          <button type="button" class="dashboard-view__action" @click="handleAddPassword">
            {{ t('dashboard.actionAddPassword') }}
          </button>
          <button type="button" class="dashboard-view__action" @click="handleImportPassword">
            {{ t('dashboard.actionImportPassword') }}
          </button>
          <button type="button" class="dashboard-view__action" @click="handleLockApp">
            {{ t('dashboard.actionLockApp') }}
          </button>
        </div>
      </div>

      <div
        v-if="!securityStore.hasSecurityKey"
        class="dashboard-view__tip-card dashboard-view__tip-card--wide"
      >
        <div class="dashboard-view__tip-card-head">
          <h3>{{ t('dashboard.securityKeyAlertTitle') }}</h3>
        </div>
        <p class="dashboard-view__tip-lead">{{ t('dashboard.securityKeyAlertWarning') }}</p>
        <h4 class="dashboard-view__tip-subtitle">{{ t('dashboard.securityKeyExplainTitle') }}</h4>
        <p>{{ t('dashboard.securityKeyExplainBody') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StatCard from '@/components/dashboard/StatCard.vue'
import { getDashboardStatsApi } from '@/api'
import type { DashboardStats } from '@/types'
import { useI18n } from '@/composables/useI18n'
import { useAutoLockStore } from '@/stores/autoLock'
import { useSecurityStore } from '@/stores/security'
import { useVersionStore } from '@/stores/version'
import { openVaultCreate, openVaultImport } from '@/utils/vaultQuickSearch'

const router = useRouter()
const autoLockStore = useAutoLockStore()
const securityStore = useSecurityStore()
const versionStore = useVersionStore()
const { t } = useI18n()
const loading = ref(true)

const stats = reactive<DashboardStats>({
  totalPasswords: 0,
  favoriteCount: 0,
  recentCount: 0
})

const icons = {
  total: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M8 6V5C8 3.5 9.5 2 12 2C14.5 2 16 3.5 16 5V6" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="13" r="2" fill="currentColor"/></svg>`,
  favorite: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3L15 9.5L22 10.5L17 15.5L18.5 22.5L12 19L5.5 22.5L7 15.5L2 10.5L9 9.5L12 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  recent: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M12 7V12L15.5 14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
}

function goVault(): void {
  void router.push({ name: 'Vault' })
}

function goFavorites(): void {
  void router.push({ name: 'Favorites' })
}

function goRecent(): void {
  void router.push({ name: 'Recent' })
}

function handleAddPassword(): void {
  void openVaultCreate()
}

function handleImportPassword(): void {
  void openVaultImport()
}

function handleLockApp(): void {
  if (securityStore.isMigrating || autoLockStore.isLocked) return
  autoLockStore.lock()
}

async function loadStats(): Promise<void> {
  loading.value = true
  try {
    const data = await getDashboardStatsApi()
    Object.assign(stats, data)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadStats()
})
</script>

<style scoped lang="scss">
.dashboard-view {
  &__header {
    margin-bottom: $spacing-xl;
  }

  &__title {
    font-size: $font-size-2xl;
    font-weight: 700;
    color: $color-text-primary;
    margin-bottom: $spacing-xs;
  }

  &__desc {
    color: $color-text-secondary;
    font-size: $font-size-md;
  }

  &__update-banner {
    @include card;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
    padding: $spacing-lg;
    margin-bottom: $spacing-xl;
    border-color: rgba(108, 92, 231, 0.25);
    background: rgba(108, 92, 231, 0.06);
  }

  &__update-text {
    min-width: 0;

    h3 {
      font-size: $font-size-lg;
      font-weight: 600;
      color: $color-text-primary;
      margin-bottom: $spacing-xs;
    }

    p {
      color: $color-text-secondary;
      font-size: $font-size-md;
      line-height: 1.6;
      margin: 0;
    }
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-lg;
    margin-bottom: $spacing-xl;
  }

  &__tips {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-lg;
  }

  &__tip-card {
    @include card;
    padding: $spacing-lg;

    h3 {
      font-size: $font-size-lg;
      font-weight: 600;
      color: $color-text-primary;
      margin-bottom: $spacing-sm;
    }

    p {
      color: $color-text-secondary;
      font-size: $font-size-md;
      line-height: 1.6;
    }

    &--wide {
      grid-column: 1 / -1;
    }
  }

  &__tip-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
    margin-bottom: $spacing-sm;

    h3 {
      margin-bottom: 0;
    }
  }

  &__tip-lead {
    margin-bottom: $spacing-md;
  }

  &__tip-subtitle {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-text-primary;
    margin-bottom: $spacing-xs;
  }

  &__tip-card--wide {
    p:last-of-type {
      font-size: $font-size-sm;
      line-height: 1.55;
    }
  }

  &__tip-desc {
    margin-bottom: $spacing-md;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }

  &__action {
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-md;
    border: 1px solid $color-border;
    background: $color-bg-secondary;
    color: $color-accent;
    font-size: $font-size-sm;
    font-weight: 500;
    cursor: pointer;
    transition: background $transition-fast, border-color $transition-fast, color $transition-fast;

    &:hover {
      background: rgba(108, 92, 231, 0.08);
      border-color: rgba(108, 92, 231, 0.25);
    }

    &:focus-visible {
      outline: 2px solid $color-accent;
      outline-offset: 2px;
    }
  }
}
</style>
