<template>
  <div class="login-entry-form">
    <!-- 图标 + 标题 -->
    <div class="login-entry-form__hero">
      <div class="login-entry-form__icon" :class="{ 'login-entry-form__icon--server': variant === 'server' }">
        <svg v-if="variant === 'server'" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="6" rx="1.5" stroke="white" stroke-width="1.5"/>
          <rect x="3" y="14" width="18" height="6" rx="1.5" stroke="white" stroke-width="1.5"/>
          <circle cx="7" cy="7" r="1" fill="white"/>
          <circle cx="7" cy="17" r="1" fill="white"/>
          <path d="M11 7H17M11 17H15" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="10" width="16" height="12" rx="2" stroke="white" stroke-width="1.5"/>
          <path d="M8 10V8C8 5.5 10 4 12 4C14 4 16 5.5 16 8V10" stroke="white" stroke-width="1.5"/>
          <circle cx="12" cy="16" r="1.5" fill="white"/>
        </svg>
      </div>
      <input
        v-model="content.title"
        class="login-entry-form__title-input"
        :placeholder="t('entry.form.titlePlaceholder')"
        type="text"
        :maxlength="PASSWORD_TITLE_MAX_LENGTH"
      />
    </div>

    <!-- 用户名 / 密码 -->
    <div class="login-entry-form__card">
      <div class="login-entry-form__row">
        <label class="login-entry-form__block-label">{{ t('entry.form.login.username') }}</label>
        <input
          v-model="content.username"
          class="login-entry-form__input"
          :placeholder="t('entry.form.login.usernamePlaceholder')"
          type="text"
        />
      </div>
      <div class="login-entry-form__divider" />
      <div class="login-entry-form__row login-entry-form__row--password">
        <label class="login-entry-form__block-label">{{ t('entry.form.login.password') }}</label>
        <input
          ref="passwordInputRef"
          v-model="content.password"
          class="login-entry-form__input login-entry-form__input--password"
          :class="{ 'is-masked': !passwordRevealed }"
          type="text"
          :placeholder="t('entry.form.login.passwordPlaceholder')"
          autocomplete="off"
          @mousedown="onPasswordMouseDown"
          @blur="passwordRevealed = false"
        />
      </div>
    </div>

    <!-- 网站列表 / 主机 -->
    <div v-if="variant === 'login'" class="login-entry-form__card login-entry-form__card--soft">
      <div
        v-for="(url, index) in content.websites"
        :key="index"
      >
        <div v-if="index > 0" class="login-entry-form__divider" />
        <div class="login-entry-form__row">
          <label v-if="index === 0" class="login-entry-form__block-label">{{ t('entry.form.login.website') }}</label>
          <div class="login-entry-form__field-wrap">
            <input
              v-model="content.websites[index]"
              class="login-entry-form__input"
              :placeholder="t('entry.form.login.websitePlaceholder')"
              type="url"
            />
            <button
              v-if="content.websites.length > 1"
              type="button"
              class="login-entry-form__remove"
              :aria-label="t('entry.form.removeWebsite')"
              @click="removeWebsite(index)"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.2"/>
                <path d="M5 8H11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div class="login-entry-form__card-footer">
        <button type="button" class="login-entry-form__add-link" @click="addWebsite">
          <span>+</span> {{ t('entry.form.addWebsite') }}
        </button>
      </div>
    </div>

    <div v-else class="login-entry-form__card login-entry-form__card--soft">
      <div class="login-entry-form__row">
        <label class="login-entry-form__block-label">{{ t('entry.form.login.host') }}</label>
        <input
          v-model="content.host"
          class="login-entry-form__input login-entry-form__input--mono"
          :placeholder="t('entry.form.login.hostPlaceholder')"
          type="text"
        />
      </div>
    </div>

    <div class="login-entry-form__card login-entry-form__card--soft login-entry-form__card--extras">
      <ExtraFieldsEditor :fields="content.extraFields" />
    </div>

    <!-- 备注 -->
    <div class="login-entry-form__card login-entry-form__card--soft login-entry-form__card--remark">
      <label class="login-entry-form__block-label">{{ t('entry.form.remark') }}</label>
      <textarea
        :value="remark"
        class="login-entry-form__textarea"
        :placeholder="t('entry.form.remarkPlaceholder')"
        rows="2"
        :maxlength="PASSWORD_REMARK_MAX_LENGTH"
        @input="onRemarkInput"
      />
    </div>

    <!-- 标签 -->
    <div class="login-entry-form__card login-entry-form__card--soft login-entry-form__card--tags">
      <label class="login-entry-form__block-label">{{ t('entry.form.tags') }}</label>
      <TagInput v-model="labelsModel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import TagInput from '@/components/vault/TagInput.vue'
import ExtraFieldsEditor from '@/components/vault/ExtraFieldsEditor.vue'
import { PASSWORD_REMARK_MAX_LENGTH, PASSWORD_TITLE_MAX_LENGTH } from '@/constants/vaultFieldLimits'
import { useI18n } from '@/composables/useI18n'
import type { LoginContent } from '@/types'
import { appendClipboardClearHint, copySensitiveText } from '@/utils/sensitiveClipboard'

const props = withDefaults(
  defineProps<{
    content: LoginContent
    remark: string
    labels: string[]
    variant?: 'login' | 'server'
  }>(),
  {
    variant: 'login'
  }
)

const emit = defineEmits<{
  'update:remark': [value: string]
  'update:labels': [value: string[]]
}>()

const { t } = useI18n()
const passwordRevealed = ref(false)
const passwordInputRef = ref<HTMLInputElement | null>(null)

const labelsModel = computed({
  get: () => props.labels,
  set: (value: string[]) => emit('update:labels', value)
})

function onPasswordMouseDown(event: MouseEvent): void {
  event.preventDefault()
  void revealAndCopyPassword()
}

async function revealAndCopyPassword(): Promise<void> {
  passwordRevealed.value = true
  await nextTick()

  const input = passwordInputRef.value
  if (!input) return

  input.focus()
  const password = props.content.password
  if (!password) return

  input.setSelectionRange(0, password.length)

  const copied = await copyText(password, input)
  if (copied) {
    ElMessage.success({
      message: appendClipboardClearHint(t('entry.msg.passwordCopied'), t),
      duration: 1500
    })
  } else {
    ElMessage.warning({ message: t('entry.msg.copyFailed'), duration: 1500 })
  }
}

async function copyText(text: string, input: HTMLInputElement): Promise<boolean> {
  const copied = await copySensitiveText(text)
  if (copied) return true

  input.setSelectionRange(0, text.length)
  return document.execCommand('copy')
}

function addWebsite(): void {
  props.content.websites.push('')
}

function removeWebsite(index: number): void {
  if (props.content.websites.length <= 1) return
  props.content.websites.splice(index, 1)
}

function onRemarkInput(event: Event): void {
  emit('update:remark', (event.target as HTMLTextAreaElement).value)
}
</script>

<style scoped lang="scss">
.login-entry-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  font-family: $font-family;

  &__hero {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: 0 0 $spacing-xs;
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: $radius-md;
    background: linear-gradient(135deg, #2ec4b6, #1b9aaa);
    box-shadow: 0 4px 12px rgba(46, 196, 182, 0.25);
    @include flex-center;
    flex-shrink: 0;

    &--server {
      background: linear-gradient(135deg, #1b998b, #14746f);
      box-shadow: 0 4px 12px rgba(27, 153, 139, 0.28);
    }
  }

  &__title-input {
    flex: 1;
    border: none;
    background: transparent;
    font-family: $font-family;
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-text-primary;
    outline: none;

    &::placeholder {
      color: $color-text-muted;
      font-weight: 500;
    }
  }

  &__card {
    @include card;
    padding: 0;
    overflow: hidden;
    border-radius: $radius-md;
    background: $color-bg-elevated;

    &--soft {
      background: $color-bg-secondary;
      box-shadow: none;
      border-color: $color-border;
    }

    &--remark,
    &--tags {
      padding: $spacing-sm $spacing-md;
    }

    &--tags {
      position: relative;
      z-index: 2;
      overflow: visible;
    }

    &--extras {
      padding: 0;
      overflow: visible;
    }
  }

  &__extras-header {
    padding: $spacing-xs $spacing-md;
  }

  &__extras {
    border-top: 1px solid $color-border;
  }

  &__extra-item {
    padding: $spacing-xs $spacing-md;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__extra-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-sm;
  }

  &__extra-title {
    flex: 1;
    border: none;
    background: transparent;
    font-family: $font-family;
    font-size: $font-size-sm;
    font-weight: 500;
    color: $color-text-secondary;
    outline: none;
    min-width: 0;

    &::placeholder {
      color: $color-text-muted;
    }
  }

  &__extra-value {
    width: 100%;
    border: none;
    background: transparent;
    resize: none;
    font-family: $font-family;
    font-size: $font-size-md;
    color: $color-text-primary;
    line-height: 1.5;
    outline: none;
    min-height: 28px;
    padding: 0;

    &::placeholder {
      color: $color-text-muted;
    }
  }

  @include vault-entry-form-layout;

  &__divider {
    height: 1px;
    background: $color-border;
    margin: 0 $spacing-md;
  }

  &__input {
    transition: color $transition-fast;

    &--password {
      font-family: $font-family-mono;
      letter-spacing: 0.05em;
      cursor: pointer;

      &.is-masked {
        -webkit-text-security: disc;
        text-security: disc;
      }
    }

    &--mono {
      font-family: $font-family-mono;
      letter-spacing: 0.03em;
    }
  }

  &__row--password {
    cursor: pointer;
  }

  &__remove {
    flex-shrink: 0;
    color: $color-danger;
    opacity: 0.75;
    padding: 4px;
    border-radius: 50%;
    transition: opacity $transition-fast, background $transition-fast;

    &:hover {
      opacity: 1;
      background: rgba(255, 77, 79, 0.08);
    }
  }

  &__add-link {
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

  &__textarea {
    width: 100%;
    border: none;
    background: transparent;
    resize: none;
    font-family: $font-family;
    font-size: $font-size-md;
    color: $color-text-primary;
    line-height: 1.5;
    outline: none;
    min-height: 48px;
    padding: 0;

    &::placeholder {
      color: $color-text-muted;
    }
  }
}
</style>
