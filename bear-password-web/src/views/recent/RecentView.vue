<template>
  <!-- 最近访问页面（占位，后续实现） -->
  <div class="placeholder-view">
    <div class="placeholder-view__icon">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="2"/>
        <path d="M24 14V24L32 29" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
    <h2>最近访问</h2>
    <p>最近访问的密码条目将显示在这里</p>
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
    color: $color-success;
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
