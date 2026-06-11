import { BrowserWindow, globalShortcut, type WebContents } from 'electron'
import {
  matchAccelerator,
  normalizeAcceleratorString,
  type ShortcutKeyInput
} from '../../shared/acceleratorMatch'
import { saveShortcutBindings, type ShortcutBindings } from './shortcutConfig'

type ShortcutActionId = keyof ShortcutBindings

const registered: ShortcutBindings = {
  open: null,
  lock: null
}

let currentBindings: ShortcutBindings = { open: null, lock: null }
let showMainWindowHandler: (() => void) | null = null

const attachedWebContents = new WeakSet<WebContents>()

function normalizeBindings(bindings: ShortcutBindings): ShortcutBindings {
  return {
    open: bindings.open ? normalizeAcceleratorString(bindings.open) : null,
    lock: bindings.lock ? normalizeAcceleratorString(bindings.lock) : null
  }
}

function unregisterAccelerator(accelerator: string | null): void {
  if (!accelerator) return
  if (globalShortcut.isRegistered(accelerator)) {
    globalShortcut.unregister(accelerator)
  }
}

function unregisterAllKnownAccelerators(previous: ShortcutBindings): void {
  const candidates = new Set<string>()
  ;([previous.open, previous.lock, registered.open, registered.lock] as (string | null)[]).forEach(
    (accelerator) => {
      if (accelerator) candidates.add(accelerator)
    }
  )
  candidates.forEach(unregisterAccelerator)
  registered.open = null
  registered.lock = null
}

function focusMainWindowWithLockState(): void {
  showMainWindowHandler?.()
}

function notifyLock(): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send('shortcut:lock')
    }
  })
}

function handleFocusedShortcut(input: ShortcutKeyInput): boolean {
  if (currentBindings.open && matchAccelerator(input, currentBindings.open)) {
    focusMainWindowWithLockState()
    return true
  }
  if (currentBindings.lock && matchAccelerator(input, currentBindings.lock)) {
    notifyLock()
    return true
  }
  return false
}

function onBeforeInputEvent(event: Electron.Event, input: ShortcutKeyInput): void {
  if (handleFocusedShortcut(input)) {
    event.preventDefault()
  }
}

/** 窗口聚焦时监听快捷键（globalShortcut 仅在失焦时生效） */
export function attachFocusedShortcutListener(win: BrowserWindow): void {
  const { webContents } = win
  if (attachedWebContents.has(webContents)) return

  webContents.on('before-input-event', onBeforeInputEvent)
  attachedWebContents.add(webContents)
}

export type ShortcutRegistrationStatus = {
  open: { enabled: boolean; registered: boolean }
  lock: { enabled: boolean; registered: boolean }
}

function registerGlobalBinding(
  action: ShortcutActionId,
  accelerator: string,
  callback: () => void
): boolean {
  unregisterAccelerator(accelerator)
  if (!globalShortcut.register(accelerator, callback)) return false
  registered[action] = accelerator
  return true
}

/** 注册全局快捷键，返回失败项 */
export function syncGlobalShortcuts(
  bindings: ShortcutBindings,
  showMainWindow: () => void
): { ok: boolean; failed?: Partial<Record<ShortcutActionId, string>>; status: ShortcutRegistrationStatus } {
  const failed: Partial<Record<ShortcutActionId, string>> = {}
  const previousBindings = { ...currentBindings }
  const normalized = normalizeBindings(bindings)

  showMainWindowHandler = showMainWindow
  unregisterAllKnownAccelerators(previousBindings)
  currentBindings = { ...normalized }
  saveShortcutBindings(normalized)

  let openRegistered = false
  let lockRegistered = false

  if (normalized.open) {
    if (registerGlobalBinding('open', normalized.open, focusMainWindowWithLockState)) {
      openRegistered = true
    } else {
      failed.open = '后台快捷键注册失败，可能被其他应用占用'
    }
  }

  if (normalized.lock) {
    if (normalized.open && normalized.open === normalized.lock) {
      failed.lock = '不能与打开快捷键相同'
    } else if (registerGlobalBinding('lock', normalized.lock, notifyLock)) {
      lockRegistered = true
    } else {
      failed.lock = '后台快捷键注册失败，可能被其他应用占用'
    }
  }

  const status: ShortcutRegistrationStatus = {
    open: { enabled: !!normalized.open, registered: normalized.open ? openRegistered : false },
    lock: { enabled: !!normalized.lock, registered: normalized.lock ? lockRegistered : false }
  }

  return {
    ok: true,
    failed: Object.keys(failed).length > 0 ? failed : undefined,
    status
  }
}

export function getShortcutRegistrationStatus(): ShortcutRegistrationStatus {
  return {
    open: {
      enabled: !!currentBindings.open,
      registered: currentBindings.open ? globalShortcut.isRegistered(currentBindings.open) : false
    },
    lock: {
      enabled: !!currentBindings.lock,
      registered: currentBindings.lock ? globalShortcut.isRegistered(currentBindings.lock) : false
    }
  }
}

export function unregisterAllGlobalShortcuts(): void {
  unregisterAllKnownAccelerators(currentBindings)
  currentBindings = { open: null, lock: null }
}
