<template>
  <div class="profile-settings" :class="{ 'profile-settings--embedded': embedded }">
    <div class="profile-settings__section">
      <div class="profile-settings__profile-row">
        <el-upload
          class="profile-settings__avatar-upload"
          :show-file-list="false"
          accept="image/jpeg,image/png,image/webp,image/gif"
          :disabled="uploadingAvatar"
          :before-upload="beforeAvatarUpload"
          :http-request="handleAvatarUpload"
        >
          <div
            class="profile-settings__avatar"
            :class="{ 'profile-settings__avatar--uploading': uploadingAvatar }"
          >
            <img
              v-if="showAvatarImage"
              :src="profile?.avatar || authStore.avatar"
              :alt="displayName"
              class="profile-settings__avatar-img"
              @error="onAvatarError"
            />
            <span v-else>{{ avatarLetter }}</span>
            <div class="profile-settings__avatar-overlay">
              <span>{{ uploadingAvatar ? t('profile.uploading') : t('profile.changeAvatar') }}</span>
            </div>
          </div>
        </el-upload>
        <div class="profile-settings__account-info">
          <span class="profile-settings__display-name">{{ displayName }}</span>
          <span v-if="profile?.userId" class="profile-settings__user-id">
            {{ t('profile.userId', { id: profile.userId }) }}
          </span>
          <span class="profile-settings__avatar-tip">{{ t('profile.avatarTip') }}</span>
        </div>
      </div>

      <div class="profile-settings__divider" />

      <el-form
        ref="usernameFormRef"
        :model="usernameForm"
        :rules="usernameRules"
        label-position="top"
        class="profile-settings__username-form"
        @submit.prevent="handleSaveUsername"
      >
        <el-form-item :label="t('profile.username')" prop="username">
          <el-input
            v-model="usernameForm.username"
            size="large"
            :placeholder="t('profile.usernamePlaceholder')"
            :disabled="savingUsername"
            maxlength="16"
          />
          <el-button
            class="profile-settings__action-btn"
            type="primary"
            size="large"
            :loading="savingUsername"
            :disabled="!usernameChanged"
            @click="handleSaveUsername"
          >
            {{ t('profile.saveUsername') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="profile-settings__section">
      <div class="profile-settings__section-head">
        <h3 class="profile-settings__section-title">{{ t('profile.changePassword') }}</h3>
        <p class="profile-settings__hint">{{ t('profile.passwordHint') }}</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="profile-settings__form"
        @submit.prevent="handleSubmit"
      >
        <el-form-item :label="t('profile.currentPassword')" prop="oldPassword">
          <el-input
            v-model="form.oldPassword"
            type="password"
            show-password
            size="large"
            :placeholder="t('profile.currentPasswordPlaceholder')"
            autocomplete="current-password"
          />
        </el-form-item>

        <el-form-item :label="t('profile.newPassword')" prop="newPassword">
          <el-input
            v-model="form.newPassword"
            type="password"
            show-password
            size="large"
            :placeholder="t('profile.newPasswordPlaceholder')"
            autocomplete="new-password"
          />
        </el-form-item>

        <el-form-item :label="t('profile.confirmPassword')" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            show-password
            size="large"
            :placeholder="t('profile.confirmPasswordPlaceholder')"
            autocomplete="new-password"
            @keyup.enter="handleSubmit"
          />
        </el-form-item>

        <el-button
          class="profile-settings__action-btn"
          type="primary"
          size="large"
          :loading="saving"
          @click="handleSubmit"
        >
          {{ t('profile.savePassword') }}
        </el-button>
      </el-form>
    </div>

    <div class="profile-settings__section">
      <div class="profile-settings__section-head">
        <h3 class="profile-settings__section-title">{{ t('profile.session') }}</h3>
        <p class="profile-settings__hint">{{ t('profile.logoutHint') }}</p>
      </div>
      <div class="profile-settings__session-actions">
        <el-button size="large" :loading="loggingOut" @click="handleLogout">
          {{ t('profile.logout') }}
        </el-button>
        <el-button size="large" type="danger" plain :loading="loggingOutCompletely" @click="handleLogoutCompletely">
          {{ t('profile.logoutCompletely') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules, type UploadRequestOptions } from 'element-plus'
import { settingsMessageBoxConfirm } from '@/utils/settingsMessageBox'
import {
  changePasswordApi,
  checkUsernameApi,
  getCurrentUserApi,
  updateUsernameApi,
  uploadAvatarApi
} from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useAutoLockStore } from '@/stores/autoLock'
import { useSettingsDialogStore } from '@/stores/settingsDialog'
import { useI18n } from '@/composables/useI18n'
import type { UserProfile } from '@/types'

withDefaults(
  defineProps<{
    embedded?: boolean
  }>(),
  {
    embedded: false
  }
)

const router = useRouter()
const authStore = useAuthStore()
const autoLockStore = useAutoLockStore()
const settingsDialog = useSettingsDialogStore()
const { t } = useI18n()

const USERNAME_PATTERN = /^[\u4e00-\u9fff\w]+$/
const USERNAME_MAX_LENGTH = 16

const profile = ref<UserProfile | null>(null)
const saving = ref(false)
const savingUsername = ref(false)
const loggingOut = ref(false)
const loggingOutCompletely = ref(false)
const uploadingAvatar = ref(false)
const avatarLoadFailed = ref(false)
const formRef = ref<FormInstance>()
const usernameFormRef = ref<FormInstance>()
const originalUsername = ref('')

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const usernameForm = reactive({
  username: ''
})

const displayName = computed(() => profile.value?.username || authStore.username)

const usernameChanged = computed(
  () => usernameForm.username.trim() !== originalUsername.value.trim()
)

const avatarLetter = computed(() => displayName.value.charAt(0).toUpperCase() || 'B')

const showAvatarImage = computed(() => {
  const avatar = profile.value?.avatar || authStore.avatar
  return !!avatar && !avatarLoadFailed.value
})

const usernameRules = computed<FormRules>(() => ({
  username: [
    { required: true, message: t('profile.usernameRequired'), trigger: 'blur' },
    { min: 2, max: USERNAME_MAX_LENGTH, message: t('profile.usernameLength'), trigger: 'blur' },
    {
      pattern: USERNAME_PATTERN,
      message: t('profile.usernamePattern'),
      trigger: 'blur'
    },
    {
      validator: (_rule, value, callback) => {
        const trimmed = String(value ?? '').trim()
        if (!trimmed || trimmed === originalUsername.value.trim()) {
          callback()
          return
        }
        if (!USERNAME_PATTERN.test(trimmed) || trimmed.length < 2 || trimmed.length > USERNAME_MAX_LENGTH) {
          callback()
          return
        }
        checkUsernameApi(trimmed)
          .then((result) => {
            if (!result.available) {
              callback(new Error(t('profile.usernameTaken')))
              return
            }
            callback()
          })
          .catch((err: unknown) => {
            callback(new Error(err instanceof Error ? err.message : t('profile.usernameCheckFailed')))
          })
      },
      trigger: 'blur'
    }
  ]
}))

const rules = computed<FormRules>(() => ({
  oldPassword: [{ required: true, message: t('profile.oldPasswordRequired'), trigger: 'blur' }],
  newPassword: [
    { required: true, message: t('profile.newPasswordRequired'), trigger: 'blur' },
    { min: 6, max: 64, message: t('profile.newPasswordLength'), trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: t('profile.confirmPasswordRequired'), trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.newPassword) {
          callback(new Error(t('profile.passwordMismatch')))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}))

function onAvatarError(): void {
  avatarLoadFailed.value = true
}

const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const AVATAR_ACCEPT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function beforeAvatarUpload(file: File): boolean {
  if (!AVATAR_ACCEPT_TYPES.has(file.type)) {
    ElMessage.warning(t('profile.avatarTypeInvalid'))
    return false
  }
  if (file.size > AVATAR_MAX_BYTES) {
    ElMessage.warning(t('profile.avatarTooLarge'))
    return false
  }
  return true
}

async function handleAvatarUpload(options: UploadRequestOptions): Promise<void> {
  if (uploadingAvatar.value) return

  uploadingAvatar.value = true
  avatarLoadFailed.value = false
  try {
    const result = await uploadAvatarApi(options.file as File)
    if (profile.value) {
      profile.value = { ...profile.value, avatar: result.avatar }
    } else {
      profile.value = {
        userId: 0,
        username: authStore.username,
        avatar: result.avatar
      }
    }
    authStore.updateAvatar(result.avatar)
    ElMessage.success(t('profile.avatarUpdated'))
    options.onSuccess?.(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : t('profile.avatarUploadFailed')
    ElMessage.error(message)
    options.onError?.(err as Error)
  } finally {
    uploadingAvatar.value = false
  }
}

function syncUsernameForm(username: string): void {
  originalUsername.value = username
  usernameForm.username = username
  usernameFormRef.value?.clearValidate()
}

async function loadProfile(): Promise<void> {
  avatarLoadFailed.value = false
  try {
    profile.value = await getCurrentUserApi()
    syncUsernameForm(profile.value.username)
    authStore.syncProfile(profile.value)
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : t('profile.loadFailed'))
  }
}

async function handleSaveUsername(): Promise<void> {
  if (savingUsername.value || !usernameChanged.value) return

  const valid = await usernameFormRef.value?.validate().catch(() => false)
  if (!valid) return

  const username = usernameForm.username.trim()
  savingUsername.value = true
  try {
    await updateUsernameApi({ username })
    if (profile.value) {
      profile.value = { ...profile.value, username }
    }
    authStore.updateUsername(username)
    syncUsernameForm(username)
    ElMessage.success(t('profile.usernameUpdated'))
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : t('profile.usernameUpdateFailed'))
  } finally {
    savingUsername.value = false
  }
}

async function handleSubmit(): Promise<void> {
  if (saving.value) return

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    await changePasswordApi({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword
    })
    form.oldPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
    formRef.value?.clearValidate()
    ElMessage.success(t('profile.passwordUpdated'))
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : t('profile.passwordChangeFailed'))
  } finally {
    saving.value = false
  }
}

async function handleLogout(): Promise<void> {
  if (loggingOut.value || loggingOutCompletely.value) return

  try {
    await settingsMessageBoxConfirm(t('profile.logoutConfirmBody'), t('profile.logoutConfirmTitle'), {
      confirmButtonText: t('profile.logoutConfirmBtn'),
      cancelButtonText: t('msg.cancel'),
      type: 'warning'
    })
  } catch {
    return
  }

  loggingOut.value = true
  try {
    settingsDialog.close()
    autoLockStore.stop()
    await authStore.logout()
    router.push({ name: 'Login' })
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : t('profile.logoutFailed'))
  } finally {
    loggingOut.value = false
  }
}

async function handleLogoutCompletely(): Promise<void> {
  if (loggingOut.value || loggingOutCompletely.value) return

  try {
    await settingsMessageBoxConfirm(
      t('profile.logoutCompletelyConfirmBody'),
      t('profile.logoutCompletelyConfirmTitle'),
      {
        confirmButtonText: t('profile.logoutCompletelyConfirmBtn'),
        cancelButtonText: t('msg.cancel'),
        type: 'warning'
      }
    )
  } catch {
    return
  }

  loggingOutCompletely.value = true
  try {
    settingsDialog.close()
    autoLockStore.stop()
    await authStore.logoutCompletely()
    router.push({ name: 'Login' })
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : t('profile.logoutCompletelyFailed'))
  } finally {
    loggingOutCompletely.value = false
  }
}

onMounted(() => {
  void loadProfile()
})
</script>

<style scoped lang="scss">
.profile-settings {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  &__section {
    width: 100%;
    background: $color-bg-elevated;
    border: 1px solid $color-border;
    border-radius: $radius-lg;
    box-shadow: $shadow-sm;
    padding: $spacing-lg;
    min-width: 0;
    box-sizing: border-box;
  }

  &--embedded &__section {
    border-radius: $radius-md;
    box-shadow: none;
  }

  &__section-title {
    margin: 0 0 $spacing-xs;
    font-size: $font-size-md;
    font-weight: 600;
    color: $color-text-primary;
    letter-spacing: 0;
    text-transform: none;
  }

  &__section-head {
    margin-bottom: $spacing-md;
  }

  &__profile-row {
    display: flex;
    align-items: center;
    gap: $spacing-lg;
  }

  &__divider {
    height: 1px;
    margin: $spacing-md 0;
    background: $color-border;
  }

  &__avatar-upload {
    flex-shrink: 0;

    :deep(.el-upload) {
      display: block;
      outline: none;
    }
  }

  &__avatar {
    position: relative;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, $color-accent, #a29bfe);
    @include flex-center;
    font-size: $font-size-xl;
    font-weight: 600;
    color: white;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: scale(1.02);
      box-shadow: 0 8px 24px rgba(108, 92, 231, 0.25);

      .profile-settings__avatar-overlay {
        opacity: 1;
      }
    }

    &--uploading {
      pointer-events: none;

      .profile-settings__avatar-overlay {
        opacity: 1;
        background: rgba(0, 0, 0, 0.55);
      }
    }
  }

  &__avatar-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-xs;
    background: rgba(0, 0, 0, 0.45);
    color: white;
    font-size: $font-size-xs;
    font-weight: 500;
    text-align: center;
    line-height: 1.3;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__account-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__display-name {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-text-primary;
    line-height: 1.3;
  }

  &__username-form {
    margin-top: 0;
  }

  &__action-btn {
    margin-top: $spacing-sm;
    min-width: 120px;
  }

  @media (max-width: 767px) {
    &__action-btn {
      width: 100%;
      min-width: 0;
    }
  }

  &__user-id {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  &__avatar-tip {
    font-size: $font-size-xs;
    color: $color-text-muted;
    line-height: 1.4;
  }

  &__hint {
    margin: 0;
    font-size: $font-size-sm;
    color: $color-text-muted;
    line-height: 1.5;
  }

  &__session-actions {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-sm;

    :deep(.el-button) {
      width: 100%;
      margin: 0;
    }
  }

  @media (min-width: 768px) {
    &__session-actions {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;

      :deep(.el-button) {
        width: auto;
      }
    }
  }

  &__form {
    :deep(.el-form-item) {
      margin-bottom: $spacing-md;
    }

    :deep(.el-form-item:last-child) {
      margin-bottom: 0;
    }
  }
}
</style>
