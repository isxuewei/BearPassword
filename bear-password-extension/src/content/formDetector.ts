export interface DetectedLoginForm {
  form: HTMLFormElement | null
  usernameInput: HTMLInputElement
  passwordInput: HTMLInputElement
}

export interface LoginFieldContext {
  form: HTMLFormElement | null
  usernameInput: HTMLInputElement | null
  passwordInput: HTMLInputElement | null
  focusedInput: HTMLInputElement
}

const USERNAME_HINTS = ['user', 'login', 'email', 'account', 'name', 'id', 'phone', 'mobile']

function isVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element)
  return style.display !== 'none' && style.visibility !== 'hidden' && element.offsetParent !== null
}

function scoreInput(input: HTMLInputElement, hints: string[]): number {
  let score = 0
  const attrs = [
    input.name,
    input.id,
    input.autocomplete,
    input.placeholder,
    input.getAttribute('aria-label') ?? ''
  ]
    .join(' ')
    .toLowerCase()

  for (const hint of hints) {
    if (attrs.includes(hint)) score += 2
  }
  if (input.type === 'email') score += 3
  if (input.type === 'password') score += 5
  if (input.autocomplete?.includes('username') || input.autocomplete?.includes('email')) score += 4
  if (isVisible(input)) score += 1
  return score
}

function findBestInput(inputs: HTMLInputElement[], hints: string[]): HTMLInputElement | null {
  let best: HTMLInputElement | null = null
  let bestScore = 0
  for (const input of inputs) {
    const score = scoreInput(input, hints)
    if (score > bestScore) {
      bestScore = score
      best = input
    }
  }
  return bestScore > 0 ? best : null
}

export function isUsernameLikeInput(input: HTMLInputElement): boolean {
  if (!isVisible(input)) return false
  if (input.type === 'password' || input.type === 'hidden' || input.type === 'submit' || input.type === 'button') {
    return false
  }
  if (input.type === 'email') return true
  if (input.type === 'text' || input.type === 'tel' || input.type === '') {
    return scoreInput(input, USERNAME_HINTS) > 0
  }
  return false
}

export function isPasswordInput(input: HTMLInputElement): boolean {
  return input.type === 'password' && isVisible(input)
}

export function isLoginRelatedInput(input: HTMLInputElement): boolean {
  return isUsernameLikeInput(input) || isPasswordInput(input)
}

function getScopeInputs(scope: ParentNode): {
  textInputs: HTMLInputElement[]
  passwordInputs: HTMLInputElement[]
} {
  const textInputs = Array.from(
    scope.querySelectorAll<HTMLInputElement>(
      'input:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])'
    )
  ).filter(isUsernameLikeInput)

  const passwordInputs = Array.from(
    scope.querySelectorAll<HTMLInputElement>('input[type="password"]')
  ).filter(isPasswordInput)

  return { textInputs, passwordInputs }
}

export function resolveLoginContext(input: HTMLInputElement): LoginFieldContext | null {
  if (!isLoginRelatedInput(input)) return null

  const form = input.closest('form')
  const scope = form ?? document
  const { textInputs, passwordInputs } = getScopeInputs(scope)

  if (isPasswordInput(input)) {
    const usernameInput = findBestInput(
      textInputs.filter((el) => el !== input),
      USERNAME_HINTS
    )
    return {
      form,
      usernameInput,
      passwordInput: input,
      focusedInput: input
    }
  }

  const passwordInput = passwordInputs.find((el) => el !== input) ?? null
  return {
    form,
    usernameInput: input,
    passwordInput,
    focusedInput: input
  }
}

export function detectLoginForms(root: ParentNode = document): DetectedLoginForm[] {
  const passwordInputs = Array.from(
    root.querySelectorAll<HTMLInputElement>('input[type="password"]')
  ).filter(isPasswordInput)

  const results: DetectedLoginForm[] = []
  const seen = new Set<HTMLInputElement>()

  for (const passwordInput of passwordInputs) {
    if (seen.has(passwordInput)) continue
    seen.add(passwordInput)

    const form = passwordInput.closest('form')
    const scope = form ?? document
    const { textInputs } = getScopeInputs(scope)

    const usernameInput = findBestInput(textInputs, USERNAME_HINTS)
    if (!usernameInput) continue

    results.push({ form, usernameInput, passwordInput })
  }

  return results
}

/** 页面上所有可见的密码输入框 */
export function detectPasswordInputs(root: ParentNode = document): HTMLInputElement[] {
  return Array.from(root.querySelectorAll<HTMLInputElement>('input[type="password"]')).filter(
    isPasswordInput
  )
}

/** 页面上所有可能触发填充的登录相关输入框 */
export function detectLoginInputs(root: ParentNode = document): HTMLInputElement[] {
  const inputs = Array.from(root.querySelectorAll<HTMLInputElement>('input')).filter(isLoginRelatedInput)
  const unique = new Set<HTMLInputElement>()
  for (const input of inputs) {
    unique.add(input)
  }
  return [...unique]
}

export function readFormValues(form: DetectedLoginForm): { username: string; password: string } {
  return {
    username: form.usernameInput.value.trim(),
    password: form.passwordInput.value
  }
}

export function readContextValues(context: LoginFieldContext): { username: string; password: string } {
  return {
    username: context.usernameInput?.value.trim() ?? '',
    password: context.passwordInput?.value ?? ''
  }
}
