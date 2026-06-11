<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <!-- 登录信息 -->
    <template v-if="type === '登录信息'">
      <rect x="4" y="10" width="16" height="12" rx="2" stroke="white" stroke-width="1.5"/>
      <path d="M8 10V8C8 5.5 10 4 12 4C14 4 16 5.5 16 8V10" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="16" r="1.5" fill="white"/>
    </template>
    <!-- 安全备注 -->
    <template v-else-if="type === '安全备注'">
      <rect x="5" y="3" width="14" height="18" rx="2" stroke="white" stroke-width="1.5"/>
      <path d="M9 8H15M9 12H15M9 16H12" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    </template>
    <!-- 银行卡 -->
    <template v-else-if="type === '银行卡'">
      <rect x="2" y="5" width="20" height="14" rx="2" stroke="white" stroke-width="1.5"/>
      <path d="M2 10H22" stroke="white" stroke-width="1.5"/>
      <rect x="5" y="14" width="6" height="2" rx="1" fill="white"/>
    </template>
    <!-- 身份标识 -->
    <template v-else-if="type === '身份标识'">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="white" stroke-width="1.5"/>
      <circle cx="9" cy="11" r="2" stroke="white" stroke-width="1.5"/>
      <path d="M5 16C5 14 7 13 9 13H15C17 13 19 14 19 16" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    </template>
    <!-- 服务器 -->
    <template v-else-if="type === '服务器'">
      <rect x="3" y="4" width="18" height="6" rx="1.5" stroke="white" stroke-width="1.5"/>
      <rect x="3" y="14" width="18" height="6" rx="1.5" stroke="white" stroke-width="1.5"/>
      <circle cx="7" cy="7" r="1" fill="white"/>
      <circle cx="7" cy="17" r="1" fill="white"/>
      <path d="M11 7H17M11 17H15" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    </template>
    <!-- 数据库 -->
    <template v-else-if="type === '数据库'">
      <ellipse cx="12" cy="6" rx="8" ry="3" stroke="white" stroke-width="1.5"/>
      <path d="M4 6V18C4 19.66 7.58 21 12 21C16.42 21 20 19.66 20 18V6" stroke="white" stroke-width="1.5"/>
      <path d="M4 12C4 13.66 7.58 15 12 15C16.42 15 20 13.66 20 12" stroke="white" stroke-width="1.5"/>
    </template>
    <!-- 自定义 -->
    <template v-else>
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="white" stroke-width="1.5"/>
      <path d="M12 8V16M8 12H16" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    </template>
  </svg>
</template>

<script setup lang="ts">
import type { VaultEntryIconType } from '@/utils/vaultEntryDisplay'

withDefaults(
  defineProps<{
    type: VaultEntryIconType
    size?: number
  }>(),
  {
    size: 22
  }
)
</script>
