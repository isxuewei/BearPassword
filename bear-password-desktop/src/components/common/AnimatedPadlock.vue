<template>
  <div
    class="animated-padlock"
    :class="[
      `animated-padlock--${phase}`,
      { 'animated-padlock--shake': shaking }
    ]"
    aria-hidden="true"
  >
    <div class="animated-padlock__glow" />
    <div class="animated-padlock__burst">
      <span v-for="i in 8" :key="i" class="animated-padlock__spark" :style="{ '--i': i }" />
    </div>

    <svg class="animated-padlock__svg" viewBox="0 0 100 120" fill="none">
      <defs>
        <linearGradient id="padlock-body-gradient" x1="20" y1="50" x2="80" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="var(--padlock-body-top)" />
          <stop offset="100%" stop-color="var(--padlock-body-bottom)" />
        </linearGradient>
        <linearGradient id="padlock-shackle-gradient" x1="30" y1="10" x2="70" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="var(--padlock-shackle-top)" />
          <stop offset="100%" stop-color="var(--padlock-shackle-bottom)" />
        </linearGradient>
      </defs>

      <g class="animated-padlock__shackle-wrap">
        <path
          class="animated-padlock__shackle"
          d="M32 52V28C32 18.0589 40.0589 10 50 10C59.9411 10 68 18.0589 68 28V52"
          stroke="url(#padlock-shackle-gradient)"
          stroke-width="7"
          stroke-linecap="round"
        />
      </g>

      <rect
        class="animated-padlock__body"
        x="18"
        y="48"
        width="64"
        height="58"
        rx="10"
        fill="url(#padlock-body-gradient)"
      />
      <rect
        class="animated-padlock__body-shine"
        x="24"
        y="54"
        width="18"
        height="40"
        rx="6"
        fill="var(--padlock-shine)"
      />

      <g class="animated-padlock__keyhole">
        <circle cx="50" cy="72" r="5.5" fill="var(--padlock-keyhole)" />
        <path
          d="M50 77V88"
          stroke="var(--padlock-keyhole)"
          stroke-width="4"
          stroke-linecap="round"
        />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
export type PadlockPhase = 'open' | 'locking' | 'locked' | 'unlocking'

defineProps<{
  phase: PadlockPhase
  shaking?: boolean
}>()
</script>

<style scoped lang="scss">
.animated-padlock {
  --padlock-body-top: #8b95ff;
  --padlock-body-bottom: #5e60ce;
  --padlock-shackle-top: #c4c9ff;
  --padlock-shackle-bottom: #7b83eb;
  --padlock-shine: rgba(255, 255, 255, 0.18);
  --padlock-keyhole: rgba(18, 20, 35, 0.55);
  --padlock-glow: rgba(108, 92, 231, 0.45);

  position: relative;
  width: 112px;
  height: 132px;
  margin: 0 auto;

  &__glow {
    position: absolute;
    inset: 18% 8% 8%;
    border-radius: 50%;
    background: radial-gradient(circle, var(--padlock-glow) 0%, transparent 70%);
    opacity: 0;
    transform: scale(0.7);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }

  &__burst {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__spark {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 6px;
    height: 6px;
    margin: -3px 0 0 -3px;
    border-radius: 50%;
    background: $color-accent;
    opacity: 0;
    transform: rotate(calc(var(--i) * 45deg)) translateY(0);
  }

  &__svg {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    overflow: visible;
    filter: drop-shadow(0 10px 24px rgba(94, 96, 206, 0.35));
  }

  &__shackle-wrap {
    transform-origin: 32px 52px;
  }

  &__shackle {
    transform-origin: 32px 52px;
  }

  &__body {
    transform-origin: 50px 77px;
  }

  &__keyhole {
    transform-origin: 50px 77px;
  }

  /* 开锁态：锁梁弹起 */
  &--open &__shackle-wrap {
    transform: rotate(-34deg) translateY(-6px);
    transition: transform 0.75s cubic-bezier(0.22, 1.12, 0.36, 1);
  }

  &--open &__glow {
    opacity: 0.85;
    transform: scale(1.15);
  }

  &--open &__spark {
    animation: padlock-spark 0.75s ease-out forwards;
    animation-delay: calc(var(--i) * 0.03s);
  }

  /* 关锁动画 */
  &--locking &__shackle-wrap {
    animation: padlock-close-shackle 0.9s cubic-bezier(0.34, 1.25, 0.64, 1) forwards;
  }

  &--locking &__body {
    animation: padlock-close-body 0.9s cubic-bezier(0.34, 1.25, 0.64, 1) forwards;
  }

  &--locking &__keyhole {
    animation: padlock-keyhole-pop 0.9s ease forwards;
  }

  &--locking &__glow {
    animation: padlock-glow-in 0.9s ease forwards;
  }

  /* 已锁定 */
  &--locked &__shackle-wrap {
    transform: rotate(0deg) translateY(0);
  }

  &--locked &__glow {
    opacity: 0.55;
    transform: scale(1);
    animation: padlock-glow-pulse 2.4s ease-in-out infinite;
  }

  /* 解锁动画 */
  &--unlocking {
    animation: padlock-unlock-lift 1.4s cubic-bezier(0.22, 1.1, 0.36, 1) forwards;
  }

  &--unlocking &__shackle-wrap {
    animation: padlock-open-shackle 1.4s cubic-bezier(0.22, 1.15, 0.36, 1) forwards;
  }

  &--unlocking &__body {
    animation: padlock-open-body 1.4s ease forwards;
  }

  &--unlocking &__keyhole {
    animation: padlock-keyhole-unlock 1.4s ease forwards;
  }

  &--unlocking &__glow {
    animation: padlock-glow-burst 1.4s ease forwards;
  }

  &--unlocking &__spark {
    animation: padlock-spark 1.1s ease-out forwards;
    animation-delay: calc(0.28s + var(--i) * 0.04s);
  }

  &--shake {
    animation: padlock-shake 0.48s ease;
  }
}

@keyframes padlock-close-shackle {
  0% {
    transform: rotate(-38deg) translateY(-10px);
  }
  55% {
    transform: rotate(6deg) translateY(2px);
  }
  78% {
    transform: rotate(-2deg) translateY(-1px);
  }
  100% {
    transform: rotate(0deg) translateY(0);
  }
}

@keyframes padlock-close-body {
  0%,
  100% {
    transform: scale(1);
  }
  45% {
    transform: scale(0.96);
  }
  70% {
    transform: scale(1.03);
  }
}

@keyframes padlock-keyhole-pop {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.88);
  }
  75% {
    transform: scale(1.06);
  }
}

@keyframes padlock-glow-in {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  100% {
    opacity: 0.55;
    transform: scale(1);
  }
}

@keyframes padlock-glow-pulse {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(0.96);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.04);
  }
}

@keyframes padlock-open-shackle {
  0% {
    transform: rotate(0deg) translateY(0);
  }
  12% {
    transform: rotate(4deg) translateY(1px);
  }
  38% {
    transform: rotate(-22deg) translateY(-5px);
  }
  58% {
    transform: rotate(-42deg) translateY(-10px);
  }
  72% {
    transform: rotate(-34deg) translateY(-7px);
  }
  100% {
    transform: rotate(-40deg) translateY(-9px);
  }
}

@keyframes padlock-open-body {
  0%,
  100% {
    transform: scale(1);
  }
  18% {
    transform: scale(0.97);
  }
  48% {
    transform: scale(1.07);
  }
  68% {
    transform: scale(1.02);
  }
}

@keyframes padlock-keyhole-unlock {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  20% {
    transform: scale(0.9) rotate(-8deg);
  }
  45% {
    transform: scale(1.12) rotate(6deg);
  }
  65% {
    transform: scale(1) rotate(0deg);
  }
}

@keyframes padlock-unlock-lift {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  35% {
    transform: translateY(-4px) scale(1.04);
  }
  60% {
    transform: translateY(-2px) scale(1.06);
  }
}

@keyframes padlock-glow-burst {
  0% {
    opacity: 0.55;
    transform: scale(1);
  }
  35% {
    opacity: 0.75;
    transform: scale(1.08);
  }
  55% {
    opacity: 1;
    transform: scale(1.35);
  }
  100% {
    opacity: 0.9;
    transform: scale(1.28);
  }
}

@keyframes padlock-spark {
  0% {
    opacity: 0;
    transform: rotate(calc(var(--i) * 45deg)) translateY(0) scale(0.3);
  }
  18% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: rotate(calc(var(--i) * 45deg)) translateY(-52px) scale(1.15);
  }
}

@keyframes padlock-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-8px) rotate(-2deg);
  }
  40% {
    transform: translateX(8px) rotate(2deg);
  }
  60% {
    transform: translateX(-5px);
  }
  80% {
    transform: translateX(5px);
  }
}
</style>
