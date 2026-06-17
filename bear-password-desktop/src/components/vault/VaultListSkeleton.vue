<template>
  <div class="vault-list-skeleton" aria-hidden="true">
    <div v-for="index in count" :key="index" class="vault-list-skeleton__item">
      <SkeletonBlock variant="rect" width="32px" height="32px" radius="8px" />
      <div class="vault-list-skeleton__text">
        <SkeletonBlock width="72%" height="14px" />
        <SkeletonBlock width="48%" height="12px" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'

withDefaults(
  defineProps<{
    count?: number
  }>(),
  {
    count: 8
  }
)
</script>

<style scoped lang="scss">
.vault-list-skeleton {
  flex: 1;
  overflow: hidden;
  padding: $spacing-sm 0;

  &__item {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md $spacing-sm 20px;
  }

  &__text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
}
</style>
