/** 打开设置页的应用内快捷键（Electron Accelerator 格式） */
export const OPEN_SETTINGS_ACCELERATOR = 'Command+,'

/** 设置页展示用的固定应用内快捷键 */
export const IN_APP_SHORTCUT_OPTIONS = [
  {
    labelKey: 'shortcut.inApp.openSettings',
    descriptionKey: 'shortcut.inApp.openSettingsDesc',
    accelerator: OPEN_SETTINGS_ACCELERATOR
  }
] as const
