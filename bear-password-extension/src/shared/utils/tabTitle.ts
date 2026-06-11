/** 获取当前浏览器页签标题（优先 tabs API，避免 iframe 内 document.title 不准） */
export async function getBrowserTabTitle(fallback = ''): Promise<string> {
  try {
    const tab = await chrome.tabs.getCurrent()
    const tabTitle = tab?.title?.trim()
    if (tabTitle) return tabTitle
  } catch {
    // 忽略 tabs API 不可用的情况
  }

  const pageTitle = document.title.trim()
  if (pageTitle) return pageTitle

  return fallback
}
