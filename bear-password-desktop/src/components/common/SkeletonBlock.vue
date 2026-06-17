<template>
  <span class="skeleton-block" :class="`skeleton-block--${variant}`" :style="blockStyle" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    width?: string
    height?: string
    radius?: string
    variant?: 'text' | 'circle' | 'rect'
  }>(),
  {
    width: '100%',
    height: '1em',
    variant: 'text'
  }
)

const blockStyle = computed(() => ({
  width: props.width,
  height: props.height,
  borderRadius:
    props.radius ?? (props.variant === 'circle' ? '50%' : props.variant === 'rect' ? '8px' : '6px')
}))
</script>

<style scoped lang="scss">
.skeleton-block {
  display: block;
  flex-shrink: 0;
  @include skeleton-shimmer;
}
</style>
