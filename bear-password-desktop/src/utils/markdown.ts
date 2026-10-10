import { Marked, type Tokens } from 'marked'

const markdown = new Marked({
  breaks: true,
  gfm: true,
  renderer: {
    html({ text }: Tokens.HTML | Tokens.Tag): string {
      return escapeHtml(text)
    },
    image({ text }: Tokens.Image): string {
      return escapeHtml(text)
    },
    link({ href, title, tokens }: Tokens.Link): string {
      const text = this.parser.parseInline(tokens)
      if (!isSafeLinkHref(href)) return text

      const titleAttr = title ? ` title="${escapeAttribute(title)}"` : ''
      return `<a href="${escapeAttribute(href)}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`
    }
  }
})

function escapeHtml(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

function isSafeLinkHref(href: string): boolean {
  try {
    const parsed = new URL(href.trim())
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/** 将公告 Markdown 安全转为 HTML：不允许原始 HTML 与危险链接协议。 */
export function renderAnnouncementMarkdown(content: string): string {
  return markdown.parse(content, { async: false }) as string
}
