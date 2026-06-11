import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  DEFAULT_SHORTCUT_BINDINGS,
  isBrokenAccelerator
} from '../../shared/acceleratorMatch'

export interface ShortcutBindings {
  open: string | null
  lock: string | null
}

const LEGACY_DEFAULTS: Record<string, string> = {
  'CommandOrControl+Shift+B': DEFAULT_SHORTCUT_BINDINGS.open,
  'CommandOrControl+Shift+L': DEFAULT_SHORTCUT_BINDINGS.lock
}

function normalizeBinding(value: unknown, fallback: string | null): string | null {
  if (value === null) return null
  if (typeof value !== 'string' || !value.trim()) return fallback

  const normalized = LEGACY_DEFAULTS[value] ?? value
  if (isBrokenAccelerator(normalized)) return fallback
  return normalized
}

export function loadShortcutBindings(): ShortcutBindings {
  const fallback: ShortcutBindings = { ...DEFAULT_SHORTCUT_BINDINGS }
  const filePath = join(app.getPath('userData'), 'shortcuts.json')

  if (!existsSync(filePath)) return fallback

  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as Partial<ShortcutBindings>
    return {
      open: normalizeBinding(raw.open, fallback.open),
      lock: normalizeBinding(raw.lock, fallback.lock)
    }
  } catch {
    return fallback
  }
}

export function saveShortcutBindings(bindings: ShortcutBindings): void {
  try {
    const filePath = join(app.getPath('userData'), 'shortcuts.json')
    writeFileSync(filePath, JSON.stringify(bindings, null, 2), 'utf-8')
  } catch {
    // 写入失败不影响内存中的快捷键生效
  }
}
