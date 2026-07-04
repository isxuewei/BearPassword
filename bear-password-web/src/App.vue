<template>
  <el-config-provider :locale="elementLocale" :z-index="Z_INDEX_ELEMENT_PLUS">
    <router-view />
    <VaultLocalSetupDialog />
    <LockScreen />
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LockScreen from '@/components/common/LockScreen.vue'
import VaultLocalSetupDialog from '@/components/common/VaultLocalSetupDialog.vue'
import { useAppStore } from '@/stores/app'
import { getElementPlusLocale } from '@/locales'
import { Z_INDEX_ELEMENT_PLUS } from '@/constants/zIndex'

const appStore = useAppStore()

const elementLocale = computed(() => getElementPlusLocale(appStore.resolvedLocale))
</script>
