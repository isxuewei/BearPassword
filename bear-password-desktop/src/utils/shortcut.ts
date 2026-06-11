/**
 * 快捷键工具：键盘事件 ↔ Electron Accelerator 转换与展示
 */

const MODIFIER_ONLY_KEYS = new Set([
  'Control',
  'Shift',
  'Alt',
  'Meta',
  'Command',
  'OS',
  'AltGraph'
])

const KEY_ALIASES: Record<string, string> = {
  ' ': 'Space',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Escape: 'Esc',
  Enter: 'Enter',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Tab: 'Tab',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Backquote: '`'
}

/** 将键盘事件转为 Electron Accelerator 字符串 */
export function keyboardEventToAccelerator(event: KeyboardEvent): string | null {
  if (MODIFIER_ONLY_KEYS.has(event.key)) return null

  const parts: string[] = []
  if (event.metaKey || event.ctrlKey) parts.push('CommandOrControl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')

  const key = normalizeAcceleratorKey(event)
  if (!key || parts.length === 0) return null

  parts.push(key)
  return parts.join('+')
}

function normalizeAcceleratorKey(event: KeyboardEvent): string | null {
  const { key, code } = event

  if (/^F\d{1,2}$/.test(key)) return key.toUpperCase()
  // Mac Option+字母时 event.key 可能是特殊符号，优先用 code
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Numpad')) return code.slice(6)

  const alias = KEY_ALIASES[key]
  if (alias) return alias

  if (key.length === 1) return key.toUpperCase()

  return null
}

/** 将 Accelerator 格式化为可读文案 */
export function formatAccelerator(
  accelerator: string | null | undefined,
  platform: NodeJS.Platform = 'darwin'
): string {
  if (!accelerator) return '未设置'

  const isMac = platform === 'darwin'
  return accelerator
    .split('+')
    .map((part) => {
      switch (part) {
        case 'CommandOrControl':
          return isMac ? '⌘' : 'Ctrl'
        case 'Command':
          return '⌘'
        case 'Control':
          return isMac ? '⌃' : 'Ctrl'
        case 'Alt':
        case 'Option':
          return isMac ? '⌥' : 'Alt'
        case 'Shift':
          return isMac ? '⇧' : 'Shift'
        default:
          return part
      }
    })
    .join(isMac ? '' : ' + ')
}

/** 校验快捷键是否包含修饰键 */
export function isValidShortcutAccelerator(accelerator: string | null): boolean {
  if (!accelerator) return true
  return /CommandOrControl|Command|Control|Alt|Option|Shift/.test(accelerator)
}
