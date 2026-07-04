/** 快捷键匹配（主进程 / 渲染进程共用） */
export interface ShortcutKeyInput {
  type?: string
  alt: boolean
  shift: boolean
  control: boolean
  meta: boolean
  key?: string
  code?: string
}

export const DEFAULT_SHORTCUT_BINDINGS = {
  open: 'Alt+B',
  lock: 'Alt+L'
} as const

/** 判断按键事件是否匹配 Electron Accelerator */
export function matchAccelerator(input: ShortcutKeyInput, accelerator: string): boolean {
  if (input.type && input.type !== 'keyDown') return false

  const parts = accelerator.split('+').filter(Boolean)
  if (parts.length < 2) return false

  const keyToken = parts[parts.length - 1]
  const mods = parts.slice(0, -1)

  const wantCmdOrCtrl = mods.includes('CommandOrControl')
  const wantCmd = mods.includes('Command')
  const wantCtrl = mods.includes('Control')
  const wantAlt = mods.includes('Alt') || mods.includes('Option')
  const wantShift = mods.includes('Shift')

  const hasCmdOrCtrl = input.meta || input.control

  if (wantCmdOrCtrl && !hasCmdOrCtrl) return false
  if (!wantCmdOrCtrl && wantCmd && !input.meta) return false
  if (!wantCmdOrCtrl && wantCtrl && !input.control) return false
  if (wantAlt !== input.alt) return false
  if (wantShift !== input.shift) return false

  if (extraModifiers(input, { wantCmdOrCtrl, wantCmd, wantCtrl, wantAlt, wantShift })) {
    return false
  }

  return matchKeyToken(input, keyToken)
}

function extraModifiers(
  input: ShortcutKeyInput,
  wanted: {
    wantCmdOrCtrl: boolean
    wantCmd: boolean
    wantCtrl: boolean
    wantAlt: boolean
    wantShift: boolean
  }
): boolean {
  if (!wanted.wantCmdOrCtrl && !wanted.wantCmd && input.meta) return true
  if (!wanted.wantCmdOrCtrl && !wanted.wantCtrl && input.control) return true
  if (!wanted.wantAlt && input.alt) return true
  if (!wanted.wantShift && input.shift) return true
  return false
}

function matchKeyToken(input: ShortcutKeyInput, keyToken: string): boolean {
  if (/^F\d{1,2}$/i.test(keyToken)) {
    return input.key?.toUpperCase() === keyToken.toUpperCase()
  }

  if (keyToken.length === 1 && /[A-Z0-9]/i.test(keyToken)) {
    const upper = keyToken.toUpperCase()
    if (input.code === `Key${upper}` || input.code === `Digit${upper}`) return true
    if (input.key?.toUpperCase() === upper) return true
    return false
  }

  const specialCodes: Record<string, string[]> = {
    Space: ['Space'],
    Esc: ['Escape'],
    Escape: ['Escape'],
    Enter: ['Enter'],
    Tab: ['Tab'],
    Backspace: ['Backspace'],
    Delete: ['Delete']
  }

  const codes = specialCodes[keyToken]
  if (codes) return codes.includes(input.code ?? '')

  return input.key === keyToken || input.code === keyToken
}

export function keyboardEventToShortcutInput(event: KeyboardEvent): ShortcutKeyInput {
  return {
    type: 'keyDown',
    alt: event.altKey,
    shift: event.shiftKey,
    control: event.ctrlKey,
    meta: event.metaKey,
    key: event.key,
    code: event.code
  }
}

const MODIFIER_ORDER = ['CommandOrControl', 'Command', 'Control', 'Alt', 'Option', 'Shift']

/** 规范化 Accelerator 字符串，便于注册与匹配 */
export function normalizeAcceleratorString(accelerator: string): string {
  const parts = accelerator.split('+').filter(Boolean)
  if (parts.length < 2) return accelerator

  const keyToken = parts[parts.length - 1]
  const mods = parts.slice(0, -1).map((part) => (part === 'Option' ? 'Alt' : part))

  const uniqueMods: string[] = []
  for (const mod of MODIFIER_ORDER) {
    if (mods.includes(mod) && !uniqueMods.includes(mod === 'Option' ? 'Alt' : mod)) {
      if (mod === 'Option') {
        if (!uniqueMods.includes('Alt')) uniqueMods.push('Alt')
      } else {
        uniqueMods.push(mod)
      }
    }
  }

  return [...uniqueMods, keyToken].join('+')
}

/** 检测是否为录制时产生的无效 accelerator（如 Alt+特殊符号） */
export function isBrokenAccelerator(accelerator: string | null | undefined): boolean {
  if (!accelerator) return false
  const parts = accelerator.split('+').filter(Boolean)
  if (parts.length < 2) return true
  const keyToken = parts[parts.length - 1]
  if (/^F\d{1,2}$/i.test(keyToken)) return false
  if (keyToken.length === 1 && /[A-Z0-9]/i.test(keyToken)) return false
  return !['Space', 'Esc', 'Escape', 'Enter', 'Tab', 'Backspace', 'Delete'].includes(keyToken)
}
