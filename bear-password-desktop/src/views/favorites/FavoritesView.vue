<template>
  <!-- 收藏夹页面（占位，后续实现） -->
  <div class="placeholder-view">
    <div class="placeholder-view__icon">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <path d="M24 6L29.5 17.5L42 19L33 28L35.5 40.5L24 34.5L12.5 40.5L15 28L6 19L18.5 17.5L24 6Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      </svg>
    </div>
    <h2>收藏夹</h2>
    <p>收藏的密码条目将显示在这里</p>
  </div>
</template>

<style scoped lang="scss">
.placeholder-view {
  @include flex-center;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
  color: $color-text-secondary;

  &__icon {
    color: $color-warning;
    margin-bottom: $spacing-lg;
    opacity: 0.6;
  }

  h2 {
    font-size: $font-size-xl;
    color: $color-text-primary;
    margin-bottom: $spacing-sm;
  }

  p {
    font-size: $font-size-md;
  }
}
</style>
