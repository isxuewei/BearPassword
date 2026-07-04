<template>
  <div
    class="totp-display"
    :class="{
      'totp-display--large': size === 'large',
      'totp-display--compact': size === 'compact'
    }"
  >
    <div class="totp-display__code-wrap">
      <button
        type="button"
        class="totp-display__code"
        :disabled="!snapshot"
        :aria-label="t('entry.totp.copyCode')"
        @click="handleCopy"
      >
        {{ displayCode }}
      </button>
      <div class="totp-display__ring-wrap" aria-hidden="true">
        <svg class="totp-display__ring" viewBox="0 0 36 36">
          <g class="totp-display__ring-rotate">
            <circle class="totp-display__ring-track" cx="18" cy="18" r="15.5" />
            <circle
              class="totp-display__ring-progress"
              cx="18"
              cy="18"
              r="15.5"
              :style="{ strokeDashoffset: ringOffset }"
            />
          </g>
          <text class="totp-display__countdown" x="18" y="18" text-anchor="middle" dominant-baseline="central">
            {{ countdownLabel }}
          </text>
        </svg>
      </div>
    </div>
    <p v-if="invalid" class="totp-display__hint totp-display__hint--error">
      {{ t('entry.totp.invalidSecret') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from '@/composables/useI18n'
import type { AuthenticatorContent } from '@/types'
import { generateTotpSnapshot, isValidAuthenticatorSecret } from '@/utils/totp'
import { copySensitiveText } from '@/utils/sensitiveClipboard'

const props = withDefaults(
  defineProps<{
    content: AuthenticatorContent
    size?: 'normal' | 'large' | 'compact'
  }>(),
  {
    size: 'normal'
  }
)

const { t } = useI18n()
const nowMs = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

const invalid = computed(() => {
  const secret = props.content.secret.trim()
  return Boolean(secret) && !isValidAuthenticatorSecret(secret)
})

const snapshot = computed(() => generateTotpSnapshot(props.content, nowMs.value))

const displayCode = computed(() => {
  if (!props.content.secret.trim()) return '------'
  if (invalid.value) return '------'
  return snapshot.value?.code ?? '------'
})

const countdownLabel = computed(() => {
  if (!snapshot.value) return '--'
  return String(snapshot.value.remainingSeconds).padStart(2, '0')
})

const ringOffset = computed(() => {
  if (!snapshot.value) return 97.4
  const progress = snapshot.value.remainingSeconds / snapshot.value.period
  return 97.4 * (1 - progress)
})

function tick(): void {
  nowMs.value = Date.now()
}

watch(
  () => props.content.secret,
  () => {
    nowMs.value = Date.now()
  }
)

onMounted(() => {
  timer = setInterval(tick, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

async function handleCopy(): Promise<void> {
  const code = snapshot.value?.code
  if (!code) return
  const copied = await copySensitiveText(code)
  if (copied) {
    ElMessage.success(t('entry.totp.codeCopied'))
  } else {
    ElMessage.warning(t('entry.msg.copyFailed'))
  }
}
</script>

<style scoped lang="scss">
.totp-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;

  &--large {
    .totp-display__code {
      font-size: 2rem;
      letter-spacing: 0.35em;
    }

    .totp-display__ring-wrap {
      width: 52px;
      height: 52px;
    }

    .totp-display__countdown {
      font-size: 11px;
    }
  }

  &--compact {
    align-items: flex-start;

    .totp-display__code-wrap {
      gap: $spacing-md;
    }

    .totp-display__code {
      font-size: $font-size-md;
      font-weight: 600;
      letter-spacing: 0.12em;
      padding: 0;
    }

    .totp-display__ring-wrap {
      width: 32px;
      height: 32px;
    }

    .totp-display__countdown {
      font-size: 8px;
      fill: $color-text-primary;
    }
  }

  &__code-wrap {
    position: relative;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__code {
    border: none;
    background: transparent;
    font-family: $font-family-mono, ui-monospace, monospace;
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: 0.28em;
    color: $color-text-primary;
    cursor: pointer;
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-sm;
    transition: background 0.15s ease;

    &:hover:not(:disabled) {
      background: $color-surface-hover;
    }

    &:disabled {
      cursor: default;
      color: $color-text-muted;
    }
  }

  &__ring-wrap {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
  }

  &__ring {
    display: block;
    width: 100%;
    height: 100%;
  }

  &__ring-rotate {
    transform-origin: 18px 18px;
    transform: rotate(-90deg);
  }

  &__ring-track {
    fill: none;
    stroke: $color-border;
    stroke-width: 3;
  }

  &__ring-progress {
    fill: none;
    stroke: #e63946;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 97.4;
    transition: stroke-dashoffset 0.35s linear;
  }

  &__countdown {
    font-family: $font-family-mono;
    font-size: 9px;
    font-weight: 700;
    fill: $color-text-secondary;
  }

  &__hint {
    margin: 0;
    font-size: $font-size-xs;
    color: $color-text-secondary;

    &--error {
      color: $color-danger;
    }
  }
}
</style>
