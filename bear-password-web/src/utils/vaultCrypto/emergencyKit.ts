export interface EmergencyKitPayload {
  version: 2
  username: string
  accountSecretKey: string
  secretKeyFingerprint: string
  createdAt: string
}

export function buildEmergencyKitFileName(username: string): string {
  const safe = username.trim().replace(/[^\w\u4e00-\u9fff-]+/g, '_') || 'user'
  return `BearPassword-Emergency-Kit-${safe}.txt`
}

export function buildEmergencyKitFileContent(payload: EmergencyKitPayload): string {
  return [
    'BearPassword Emergency Kit',
    '================================',
    '',
    '请妥善保管此文件。账户密钥与主密码共同保护您的保险库。',
    '丢失此文件且无其他设备备份时，将无法解密已保存的密码。',
    '',
    `用户名: ${payload.username}`,
    `创建时间: ${payload.createdAt}`,
    `密钥指纹: ${payload.secretKeyFingerprint}`,
    '',
    '账户密钥 (Account Secret Key):',
    payload.accountSecretKey,
    '',
    '--------------------------------',
    'BearPassword - 请勿与他人分享此文件'
  ].join('\n')
}
