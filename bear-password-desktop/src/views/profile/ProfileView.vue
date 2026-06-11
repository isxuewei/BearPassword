<template>
  <div class="profile-view">
    <header class="profile-view__header">
      <h1>{{ t('profile.title') }}</h1>
      <p>{{ t('profile.subtitle') }}</p>
    </header>

    <div class="profile-view__section">
      <h3>{{ t('profile.account') }}</h3>
      <div class="profile-view__account">
        <el-upload
          class="profile-view__avatar-upload"
          :show-file-list="false"
          accept="image/jpeg,image/png,image/webp,image/gif"
          :disabled="uploadingAvatar"
          :before-upload="beforeAvatarUpload"
          :http-request="handleAvatarUpload"
        >
          <div
            class="profile-view__avatar"
            :class="{ 'profile-view__avatar--uploading': uploadingAvatar }"
          >
            <img
              v-if="showAvatarImage"
              :src="profile?.avatar || authStore.avatar"
              :alt="displayName"
              class="profile-view__avatar-img"
              @error="onAvatarError"
            />
            <span v-else>{{ avatarLetter }}</span>
            <div class="profile-view__avatar-overlay">
              <span>{{ uploadingAvatar ? t('profile.uploading') : t('profile.changeAvatar') }}</span>
            </div>
          </div>
        </el-upload>
        <div class="profile-view__account-info">
          <span class="profile-view__username">{{ displayName }}</span>
          <span v-if="profile?.userId" class="profile-view__user-id">
            {{ t('profile.userId', { id: profile.userId }) }}
          </span>
          <span class="profile-view__avatar-tip">{{ t('profile.avatarTip') }}</span>
        </div>
      </div>
    </div>

    <div class="profile-view__section">
      <h3>{{ t('profile.changePassword') }}</h3>
      <p class="profile-view__hint">{{ t('profile.passwordHint') }}</p>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="profile-view__form"
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

        <el-button type="primary" size="large" :loading="saving" @click="handleSubmit">
          {{ t('profile.savePassword') }}
        </el-button>
      </el-form>
    </div>

    <div class="profile-view__section">
      <h3>{{ t('profile.session') }}</h3>
      <p class="profile-view__hint">{{ t('profile.logoutHint') }}</p>
      <el-button size="large" :loading="loggingOut" @click="handleLogout">
        {{ t('profile.logout') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadRequestOptions } from 'element-plus'
import { changePasswordApi, getCurrentUserApi, uploadAvatarApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useAutoLockStore } from '@/stores/autoLock'
import { useI18n } from '@/composables/useI18n'
import type { UserProfile } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const autoLockStore = useAutoLockStore()
const { t } = useI18n()

const profile = ref<UserProfile | null>(null)
const loadingProfile = ref(false)
const saving = ref(false)
const loggingOut = ref(false)
const uploadingAvatar = ref(false)
const avatarLoadFailed = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const displayName = computed(() => profile.value?.username || authStore.username)

const avatarLetter = computed(() => displayName.value.charAt(0).toUpperCase() || 'B')

const showAvatarImage = computed(() => {
  const avatar = profile.value?.avatar || authStore.avatar
  return !!avatar && !avatarLoadFailed.value
})

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

async function loadProfile(): Promise<void> {
  loadingProfile.value = true
  avatarLoadFailed.value = false
  try {
    profile.value = await getCurrentUserApi()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : t('profile.loadFailed'))
  } finally {
    loadingProfile.value = false
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
  if (loggingOut.value) return

  try {
    await ElMessageBox.confirm(t('profile.logoutConfirmBody'), t('profile.logoutConfirmTitle'), {
      confirmButtonText: t('profile.logoutConfirmBtn'),
      cancelButtonText: t('msg.cancel'),
      type: 'warning'
    })
  } catch {
    return
  }

  loggingOut.value = true
  try {
    autoLockStore.stop()
    await authStore.logout()
    router.push({ name: 'Login' })
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : t('profile.logoutFailed'))
  } finally {
    loggingOut.value = false
  }
}

onMounted(() => {
  void loadProfile()
})
</script>

<style scoped lang="scss">
.profile-view {
  max-width: 720px;

  &__header {
    margin-bottom: $spacing-xl;

    h1 {
      font-size: $font-size-2xl;
      font-weight: 700;
      color: $color-text-primary;
      margin-bottom: $spacing-xs;
    }

    p {
      color: $color-text-secondary;
    }
  }

  &__section {
    @include card;
    padding: $spacing-lg;
    margin-bottom: $spacing-lg;

    h3 {
      font-size: $font-size-sm;
      font-weight: 600;
      color: $color-text-muted;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: $spacing-md;
    }
  }

  &__account {
    display: flex;
    align-items: center;
    gap: $spacing-lg;
    padding: $spacing-sm 0;
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

      .profile-view__avatar-overlay {
        opacity: 1;
      }
    }

    &--uploading {
      pointer-events: none;

      .profile-view__avatar-overlay {
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

  &__username {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-text-primary;
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
    margin: 0 0 $spacing-lg;
    font-size: $font-size-sm;
    color: $color-text-muted;
    line-height: 1.5;
  }

  &__form {
    max-width: 420px;

    .el-button {
      width: 100%;
      margin-top: $spacing-sm;
    }
  }
}
</style>
