import { marked } from 'marked'

marked.setOptions({
  breaks: true,
  gfm: true
})

/** 将 Markdown 转为 HTML（公告内容来自服务端） */
export function renderAnnouncementMarkdown(content: string): string {
  return marked.parse(content, { async: false }) as string
}
