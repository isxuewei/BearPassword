/** Dock 栏图标配置 */
export interface DockSettings {
  hidden: boolean
}

export const DEFAULT_DOCK_SETTINGS: DockSettings = {
  hidden: false
}

export function normalizeDockSettings(raw: Partial<DockSettings> | null | undefined): DockSettings {
  return {
    hidden: raw?.hidden === true
  }
}
