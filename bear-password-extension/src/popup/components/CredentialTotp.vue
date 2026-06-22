<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from '@/popup/composables/useI18n'
import type { AuthenticatorContent } from '@/shared/types'
import { copyTextToClipboardSync } from '@/shared/utils/copyText'
import { generateTotpSnapshot } from '@/shared/utils/totp'

const props = defineProps<{
  content: AuthenticatorContent
}>()

const emit = defineEmits<{
  copied: []
}>()

const { t } = useI18n()
const nowMs = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

const snapshot = computed(() => generateTotpSnapshot(props.content, nowMs.value))

const displayCode = computed(() => snapshot.value?.code ?? '------')

const countdownLabel = computed(() => {
  if (!snapshot.value) return '--'
  return String(snapshot.value.remainingSeconds).padStart(2, '0')
})

const ringOffset = computed(() => {
  if (!snapshot.value) return 97.4
  const progress = snapshot.value.remainingSeconds / snapshot.value.period
  return 97.4 * (1 - progress)
})

onMounted(() => {
  timer = setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function handleCopy(): void {
  const code = snapshot.value?.code
  if (!code) return
  if (copyTextToClipboardSync(code)) {
    emit('copied')
  }
}
</script>

<template>
  <div class="credential-totp">
    <button
      class="icon-btn credential-totp__trigger"
      type="button"
      :title="t('credential.totpCopy')"
      :aria-label="t('credential.totpCopy')"
      @click.stop="handleCopy"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    </button>

    <div class="credential-totp__popover" role="tooltip">
      <button
        type="button"
        class="credential-totp__detail"
        :title="t('credential.totpCopy')"
        @click.stop="handleCopy"
      >
        <span class="credential-totp__code">{{ displayCode }}</span>
        <span class="credential-totp__ring" aria-hidden="true">
          <svg viewBox="0 0 36 36">
            <g class="credential-totp__ring-rotate">
              <circle class="credential-totp__ring-track" cx="18" cy="18" r="15.5" />
              <circle
                class="credential-totp__ring-progress"
                cx="18"
                cy="18"
                r="15.5"
                :style="{ strokeDashoffset: ringOffset }"
              />
            </g>
            <text class="credential-totp__countdown" x="18" y="18" text-anchor="middle" dominant-baseline="central">
              {{ countdownLabel }}
            </text>
          </svg>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.credential-totp {
  position: relative;
  flex-shrink: 0;
}

.credential-totp__trigger {
  color: var(--bear-primary-light);
}

.credential-totp__trigger:hover,
.credential-totp:hover .credential-totp__trigger {
  color: var(--bear-primary);
  background: var(--bear-accent-subtle);
  border-color: rgba(90, 115, 72, 0.18);
}

.credential-totp__popover {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 10px 14px;
  min-width: auto;
  border: 1px solid var(--bear-border);
  border-radius: var(--bear-radius-md);
  background: var(--bear-surface);
  box-shadow: var(--bear-shadow-md);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(-4px);
  transition:
    opacity 0.15s ease,
    visibility 0.15s ease,
    transform 0.15s ease;
  z-index: 20;
}

.credential-totp__popover::after {
  content: '';
  position: absolute;
  right: 9px;
  top: -5px;
  width: 10px;
  height: 10px;
  background: var(--bear-surface);
  border-left: 1px solid var(--bear-border);
  border-top: 1px solid var(--bear-border);
  transform: rotate(45deg);
}

.credential-totp:hover .credential-totp__popover,
.credential-totp:focus-within .credential-totp__popover {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
}

.credential-totp__detail {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 2px 0;
  border: none;
  border-radius: var(--bear-radius-sm);
  background: transparent;
  cursor: pointer;
  transition: background 0.12s ease;
}

.credential-totp__detail:hover {
  background: var(--bear-surface-hover);
}

.credential-totp__code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--bear-text);
}

.credential-totp__ring {
  display: block;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.credential-totp__ring svg {
  display: block;
  width: 100%;
  height: 100%;
}

.credential-totp__ring-rotate {
  transform-origin: 18px 18px;
  transform: rotate(-90deg);
}

.credential-totp__ring-track {
  fill: none;
  stroke: var(--bear-border);
  stroke-width: 3;
}

.credential-totp__ring-progress {
  fill: none;
  stroke: #e63946;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: 97.4;
  transition: stroke-dashoffset 0.35s linear;
}

.credential-totp__countdown {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 9px;
  font-weight: 700;
  fill: var(--bear-text-muted);
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid transparent;
  border-radius: var(--bear-radius-sm);
  background: transparent;
  color: var(--bear-text-muted);
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
}
</style>
