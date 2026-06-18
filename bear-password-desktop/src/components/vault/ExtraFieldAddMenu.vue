<template>
  <el-dropdown
    trigger="click"
    placement="top-start"
    popper-class="extra-field-add-dropdown"
    @command="handleCommand"
  >
    <button type="button" class="extra-field-add-menu__btn">
      <span>+</span> {{ t('entry.form.addMore') }}
    </button>
    <template #dropdown>
      <el-dropdown-menu class="extra-field-add-menu">
        <el-dropdown-item
          v-for="option in EXTRA_FIELD_TYPE_OPTIONS"
          :key="option.id"
          :command="option.id"
        >
          {{ t(option.labelKey) }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { EXTRA_FIELD_TYPE_OPTIONS, type ExtraFieldTypeId } from '@/constants/extraFieldTypes'
import { useI18n } from '@/composables/useI18n'

const emit = defineEmits<{
  add: [type: ExtraFieldTypeId]
}>()

const { t } = useI18n()

function handleCommand(type: ExtraFieldTypeId): void {
  emit('add', type)
}
</script>

<style scoped lang="scss">
.extra-field-add-menu__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: $font-family;
  font-size: $font-size-sm;
  color: $color-accent;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  transition: color $transition-fast;

  span {
    font-size: $font-size-md;
    line-height: 1;
  }

  &:hover {
    color: $color-accent-hover;
  }
}
</style>

<style lang="scss">
.extra-field-add-dropdown.el-popper {
  .extra-field-add-menu {
    min-width: 160px;
    padding: $spacing-xs 0;
  }

  .el-dropdown-menu__item {
    font-size: $font-size-sm;
    color: $color-text-primary;
    line-height: 1.5;
  }
}
</style>
