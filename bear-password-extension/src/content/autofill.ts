import type { FillCredential } from '@/shared/types'
import type { DetectedLoginForm, LoginFieldContext } from '@/content/formDetector'
import { detectLoginForms } from '@/content/formDetector'

function setInputValue(input: HTMLInputElement, value: string): void {
  input.focus()
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

export function autofillInContext(
  credential: FillCredential,
  context: LoginFieldContext
): boolean {
  let filled = false
  if (credential.username && context.usernameInput) {
    setInputValue(context.usernameInput, credential.username)
    filled = true
  }
  if (credential.password && context.passwordInput) {
    setInputValue(context.passwordInput, credential.password)
    filled = true
  }
  return filled
}

export function autofillCredential(credential: FillCredential, root: ParentNode = document): boolean {
  const forms = detectLoginForms(root)
  if (!forms.length) return false

  const target = forms[0]
  if (credential.username) {
    setInputValue(target.usernameInput, credential.username)
  }
  if (credential.password) {
    setInputValue(target.passwordInput, credential.password)
  }
  return true
}

export function insertTextAtActiveElement(text: string): boolean {
  const active = document.activeElement
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
    setInputValue(active as HTMLInputElement, text)
    return true
  }
  return false
}

export function getDetectedForms(): DetectedLoginForm[] {
  return detectLoginForms()
}
