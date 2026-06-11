import { app } from 'electron'

export interface LaunchAtLoginSettings {
  available: boolean
  enabled: boolean
}

/** 读取开机自启状态（仅正式打包版可用） */
export function getLaunchAtLoginSettings(): LaunchAtLoginSettings {
  if (!app.isPackaged) {
    return { available: false, enabled: false }
  }

  return {
    available: true,
    enabled: app.getLoginItemSettings().openAtLogin
  }
}

/** 设置开机自启 */
export function setLaunchAtLogin(enabled: boolean): LaunchAtLoginSettings {
  if (!app.isPackaged) {
    return { available: false, enabled: false }
  }

  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: false
  })

  return getLaunchAtLoginSettings()
}
