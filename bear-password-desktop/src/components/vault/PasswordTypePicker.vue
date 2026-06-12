<template>
  <el-dialog
    :model-value="visible"
    width="480px"
    class="type-picker-dialog"
    destroy-on-close
    @close="handleClose"
  >
    <template #header>
      <h2 class="type-picker-dialog__title">{{ t('entry.picker.title') }}</h2>
    </template>

    <el-input
      v-model="searchText"
      :placeholder="t('entry.picker.searchPlaceholder')"
      clearable
      :prefix-icon="Search"
      class="type-picker-dialog__search"
    />

    <div class="type-picker-dialog__grid">
      <button
        v-for="item in filteredItems"
        :key="item.value"
        type="button"
        class="type-picker-dialog__item"
        @click="handleSelect(item)"
      >
        <div class="type-picker-dialog__icon" :style="{ background: item.color }">
          <VaultEntryTypeIcon :type="getPasswordTypeIconType(item.value)" />
        </div>
        <span class="type-picker-dialog__label">{{ getItemLabel(item) }}</span>
      </button>

      <button
        v-if="showImportItem"
        type="button"
        class="type-picker-dialog__item"
        @click="handleImport"
      >
        <div class="type-picker-dialog__icon" :style="{ background: importItem.color }">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3v12m0 0 4-4m-4 4-4-4"
              stroke="white"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
              stroke="white"
              stroke-width="1.75"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <span class="type-picker-dialog__label">{{ t('entry.picker.import') }}</span>
      </button>
    </div>

    <button
      v-if="!showAll && hasMoreItems && !searchText.trim()"
      type="button"
      class="type-picker-dialog__more"
      @click="showAll = true"
    >
      {{ t('entry.picker.showMore') }}
    </button>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import VaultEntryTypeIcon from '@/components/vault/VaultEntryTypeIcon.vue'
import { useI18n } from '@/composables/useI18n'
import { getPasswordTypeLabel } from '@/utils/passwordTypeI18n'
import { getPasswordTypeIconType } from '@/utils/vaultEntryDisplay'
import {
  PASSWORD_IMPORT_PICKER_ITEM,
  PASSWORD_PICKER_ITEMS,
  type PasswordPickerItem,
  type PasswordType
} from '@/types'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  select: [type: PasswordType, label: string]
  import: []
}>()

const importItem = PASSWORD_IMPORT_PICKER_ITEM

const { t, locale } = useI18n()
const searchText = ref('')
const showAll = ref(false)

watch(
  () => props.visible,
  (val) => {
    if (val) {
      searchText.value = ''
      showAll.value = false
    }
  }
)

function getItemLabel(item: PasswordPickerItem): string {
  return getPasswordTypeLabel(item.value, locale.value)
}

const filteredItems = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()

  if (keyword) {
    return PASSWORD_PICKER_ITEMS.filter((item) => {
      const label = getItemLabel(item).toLowerCase()
      return (
        label.includes(keyword) ||
        item.keywords.some((k) => k.toLowerCase().includes(keyword))
      )
    })
  }

  if (showAll.value) {
    return PASSWORD_PICKER_ITEMS
  }

  return PASSWORD_PICKER_ITEMS.filter((item) => item.featured !== false)
})

const hasMoreItems = computed(() =>
  PASSWORD_PICKER_ITEMS.some((item) => item.featured === false)
)

const showImportItem = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  if (keyword) {
    const label = t('entry.picker.import').toLowerCase()
    return (
      label.includes(keyword) ||
      importItem.keywords.some((item) => item.toLowerCase().includes(keyword))
    )
  }
  return showAll.value
})

function handleClose(): void {
  emit('update:visible', false)
}

function handleSelect(item: PasswordPickerItem): void {
  emit('select', item.value, getItemLabel(item))
  emit('update:visible', false)
}

function handleImport(): void {
  emit('import')
  emit('update:visible', false)
}
</script>

<style scoped lang="scss">
.type-picker-dialog {
  &__title {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $color-text-primary;
    margin: 0;
  }

  &__search {
    margin-bottom: $spacing-lg;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-md;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-md $spacing-sm;
    border-radius: $radius-md;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    transition: background $transition-fast, border-color $transition-fast;

    &:hover {
      background: $color-surface-hover;
      border-color: $color-border;
    }
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: $radius-md;
    @include flex-center;
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-text-primary;
    font-weight: 500;
  }

  &__more {
    display: block;
    width: 100%;
    margin-top: $spacing-md;
    padding: $spacing-sm;
    text-align: center;
    font-size: $font-size-sm;
    color: $color-accent;
    background: none;
    border: none;
    cursor: pointer;

    &:hover {
      color: $color-accent-hover;
    }
  }
}
</style>

<style lang="scss">
.type-picker-dialog.el-dialog {
  border-radius: $radius-xl;

  .el-dialog__header {
    padding: $spacing-lg $spacing-lg $spacing-sm;
    margin-right: 0;
  }

  .el-dialog__body {
    padding: $spacing-sm $spacing-lg $spacing-lg;
  }
}
</style>
