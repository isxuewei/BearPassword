/** 扩展不再持久化独立会话，保留空实现供旧代码兼容 */

export async function clearLegacySessionStorage(): Promise<void> {
  await chrome.storage.local.remove(['bear_extension_session', 'bear_extension_server'])
}
