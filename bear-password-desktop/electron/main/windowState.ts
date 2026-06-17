import { BrowserWindow, screen } from 'electron'
import {
  normalizeWindowState,
  type WindowState
} from '../../shared/windowState'
import { loadWindowState, saveWindowState } from './windowStateConfig'

const SAVE_DEBOUNCE_MS = 300

let cachedWindowState: WindowState | null = null
let cachedDefaultWidth: number | undefined
let cachedDefaultHeight: number | undefined

function resolveDefaultSize(minWidth: number, minHeight: number): { width: number; height: number } {
  return {
    width: cachedDefaultWidth ?? minWidth,
    height: cachedDefaultHeight ?? minHeight
  }
}
let saveStateTimer: ReturnType<typeof setTimeout> | null = null

function clampWindowState(state: WindowState, minWidth: number, minHeight: number): WindowState {
  const normalized = normalizeWindowState(state, minWidth, minHeight)
  const width = normalized.width
  const height = normalized.height

  if (normalized.x === undefined || normalized.y === undefined) {
    return normalized
  }

  const rect = { x: normalized.x, y: normalized.y, width, height }
  const display = screen.getDisplayMatching(rect)
  const { workArea } = display

  let x = normalized.x
  let y = normalized.y
  const minVisible = 40

  if (x + width < workArea.x + minVisible) {
    x = workArea.x
  }
  if (y + height < workArea.y + minVisible) {
    y = workArea.y
  }
  if (x > workArea.x + workArea.width - minVisible) {
    x = workArea.x + workArea.width - width
  }
  if (y > workArea.y + workArea.height - minVisible) {
    y = workArea.y + workArea.height - height
  }

  return { ...normalized, x, y }
}

export function getCachedWindowState(minWidth: number, minHeight: number): WindowState {
  const { width, height } = resolveDefaultSize(minWidth, minHeight)
  return cachedWindowState ?? loadWindowState(minWidth, minHeight, width, height)
}

export function captureWindowState(win: BrowserWindow, minWidth: number, minHeight: number): WindowState {
  const normalBounds = win.getNormalBounds()
  return normalizeWindowState(
    {
      x: normalBounds.x,
      y: normalBounds.y,
      width: normalBounds.width,
      height: normalBounds.height,
      isMaximized: win.isMaximized()
    },
    minWidth,
    minHeight
  )
}

export function persistMainWindowState(
  win: BrowserWindow | null,
  minWidth: number,
  minHeight: number
): void {
  if (!win || win.isDestroyed()) return

  cachedWindowState = captureWindowState(win, minWidth, minHeight)
  saveWindowState(cachedWindowState)
}

function schedulePersistMainWindowState(
  win: BrowserWindow,
  minWidth: number,
  minHeight: number
): void {
  if (saveStateTimer) clearTimeout(saveStateTimer)
  saveStateTimer = setTimeout(() => {
    saveStateTimer = null
    persistMainWindowState(win, minWidth, minHeight)
  }, SAVE_DEBOUNCE_MS)
}

export function applyWindowState(
  win: BrowserWindow,
  state: WindowState,
  minWidth: number,
  minHeight: number
): void {
  const next = clampWindowState(state, minWidth, minHeight)

  if (next.isMaximized) {
    if (!win.isMaximized()) {
      if (next.x !== undefined && next.y !== undefined) {
        win.setBounds({ x: next.x, y: next.y, width: next.width, height: next.height })
      }
      win.maximize()
    }
    return
  }

  if (win.isMaximized()) {
    win.unmaximize()
  }

  win.setBounds({
    ...(next.x !== undefined ? { x: next.x } : {}),
    ...(next.y !== undefined ? { y: next.y } : {}),
    width: next.width,
    height: next.height
  })
}

export function attachMainWindowStateListeners(
  win: BrowserWindow,
  minWidth: number,
  minHeight: number
): void {
  const scheduleSave = (): void => schedulePersistMainWindowState(win, minWidth, minHeight)

  win.on('resize', scheduleSave)
  win.on('move', scheduleSave)
  win.on('maximize', () => persistMainWindowState(win, minWidth, minHeight))
  win.on('unmaximize', () => persistMainWindowState(win, minWidth, minHeight))
  win.on('close', () => persistMainWindowState(win, minWidth, minHeight))
}

export function seedCachedWindowState(
  minWidth: number,
  minHeight: number,
  defaultWidth: number,
  defaultHeight: number
): WindowState {
  cachedDefaultWidth = defaultWidth
  cachedDefaultHeight = defaultHeight
  cachedWindowState = loadWindowState(minWidth, minHeight, defaultWidth, defaultHeight)
  return cachedWindowState
}

export function flushPendingWindowStateSave(
  win: BrowserWindow | null,
  minWidth: number,
  minHeight: number
): void {
  if (saveStateTimer) {
    clearTimeout(saveStateTimer)
    saveStateTimer = null
  }
  persistMainWindowState(win, minWidth, minHeight)
}
