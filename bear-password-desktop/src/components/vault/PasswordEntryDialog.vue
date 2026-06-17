<template>
  <el-dialog
    :model-value="visible"
    :width="isVaultItemForm ? '560px' : '520px'"
    :class="['entry-dialog', { 'entry-dialog--login': isVaultItemForm }]"
    :show-close="!isVaultItemForm"
    @close="handleClose"
  >
    <template #header>
      <div v-if="isVaultItemForm" class="entry-dialog__login-header">
        <button type="button" class="entry-dialog__back" :aria-label="t('entry.dialog.back')" @click="handleClose">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        <h2 class="entry-dialog__login-title">{{ vaultItemDialogTitle }}</h2>
        <button type="button" class="entry-dialog__close" :aria-label="t('entry.dialog.close')" @click="handleClose">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <span v-else>{{ dialogTitle }}</span>
    </template>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <template v-if="!isVaultItemForm">
        <el-form-item v-if="showTypeSelector" :label="t('entry.dialog.passwordType')" prop="passwordType">
          <el-select v-model="form.passwordType" :placeholder="t('entry.dialog.selectType')" style="width: 100%">
            <el-option
              v-for="item in passwordTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <div v-else-if="!isEdit && presetLabel" class="entry-dialog__type-hint">
          {{ t('entry.dialog.typeHint') }}<span>{{ presetLabel }}</span>
        </div>

        <el-form-item :label="t('entry.dialog.tags')" prop="passwordLabels">
          <el-select
            v-model="form.passwordLabels"
            multiple
            filterable
            allow-create
            default-first-option
            :placeholder="t('entry.dialog.addTagsPlaceholder')"
            style="width: 100%"
          />
        </el-form-item>
      </template>

      <!-- 登录信息 -->
      <LoginEntryForm
        v-if="isLoginForm"
        :content="loginContent"
        :variant="loginFormMode"
        :remark="form.remark ?? ''"
        :labels="form.passwordLabels"
        @update:remark="form.remark = $event"
        @update:labels="form.passwordLabels = $event"
      />

      <!-- 安全备注 -->
      <SecureNoteEntryForm
        v-else-if="isSecureNoteForm"
        :content="secureNoteContent"
        :labels="form.passwordLabels"
        @update:labels="form.passwordLabels = $event"
      />

      <!-- 两步验证（2FA） -->
      <AuthenticatorEntryForm
        v-else-if="isAuthenticatorForm"
        :content="authenticatorContent"
        :labels="form.passwordLabels"
        @update:labels="form.passwordLabels = $event"
      />

      <!-- 银行卡 -->
      <BankCardEntryForm
        v-else-if="isBankCardForm"
        :content="bankContent"
        :remark="form.remark ?? ''"
        :labels="form.passwordLabels"
        @update:remark="form.remark = $event"
        @update:labels="form.passwordLabels = $event"
      />

      <!-- 身份标识 -->
      <IdentityEntryForm
        v-else-if="isIdentityForm"
        :content="identityContent"
        :remark="form.remark ?? ''"
        :labels="form.passwordLabels"
        @update:remark="form.remark = $event"
        @update:labels="form.passwordLabels = $event"
      />

      <!-- 数据库 -->
      <DatabaseEntryForm
        v-else-if="isDatabaseForm"
        :content="databaseContent"
        :remark="form.remark ?? ''"
        :labels="form.passwordLabels"
        @update:remark="form.remark = $event"
        @update:labels="form.passwordLabels = $event"
      />

      <!-- 自定义 -->
      <CustomEntryForm
        v-else-if="isCustomForm"
        :content="customContent"
        :remark="form.remark ?? ''"
        :labels="form.passwordLabels"
        @update:remark="form.remark = $event"
        @update:labels="form.passwordLabels = $event"
      />

      <el-form-item v-if="!isVaultItemForm" :label="t('entry.dialog.remark')">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="2"
          :placeholder="t('entry.dialog.optionalRemark')"
          :maxlength="PASSWORD_REMARK_MAX_LENGTH"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div v-if="isVaultItemForm" class="entry-dialog__login-footer">
        <el-button type="primary" :loading="submitting" @click="handleSubmit">{{ t('entry.dialog.save') }}</el-button>
      </div>
      <template v-else>
        <el-button @click="handleClose">{{ t('entry.dialog.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">{{ t('entry.dialog.save') }}</el-button>
      </template>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, defineAsyncComponent } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import BankCardEntryForm from '@/components/vault/BankCardEntryForm.vue'
import CustomEntryForm from '@/components/vault/CustomEntryForm.vue'
import DatabaseEntryForm from '@/components/vault/DatabaseEntryForm.vue'
import IdentityEntryForm from '@/components/vault/IdentityEntryForm.vue'
import LoginEntryForm from '@/components/vault/LoginEntryForm.vue'
import SecureNoteEntryForm from '@/components/vault/SecureNoteEntryForm.vue'
import {
  createEmptyAuthenticatorContent,
  normalizeAuthenticatorContent,
  serializeAuthenticatorContent
} from '@/utils/authenticatorContent'
import {
  createEmptyCustomContent,
  normalizeCustomContent,
  serializeCustomContent
} from '@/utils/customContent'
import {
  createEmptyDatabaseContent,
  isLegacyDatabaseCustomEntry,
  normalizeDatabaseContent,
  serializeDatabaseContent
} from '@/utils/databaseContent'
import {
  createEmptyBankCardContent,
  normalizeBankCardContent,
  serializeBankCardContent
} from '@/utils/bankCardContent'
import {
  createEmptyIdentityContent,
  normalizeIdentityContent,
  serializeIdentityContent
} from '@/utils/identityContent'
import {
  createEmptyLoginContent,
  createServerPresetContent,
  isServerLoginContent,
  normalizeLoginContent,
  serializeLoginContent
} from '@/utils/loginContent'
import {
  createEmptySecureNoteContent,
  normalizeSecureNoteContent,
  serializeSecureNoteContent
} from '@/utils/secureNoteContent'
import { isEncryptedContent } from '@/utils/contentCrypto'
import { isValidAuthenticatorSecret } from '@/utils/totp'
import { isDecryptFailedContent } from '@/utils/vaultEntryTransform'
import {
  buildPasswordTitleFromForm,
  resolveFormTitle
} from '@/utils/passwordTitle'
import {
  buildWebsitesFromForm,
  resolveFormWebsites
} from '@/utils/passwordWebsites'
import { PASSWORD_REMARK_MAX_LENGTH, PASSWORD_TITLE_MAX_LENGTH } from '@/constants/vaultFieldLimits'
import { useI18n } from '@/composables/useI18n'
import { getPasswordTypeFilterOptions, getPasswordTypeLabel } from '@/utils/passwordTypeI18n'
import {
  type AuthenticatorContent,
  type BankCardContent,
  type CustomContent,
  type DatabaseContent,
  type IdentityContent,
  type LoginContent,
  type PasswordEntry,
  type PasswordEntryParams,
  type PasswordType,
  type SecureNoteContent
} from '@/types'

const AuthenticatorEntryForm = defineAsyncComponent(
  () => import('@/components/vault/AuthenticatorEntryForm.vue')
)

const props = defineProps<{
  visible: boolean
  entry?: PasswordEntry | null
  presetType?: PasswordType | null
  presetLabel?: string | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [data: PasswordEntryParams]
}>()

const { t, locale } = useI18n()
const formRef = ref<FormInstance>()
const submitting = ref(false)

const passwordTypeOptions = computed(() => getPasswordTypeFilterOptions(locale.value))

const isEdit = computed(() => !!props.entry)
const isLoginForm = computed(
  () => form.passwordType === '登录信息' || form.passwordType === '服务器'
)
const isSecureNoteForm = computed(() => form.passwordType === '安全备注')
const isAuthenticatorForm = computed(() => form.passwordType === '两步验证（2FA）')
const isBankCardForm = computed(() => form.passwordType === '银行卡')
const isIdentityForm = computed(() => form.passwordType === '身份信息')
const isCustomForm = computed(() => form.passwordType === '自定义')
const isDatabaseForm = computed(() => form.passwordType === '数据库')
const isVaultItemForm = computed(
  () =>
    isLoginForm.value ||
    isSecureNoteForm.value ||
    isAuthenticatorForm.value ||
    isBankCardForm.value ||
    isIdentityForm.value ||
    isDatabaseForm.value ||
    isCustomForm.value
)
const showTypeSelector = computed(() => isEdit.value && !isVaultItemForm.value)

const dialogTitle = computed(() => {
  if (isEdit.value) return t('entry.dialog.editPassword')
  if (props.presetLabel) return t('entry.dialog.newPasswordWithType', { type: props.presetLabel })
  return t('entry.dialog.newPassword')
})

const vaultItemDialogTitle = computed(() => {
  const typeLabel = getPasswordTypeLabel(form.passwordType, locale.value)
  if (isEdit.value) {
    return t('entry.dialog.editItemWithType', { type: typeLabel })
  }
  return t('entry.dialog.newItemWithType', { type: typeLabel })
})

const form = reactive<PasswordEntryParams>({
  passwordType: '登录信息',
  passwordLabels: [],
  content: {},
  remark: ''
})

const loginContent = reactive<LoginContent>(createEmptyLoginContent())
const loginFormMode = ref<'login' | 'server'>('login')

const secureNoteContent = reactive<SecureNoteContent>(createEmptySecureNoteContent())

const authenticatorContent = reactive<AuthenticatorContent>(createEmptyAuthenticatorContent())

const bankContent = reactive<BankCardContent>(createEmptyBankCardContent())

const identityContent = reactive<IdentityContent>(createEmptyIdentityContent())

const customContent = reactive<CustomContent>(createEmptyCustomContent())

const databaseContent = reactive<DatabaseContent>(createEmptyDatabaseContent())

const rules = computed<FormRules>(() => {
  if (isVaultItemForm.value) {
    return {}
  }
  return {
    passwordType: [{ required: true, message: t('entry.validate.selectType'), trigger: 'change' }],
    passwordLabels: [
      { required: true, type: 'array', min: 1, message: t('entry.validate.minOneTag'), trigger: 'change' }
    ]
  }
})

function initDialogForm(presetType: PasswordType | null | undefined): void {
  resetForm()
  if (props.entry) {
    fillForm(props.entry)
  } else if (presetType) {
    form.passwordType = presetType
    applyPresetContent(presetType)
  }
}

watch(
  () => [props.visible, props.presetType, props.entry?.id ?? null] as const,
  ([visible, presetType, entryId], prev) => {
    if (!visible) return

    const opening = !prev?.[0]
    const presetChanged = presetType !== prev?.[1]
    const entryChanged = entryId !== prev?.[2]

    if (opening || presetChanged || entryChanged) {
      initDialogForm(presetType)
    }
  },
  { flush: 'post' }
)

function resetForm(): void {
  form.passwordType = '登录信息'
  form.passwordLabels = []
  form.remark = ''
  loginContent.title = ''
  loginContent.username = ''
  loginContent.password = ''
  loginContent.host = ''
  loginContent.websites.splice(0, loginContent.websites.length, '')
  loginContent.extraFields.splice(0, loginContent.extraFields.length)
  loginFormMode.value = 'login'
  Object.assign(secureNoteContent, createEmptySecureNoteContent())
  Object.assign(authenticatorContent, createEmptyAuthenticatorContent())
  Object.assign(bankContent, createEmptyBankCardContent())
  Object.assign(identityContent, createEmptyIdentityContent())
  Object.assign(customContent, createEmptyCustomContent())
  Object.assign(databaseContent, createEmptyDatabaseContent())
}

function fillForm(entry: PasswordEntry): void {
  const data = entry.content as Record<string, unknown>
  if (entry.passwordType === '自定义' && isLegacyDatabaseCustomEntry(entry.passwordType, data)) {
    form.passwordType = '数据库'
  } else if (entry.passwordType === '登录信息' && isServerLoginContent(data)) {
    form.passwordType = '服务器'
  } else {
    form.passwordType = entry.passwordType
  }

  if (!isEncryptedContent(entry.content) && !isDecryptFailedContent(entry.content)) {
    const record = entry.content as Record<string, unknown>
    const labelsFromContent = Array.isArray(record.passwordLabels)
      ? record.passwordLabels.map((item) => String(item ?? '').trim()).filter(Boolean)
      : []
    form.passwordLabels = labelsFromContent
    form.remark = String(record.remark ?? '').trim()
  } else {
    form.passwordLabels = [...(entry.passwordLabels ?? [])]
    form.remark = entry.remark ?? ''
  }

  fillContentByType(form.passwordType, entry.content)
  applyTitleToForm(form.passwordType, resolveFormTitle(entry, form.passwordType))
  applyWebsitesToForm(form.passwordType, resolveFormWebsites(entry, form.passwordType))
}

function applyWebsitesToForm(type: PasswordType, websites: string[]): void {
  if (type !== '登录信息') return
  loginContent.websites.splice(0, loginContent.websites.length, ...websites)
}

function applyTitleToForm(type: PasswordType, title: string): void {
  switch (type) {
    case '登录信息':
    case '服务器':
      loginContent.title = title
      break
    case '银行卡':
      bankContent.title = title
      break
    case '身份信息':
      identityContent.title = title
      break
    case '安全备注':
      secureNoteContent.title = title
      break
    case '两步验证（2FA）':
      authenticatorContent.title = title
      break
    case '自定义':
      customContent.title = title
      break
    case '数据库':
      databaseContent.title = title
      break
  }
}

function applyPresetContent(type: PasswordType): void {
  if (type === '安全备注') {
    Object.assign(secureNoteContent, createEmptySecureNoteContent())
  } else if (type === '两步验证（2FA）') {
    Object.assign(authenticatorContent, createEmptyAuthenticatorContent())
  } else if (type === '银行卡') {
    Object.assign(bankContent, createEmptyBankCardContent())
  } else if (type === '身份信息') {
    Object.assign(identityContent, createEmptyIdentityContent())
  } else if (type === '数据库') {
    Object.assign(databaseContent, createEmptyDatabaseContent())
  } else if (type === '自定义') {
    Object.assign(customContent, createEmptyCustomContent())
  } else if (type === '服务器') {
    loginFormMode.value = 'server'
    const preset = createServerPresetContent()
    loginContent.title = preset.title
    loginContent.username = preset.username
    loginContent.password = preset.password
    loginContent.host = preset.host
    loginContent.websites.splice(0, loginContent.websites.length)
    loginContent.extraFields.splice(0, loginContent.extraFields.length, ...preset.extraFields)
  } else if (type === '登录信息') {
    loginFormMode.value = 'login'
  }
}

function fillContentByType(type: PasswordType, content: PasswordEntry['content']): void {
  const data = content as Record<string, unknown>
  if (type === '登录信息' || type === '服务器') {
    loginFormMode.value = type === '服务器' ? 'server' : 'login'
    const normalized = normalizeLoginContent(data)
    loginContent.title = normalized.title
    loginContent.username = normalized.username
    loginContent.password = normalized.password
    loginContent.host = normalized.host
    loginContent.websites.splice(0, loginContent.websites.length, ...normalized.websites)
    loginContent.extraFields.splice(0, loginContent.extraFields.length, ...normalized.extraFields)
  } else if (type === '银行卡') {
    Object.assign(bankContent, normalizeBankCardContent(data))
  } else if (type === '身份信息') {
    Object.assign(identityContent, normalizeIdentityContent(data))
  } else if (type === '安全备注') {
    Object.assign(secureNoteContent, normalizeSecureNoteContent(data))
  } else if (type === '两步验证（2FA）') {
    Object.assign(authenticatorContent, normalizeAuthenticatorContent(data))
  } else if (type === '自定义') {
    Object.assign(customContent, normalizeCustomContent(data))
  } else if (type === '数据库') {
    Object.assign(databaseContent, normalizeDatabaseContent(data))
  }
}

function buildContent(): PasswordEntryParams['content'] {
  switch (form.passwordType) {
    case '登录信息':
    case '服务器':
      return serializeLoginContent(loginContent)
    case '银行卡':
      return serializeBankCardContent(bankContent)
    case '身份信息':
      return serializeIdentityContent(identityContent)
    case '安全备注':
      return serializeSecureNoteContent(secureNoteContent)
    case '两步验证（2FA）':
      return serializeAuthenticatorContent(authenticatorContent)
    case '自定义':
      return serializeCustomContent(customContent)
    case '数据库':
      return serializeDatabaseContent(databaseContent)
    default:
      return {}
  }
}

function validateContent(): string | null {
  switch (form.passwordType) {
    case '登录信息':
      if (!loginContent.title.trim()) return 'entry.validate.titleRequired'
      if (!loginContent.username.trim()) return 'entry.validate.usernameRequired'
      if (!loginContent.password.trim()) return 'entry.validate.passwordRequired'
      return null
    case '服务器':
      if (!loginContent.title.trim()) return 'entry.validate.titleRequired'
      if (!loginContent.host.trim()) return 'entry.validate.hostRequired'
      if (!loginContent.username.trim()) return 'entry.validate.usernameRequired'
      if (!loginContent.password.trim()) return 'entry.validate.passwordRequired'
      return null
    case '银行卡':
      if (!bankContent.cardHolder.trim()) return 'entry.validate.cardHolderRequired'
      if (!bankContent.cardNumber.trim()) return 'entry.validate.cardNumberRequired'
      return null
    case '身份信息':
      if (!identityContent.name.trim()) return 'entry.validate.nameRequired'
      if (!identityContent.idNumber.trim()) return 'entry.validate.idNumberRequired'
      return null
    case '安全备注':
      if (!secureNoteContent.body.trim()) return 'entry.validate.noteBodyRequired'
      return null
    case '两步验证（2FA）':
      if (!authenticatorContent.account.trim() && !authenticatorContent.title.trim()) {
        return 'entry.validate.accountNameRequired'
      }
      if (!authenticatorContent.secret.trim()) return 'entry.validate.secretRequired'
      if (!isValidAuthenticatorSecret(authenticatorContent.secret)) return 'entry.validate.secretInvalid'
      return null
    case '自定义':
      if (!customContent.title.trim()) return 'entry.validate.titleRequired'
      if (!customContent.fields.some((field) => field.label.trim() && field.value.trim())) {
        return 'entry.validate.customFieldRequired'
      }
      return null
    case '数据库':
      if (!databaseContent.dbType.trim()) return 'entry.validate.dbTypeRequired'
      if (!databaseContent.host.trim()) return 'entry.validate.hostRequired'
      return null
    default:
      return 'entry.validate.selectType'
  }
}

function handleClose(): void {
  emit('update:visible', false)
}

async function handleSubmit(): Promise<void> {
  if (props.entry && isDecryptFailedContent(props.entry.content)) {
    ElMessage.warning(t('entry.msg.decryptFailed'))
    return
  }

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  const contentError = validateContent()
  if (contentError) {
    ElMessage.warning(t(contentError))
    return
  }

  const passwordTitle = buildPasswordTitleFromForm(form.passwordType, {
    login: loginContent,
    bank: bankContent,
    identity: identityContent,
    secureNote: secureNoteContent,
    authenticator: authenticatorContent,
    custom: customContent,
    database: databaseContent
  })
  if (passwordTitle.length > PASSWORD_TITLE_MAX_LENGTH) {
    ElMessage.warning(t('entry.validate.titleTooLong', { max: PASSWORD_TITLE_MAX_LENGTH }))
    return
  }

  const remark = form.remark ?? ''
  if (remark.length > PASSWORD_REMARK_MAX_LENGTH) {
    ElMessage.warning(t('entry.validate.remarkTooLong', { max: PASSWORD_REMARK_MAX_LENGTH }))
    return
  }

  submitting.value = true
  try {
    const passwordType: PasswordType = form.passwordType
    const content = buildContent()
    emit('submit', {
      passwordType,
      passwordLabels: form.passwordLabels,
      passwordTitle,
      websites: buildWebsitesFromForm(passwordType, loginContent),
      content,
      remark: form.remark
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.entry-dialog {
  &__login-header {
    @include flex-between;
    position: relative;
    padding: $spacing-xs 0;
  }

  &__login-title {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-text-primary;
    margin: 0;
  }

  &__back,
  &__close {
    width: 32px;
    height: 32px;
    border-radius: $radius-sm;
    @include flex-center;
    color: $color-text-secondary;
    background: transparent;
    border: none;
    cursor: pointer;

    &:hover {
      background: $color-surface-hover;
      color: $color-text-primary;
    }
  }

  &__login-footer {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }

  &__type-hint {
    margin-bottom: $spacing-md;
    font-size: $font-size-sm;
    color: $color-text-secondary;

    span {
      color: $color-text-primary;
      font-weight: 600;
    }
  }
}
</style>

<style lang="scss">
.entry-dialog--login.el-dialog {
  border-radius: $radius-xl;

  .el-dialog__header {
    padding: $spacing-sm $spacing-md $spacing-xs;
    margin-right: 0;
  }

  .el-dialog__body {
    padding: 0 $spacing-md $spacing-sm;
    overflow: visible;
  }

  .el-dialog__footer {
    padding: $spacing-sm $spacing-md $spacing-md;
    border-top: 1px solid $color-border;
  }
}
</style>
