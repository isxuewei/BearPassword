<template>
  <!-- 自定义窗口标题栏：macOS 保留左侧交通灯区域，Windows 控件在右上角 -->
  <div class="title-bar" :class="{ 'title-bar--mac': isMac, 'title-bar--win': !isMac }">
    <div class="title-bar__drag">
      <span v-if="title" class="title-bar__title">{{ title }}</span>
    </div>

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
  align-items: stretch;
  flex-shrink: 0;
  background: transparent;
  position: relative;
  z-index: 100;

  &--mac {
    // macOS 左侧为系统交通灯预留空间
    padding-left: 80px;

    .title-bar__drag {
      justify-content: center;
    }
  }

  &--win {
    .title-bar__drag {
      justify-content: flex-start;
      padding-left: $spacing-md;
    }
  }

  &__controls {
    display: flex;
    align-items: stretch;
    flex-shrink: 0;
    @include no-drag;
  }

  &__btn {
    width: 46px;
    height: 100%;
    @include flex-center;
    border-radius: 0;
    color: $color-text-secondary;
    transition: background $transition-fast, color $transition-fast;

    &:hover {
      background: $color-titlebar-hover;
      color: $color-text-primary;
    }

    &--close:hover {
      background: #e81123;
      color: white;
    }
  }

  &__drag {
    flex: 1;
    min-width: 0;
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
