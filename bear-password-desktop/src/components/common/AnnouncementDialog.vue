<template>
  <Teleport to="body">
    <Transition name="announcement-fade">
      <div
        v-if="visible && announcement"
        class="announcement-overlay"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <div class="announcement-dialog">
          <header class="announcement-dialog__header">
            <h2 :id="titleId" class="announcement-dialog__title">
              {{ dialogTitle }}
            </h2>
          </header>

          <div
            class="announcement-dialog__body markdown-body"
            v-html="renderedContent"
          />

          <footer class="announcement-dialog__footer">
            <el-button type="primary" size="large" :loading="confirming" @click="handleConfirm">
              {{ t('announcement.gotIt') }}
            </el-button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { confirmAnnouncementApi, getPendingAnnouncementApi } from '@/api/announcement'
import { useI18n } from '@/composables/useI18n'
import { useAuthStore } from '@/stores/auth'
import { useAutoLockStore } from '@/stores/autoLock'
import { useSecurityStore } from '@/stores/security'
import type { Announcement } from '@/types/announcement'
import { renderAnnouncementMarkdown } from '@/utils/markdown'

const { t } = useI18n()
const authStore = useAuthStore()
const autoLockStore = useAutoLockStore()
const securityStore = useSecurityStore()

const visible = ref(false)
const confirming = ref(false)
const announcement = ref<Announcement | null>(null)
const titleId = 'announcement-dialog-title'
let checking = false

const dialogTitle = computed(() => announcement.value?.title?.trim() || t('announcement.defaultTitle'))

const renderedContent = computed(() => {
  if (!announcement.value?.content) return ''
  return renderAnnouncementMarkdown(announcement.value.content)
})

function canCheckAnnouncement(): boolean {
  return authStore.isLoggedIn && !autoLockStore.isLocked && !securityStore.isMigrating
}

async function checkPendingAnnouncement(): Promise<void> {
  if (!canCheckAnnouncement() || checking || visible.value) return

  checking = true
  try {
    const pending = await getPendingAnnouncementApi()
    if (!pending || !canCheckAnnouncement()) {
      return
    }
    announcement.value = pending
    visible.value = true
  } catch {
    // 网络或服务异常时不打断正常使用
  } finally {
    checking = false
  }
}

async function handleConfirm(): Promise<void> {
  if (!announcement.value || confirming.value) return

  confirming.value = true
  try {
    await confirmAnnouncementApi(announcement.value.id)
    visible.value = false
    announcement.value = null
  } catch {
    // 保留弹窗，用户可重试
  } finally {
    confirming.value = false
  }
}

watch(
  () => [authStore.isLoggedIn, autoLockStore.isLocked, securityStore.isMigrating] as const,
  ([loggedIn, locked, migrating]) => {
    if (!loggedIn || locked || migrating) {
      return
    }
    void checkPendingAnnouncement()
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.announcement-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(8, 8, 12, 0.45);
  backdrop-filter: blur(6px);
}

.announcement-dialog {
  width: min(560px, 100%);
  max-height: min(72vh, 640px);
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  background: $color-bg-elevated;
  border: 1px solid $color-border;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
  overflow: hidden;

  &__header {
    padding: 20px 24px 0;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: $color-text-primary;
  }

  &__body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 16px 24px;
    color: $color-text-secondary;
    line-height: 1.7;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    padding: 12px 24px 20px;
    border-top: 1px solid $color-border;
  }
}

.markdown-body {
  :deep(p) {
    margin: 0 0 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    margin: 16px 0 8px;
    color: $color-text-primary;
    line-height: 1.4;
  }

  :deep(h1) {
    font-size: 20px;
  }

  :deep(h2) {
    font-size: 18px;
  }

  :deep(h3) {
    font-size: 16px;
  }

  :deep(ul),
  :deep(ol) {
    margin: 0 0 12px;
    padding-left: 22px;
  }

  :deep(li + li) {
    margin-top: 4px;
  }

  :deep(code) {
    padding: 2px 6px;
    border-radius: 6px;
    background: rgba($color-text-primary, 0.08);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.92em;
  }

  :deep(pre) {
    margin: 0 0 12px;
    padding: 12px 14px;
    border-radius: 10px;
    background: rgba($color-text-primary, 0.06);
    overflow: auto;

    code {
      padding: 0;
      background: transparent;
    }
  }

  :deep(a) {
    color: $color-accent;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(blockquote) {
    margin: 0 0 12px;
    padding: 8px 12px;
    border-left: 3px solid $color-accent;
    background: rgba($color-accent, 0.08);
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid $color-border;
    margin: 16px 0;
  }
}

.announcement-fade-enter-active,
.announcement-fade-leave-active {
  transition: opacity 0.2s ease;
}

.announcement-fade-enter-from,
.announcement-fade-leave-to {
  opacity: 0;
}
</style>
