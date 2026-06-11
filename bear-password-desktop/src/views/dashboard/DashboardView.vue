<template>
  <!-- Dashboard 首页：展示密码库统计数据 -->
  <div class="dashboard-view">
    <header class="dashboard-view__header">
      <h1 class="dashboard-view__title">{{ t('dashboard.welcome') }}</h1>
      <p class="dashboard-view__desc">{{ t('dashboard.tagline') }}</p>
    </header>

    <div class="dashboard-view__stats">
      <StatCard
        :label="t('dashboard.totalPasswords')"
        :value="stats.totalPasswords"
        :loading="loading"
        icon-bg="rgba(108, 92, 231, 0.15)"
        :icon="icons.total"
      />
      <StatCard
        :label="t('dashboard.favorites')"
        :value="stats.favoriteCount"
        :loading="loading"
        icon-bg="rgba(255, 176, 32, 0.15)"
        :icon="icons.favorite"
      />
      <StatCard
        :label="t('dashboard.recent')"
        :value="stats.recentCount"
        :loading="loading"
        icon-bg="rgba(0, 196, 140, 0.15)"
        :icon="icons.recent"
      />
    </div>

    <div class="dashboard-view__tips">
      <div class="dashboard-view__tip-card">
        <h3>{{ t('dashboard.tipSecurityTitle') }}</h3>
        <p>{{ t('dashboard.tipSecurityBody') }}</p>
      </div>
      <div class="dashboard-view__tip-card">
        <h3>{{ t('dashboard.tipQuickTitle') }}</h3>
        <p>{{ t('dashboard.tipQuickBody') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import { getDashboardStatsApi } from '@/api'
import type { DashboardStats } from '@/types'
import { useI18n } from '@/composables/useI18n'

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
  }
}
</style>
