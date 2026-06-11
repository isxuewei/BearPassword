<template>
  <!-- 仪表盘统计卡片 -->
  <div class="stat-card">
    <div class="stat-card__icon" :style="{ background: iconBg }">
      <span v-html="icon" />
    </div>
    <div class="stat-card__content">
      <p class="stat-card__label">{{ label }}</p>
      <p class="stat-card__value">
        <span v-if="loading" class="stat-card__skeleton" />
        <span v-else>{{ formattedValue }}</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    value: number
    icon: string
    iconBg?: string
    loading?: boolean
  }>(),
  {
    iconBg: 'rgba(108, 92, 231, 0.15)',
    loading: false
  }
)

const formattedValue = computed(() => props.value.toLocaleString())
</script>

<style scoped lang="scss">
.stat-card {
  @include card;
  padding: $spacing-lg;
  display: flex;
  align-items: center;
  gap: $spacing-lg;

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: $radius-md;
    @include flex-center;
    flex-shrink: 0;
    color: $color-accent;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin-bottom: $spacing-xs;
  }

  &__value {
    font-size: $font-size-2xl;
    font-weight: 700;
    color: $color-text-primary;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  &__skeleton {
    display: inline-block;
    width: 60px;
    height: 28px;
    border-radius: $radius-sm;
    background: linear-gradient(90deg, $color-skeleton-base 25%, $color-skeleton-shine 50%, $color-skeleton-base 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
