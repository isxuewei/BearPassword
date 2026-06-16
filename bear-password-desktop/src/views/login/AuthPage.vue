<template>
  <div class="auth-layout">
    <TitleBar />

    <div class="auth-layout__container">
      <div class="auth-layout__glow auth-layout__glow--1" />
      <div class="auth-layout__glow auth-layout__glow--2" />

      <div
        class="auth-layout__card"
        :class="{ 'auth-layout__card--kit': registerKitStep && !isLogin }"
      >
        <button
          type="button"
          class="auth-layout__settings-btn"
          :aria-label="t('settings.serverDialogTitle')"
          :title="t('settings.serverDialogTitle')"
          @click="showServerSettings = true"
        >
          <el-icon :size="18"><Setting /></el-icon>
        </button>

        <transition name="auth-form" mode="out-in">
          <LoginForm v-if="isLogin" key="login" />
          <RegisterForm v-else key="register" @kit-step-change="registerKitStep = $event" />
        </transition>
      </div>
    </div>

    <ServerSettingsDialog v-model="showServerSettings" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Setting } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'
import TitleBar from '@/components/window/TitleBar.vue'
import ServerSettingsDialog from '@/components/common/ServerSettingsDialog.vue'
import LoginForm from '@/views/login/LoginForm.vue'
import RegisterForm from '@/views/login/RegisterForm.vue'

const { t } = useI18n()
const route = useRoute()
const showServerSettings = ref(false)
const registerKitStep = ref(false)

const isLogin = computed(() => route.name === 'Login')
</script>

<style scoped lang="scss">
.auth-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: $color-bg-primary;
  position: relative;
  overflow: hidden;

  &__container {
    flex: 1;
    @include flex-center;
    position: relative;
  }

  &__glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;

    &--1 {
      width: 400px;
      height: 400px;
      background: rgba(108, 92, 231, 0.2);
      top: 20%;
      left: 30%;
    }

    &--2 {
      width: 300px;
      height: 300px;
      background: rgba(162, 155, 254, 0.12);
      bottom: 20%;
      right: 25%;
    }
  }

  &__card {
    @include glass-panel;
    border-radius: $radius-xl;
    padding: $spacing-2xl;
    width: 420px;
    box-shadow: $shadow-lg;
    position: relative;
    z-index: 1;
    transition: width 0.2s ease;

    &--kit {
      width: 460px;
    }
  }

  &__settings-btn {
    position: absolute;
    top: $spacing-md;
    right: $spacing-md;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: $radius-md;
    background: transparent;
    color: $color-text-muted;
    cursor: pointer;
    @include flex-center;
    @include no-drag;
    transition: background $transition-fast, color $transition-fast;
    z-index: 2;

    &:hover {
      background: $color-surface-hover;
      color: $color-accent;
    }

    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px $color-accent-subtle;
    }
  }
}

.auth-form-enter-active,
.auth-form-leave-active {
  transition: opacity 0.18s ease;
}

.auth-form-enter-from,
.auth-form-leave-to {
  opacity: 0;
}
</style>

<style lang="scss">
.auth-panel {
  &__header {
    text-align: center;
    margin-bottom: $spacing-xl;

    .app-logo {
      justify-content: center;
      margin-bottom: $spacing-md;
    }
  }

  &__subtitle {
    font-size: $font-size-md;
    color: $color-text-secondary;
  }

  &__form {
    :deep(.el-form-item) {
      margin-bottom: $spacing-md;
    }
  }

  &__submit {
    width: 100%;
    height: 44px;
    border-radius: $radius-md !important;
    font-size: $font-size-md;
    font-weight: 600;
    background: $color-accent !important;
    border: none !important;
    margin-top: $spacing-sm;
    transition: all $transition-fast;

    &:hover {
      background: $color-accent-hover !important;
      box-shadow: $shadow-glow;
    }
  }

  &__error {
    min-height: 20px;
    text-align: center;
    color: $color-danger;
    font-size: $font-size-sm;
    margin-top: $spacing-md;
  }

  &__link {
    display: block;
    text-align: center;
    margin-top: $spacing-lg;
    font-size: $font-size-sm;
    color: $color-accent;
    text-decoration: none;

    &:hover {
      color: $color-accent-hover;
    }
  }
}
</style>
