/** 将用户名整理为可用于文件名的片段 */
export function sanitizeFileNameSegment(value: string): string {
  const trimmed = value.trim().replace(/[\\/:*?"<>|]/g, '_')
  return trimmed || 'user'
}

/** 安全密钥备份默认文件名：BearPassword{用户名}安全密钥.txt */
export function buildSecurityKeyBackupFileName(username: string): string {
  return `BearPassword${sanitizeFileNameSegment(username)}安全密钥.txt`
}

export function buildSecurityKeyBackupFileContent(username: string, securityKey: string): string {
  return [
    'BearPassword 安全密钥备份',
    `用户名：${username.trim() || '—'}`,
    '',
    securityKey,
    '',
    '请妥善保管此文件。密钥仅保存在本机，遗失后无法找回。'
  ].join('\n')
}
