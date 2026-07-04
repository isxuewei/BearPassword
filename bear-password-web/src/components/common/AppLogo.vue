<template>
  <!-- BearPassword Logo 组件，支持不同尺寸 -->
  <div class="app-logo" :class="[`app-logo--${size}`]">
    <div class="app-logo__icon">
      <img :src="logoUrl" alt="" class="app-logo__image" />
    </div>
    <span v-if="showText" class="app-logo__text">BearPassword</span>
  </div>
</template>

<script setup lang="ts">
import logoUrl from '@/assets/logo.svg'

/**
 * AppLogo - 品牌 Logo 组件
 * @prop size - 尺寸：sm | md | lg
 * @prop showText - 是否显示文字
 */
withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
    showText?: boolean
  }>(),
  {
    size: 'md',
    showText: true
  }
)
</script>

<style scoped lang="scss">
.app-logo {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  &__icon {
    flex-shrink: 0;
  }

  &__image {
    display: block;
    object-fit: contain;
  }

  &__text {
    font-weight: 600;
    color: $color-text-primary;
    letter-spacing: -0.02em;
  }

  &--sm {
    .app-logo__image {
      width: 28px;
      height: 28px;
    }
    .app-logo__text {
      font-size: $font-size-sm;
    }
  }

  &--md {
    .app-logo__image {
      width: 36px;
      height: 36px;
    }
    .app-logo__text {
      font-size: $font-size-lg;
    }
  }

  &--lg {
    .app-logo__image {
      width: 48px;
      height: 48px;
    }
    .app-logo__text {
      font-size: $font-size-xl;
    }
  }
}
</style>
