/** 将 Electron 平台标识映射为服务端系统类型 */
export function resolveSystemType(platform: NodeJS.Platform): string {
  if (platform === 'darwin') return 'MacOS'
  if (platform === 'win32') return 'Windows'
  return platform
}

/** 界面展示用系统名称 */
export function formatSystemLabel(platform: NodeJS.Platform): string {
  return resolveSystemType(platform)
}
