<template>
  <div class="vault-detail-skeleton" aria-hidden="true">
    <div class="vault-detail-skeleton__hero">
      <SkeletonBlock variant="rect" width="56px" height="56px" radius="14px" />
      <div class="vault-detail-skeleton__heading">
        <SkeletonBlock width="55%" height="22px" />
        <SkeletonBlock width="80px" height="24px" radius="999px" />
      </div>
    </div>

    <div class="vault-detail-skeleton__divider" />

    <div v-for="index in 4" :key="index" class="vault-detail-skeleton__field">
      <SkeletonBlock width="64px" height="12px" />
      <SkeletonBlock width="100%" height="18px" />
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'
</script>

<style scoped lang="scss">
.vault-detail-skeleton {
  flex: 1;
  min-height: 0;
  padding: $spacing-xl;
  overflow: hidden;

  &__hero {
    display: flex;
    align-items: center;
    gap: $spacing-lg;
    margin-bottom: $spacing-lg;
  }

  &__heading {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__divider {
    height: 1px;
    background: $color-border;
    margin-bottom: $spacing-lg;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    padding: $spacing-md 0;

    & + & {
      border-top: 1px solid $color-border;
    }
  }
}
</style>
