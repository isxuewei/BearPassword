<script setup lang="ts">
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

<template>
  <div class="app-logo" :class="`app-logo--${size}`">
    <img src="/icons/logo.svg" alt="" class="app-logo__image" />
    <span v-if="showText" class="app-logo__text">BearPassword</span>
  </div>
</template>

<style scoped>
.app-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-logo__image {
  display: block;
  object-fit: contain;
  flex-shrink: 0;
}

.app-logo__text {
  font-weight: 600;
  color: var(--bear-text);
  letter-spacing: -0.02em;
}

.app-logo--sm .app-logo__image {
  width: 28px;
  height: 28px;
}

.app-logo--sm .app-logo__text {
  font-size: 14px;
}

.app-logo--md .app-logo__image {
  width: 36px;
  height: 36px;
}

.app-logo--md .app-logo__text {
  font-size: 17px;
}

.app-logo--lg .app-logo__image {
  width: 48px;
  height: 48px;
}

.app-logo--lg .app-logo__text {
  font-size: 20px;
}
</style>
