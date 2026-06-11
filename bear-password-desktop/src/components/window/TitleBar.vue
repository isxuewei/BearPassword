<template>
  <!-- 自定义窗口标题栏：macOS 保留左侧交通灯区域，Windows 显示自定义按钮 -->
  <div class="title-bar" :class="{ 'title-bar--mac': isMac }">
    <!-- Windows / Linux 窗口控制按钮 -->
    <div v-if="!isMac" class="title-bar__controls">
      <button class="title-bar__btn title-bar__btn--minimize" @click="handleMinimize" title="最小化">
        <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor" /></svg>
      </button>
      <button class="title-bar__btn title-bar__btn--maximize" @click="handleMaximize" title="最大化">
        <svg width="10" height="10" viewBox="0 0 10 10">
          <rect x="0.5" y="0.5" width="9" height="9" rx="1" stroke="currentColor" fill="none" />
        </svg>
      </button>
      <button class="title-bar__btn title-bar__btn--close" @click="handleClose" title="关闭">
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.2" />
        </svg>
      </button>
    </div>

    <!-- 可拖拽区域 -->
    <div class="title-bar__drag">
      <span v-if="title" class="title-bar__title">{{ title }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

defineProps<{
  title?: string
}>()

const isMac = ref(false)

onMounted(async () => {
  if (window.windowApi) {
    const platform = await window.windowApi.getPlatform()
    isMac.value = platform === 'darwin'
  }
})

function handleMinimize(): void {
  window.windowApi?.minimize()
}

function handleMaximize(): void {
  window.windowApi?.maximize()
}

function handleClose(): void {
  window.windowApi?.close()
}
</script>

<style scoped lang="scss">
.title-bar {
  height: $titlebar-height;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  background: transparent;
  position: relative;
  z-index: 100;

  &--mac {
    // macOS 左侧为系统交通灯预留空间
    padding-left: 80px;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    @include no-drag;
  }

  &__btn {
    width: 36px;
    height: 28px;
    @include flex-center;
    border-radius: $radius-sm;
    color: $color-text-secondary;
    transition: background $transition-fast, color $transition-fast;

    &:hover {
      background: $color-titlebar-hover;
      color: $color-text-primary;
    }

    &--close:hover {
      background: $color-danger;
      color: white;
    }
  }

  &__drag {
    flex: 1;
    height: 100%;
    @include flex-center;
    @include drag-region;
  }

  &__title {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    @include no-drag;
  }
}
</style>
