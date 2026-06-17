<template>
  <div class="vault-view-placeholder" aria-busy="true">
    <header class="vault-view-placeholder__topbar">
      <div class="vault-view-placeholder__topbar-left">
        <SkeletonBlock variant="rect" width="36px" height="36px" radius="10px" />
        <SkeletonBlock width="160px" height="40px" radius="12px" />
        <SkeletonBlock class="vault-view-placeholder__search" width="100%" height="40px" radius="999px" />
      </div>
      <SkeletonBlock width="108px" height="40px" radius="12px" />
    </header>

    <div class="vault-view-placeholder__split">
      <aside class="vault-view-placeholder__list-pane">
        <VaultListSkeleton />
      </aside>
      <main class="vault-view-placeholder__detail-pane">
        <VaultDetailSkeleton />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'
import VaultListSkeleton from '@/components/vault/VaultListSkeleton.vue'
import VaultDetailSkeleton from '@/components/vault/VaultDetailSkeleton.vue'
</script>

<style scoped lang="scss">
.vault-view-placeholder {
  $vault-edge: 20px;

  width: 100%;
  height: 100%;
  min-height: calc(100vh - #{$titlebar-height});
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
    min-height: calc(40px + #{$vault-edge} * 2);
  }

  &__topbar-left {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    flex: 1;
    min-width: 0;
  }

  &__search {
    flex: 1;
    min-width: 240px;
    max-width: 560px;
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

  &__detail-pane {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: $color-bg-primary;
  }
}
</style>
