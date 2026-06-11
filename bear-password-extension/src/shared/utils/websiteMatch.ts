/** 解析结果，用于主机 + 端口精确匹配 */
export interface ParsedMatchUrl {
  hostname: string
  port: number
  /** 条目或页面是否显式写了端口 */
  explicitPort: boolean
  protocol: 'http:' | 'https:' | 'unknown'
}

const DEFAULT_PORTS: Record<string, number> = {
  'http:': 80,
  'https:': 443
}

function isIpv4(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
}

/** 解析 URL / 主机字符串，提取 hostname 与端口 */
export function parseUrlForMatch(raw: string): ParsedMatchUrl | null {
  const trimmed = raw.trim().toLowerCase()
  if (!trimmed) return null

  if (trimmed.startsWith('*.')) {
    return {
      hostname: trimmed,
      port: 443,
      explicitPort: false,
      protocol: 'https:'
    }
  }

  const hostPortOnly = /^([^/:#]+):(\d+)$/.exec(trimmed)
  if (hostPortOnly && !/^https?:\/\//i.test(trimmed)) {
    return {
      hostname: hostPortOnly[1],
      port: Number(hostPortOnly[2]),
      explicitPort: true,
      protocol: 'http:'
    }
  }

  let urlString = trimmed
  if (!/^https?:\/\//i.test(trimmed)) {
    // 裸 IP 默认按 http 解析，避免内网 http 服务被当成 443
    const hostPart = trimmed.split('/')[0]
    const scheme = isIpv4(hostPart.split(':')[0]) ? 'http' : 'https'
    urlString = `${scheme}://${trimmed}`
  }

  try {
    const url = new URL(urlString)
    const explicitPort = url.port !== ''
    const port = explicitPort ? Number(url.port) : (DEFAULT_PORTS[url.protocol] ?? 80)
    return {
      hostname: url.hostname.toLowerCase(),
      port,
      explicitPort,
      protocol: url.protocol as 'http:' | 'https:'
    }
  } catch {
    const hostOnly = trimmed.replace(/^https?:\/\//, '').split('/')[0]
    const [host, portPart] = hostOnly.split(':')
    if (!host) return null

    if (portPart && /^\d+$/.test(portPart)) {
      return {
        hostname: host,
        port: Number(portPart),
        explicitPort: true,
        protocol: 'http:'
      }
    }

    return {
      hostname: host,
      port: 0,
      explicitPort: false,
      protocol: 'unknown'
    }
  }
}

function hostnamesMatch(entryHost: string, pageHost: string): boolean {
  if (entryHost.startsWith('*.')) {
    const base = entryHost.slice(2)
    return pageHost === base || pageHost.endsWith(`.${base}`)
  }
  return pageHost === entryHost || pageHost.endsWith(`.${entryHost}`)
}

function portsMatch(entry: ParsedMatchUrl, page: ParsedMatchUrl): boolean {
  // 条目显式写了端口 → 必须与当前页面端口一致
  if (entry.explicitPort) {
    return entry.port === page.port
  }

  // 条目未写端口 → 仅匹配标准端口（http:80 / https:443）
  const defaultPort = DEFAULT_PORTS[page.protocol] ?? 80
  return page.port === defaultPort
}

/** 判断网站条目是否匹配当前页面（主机 + 端口） */
export function websiteMatchesPage(website: string, pageUrl: string): boolean {
  const page = parseUrlForMatch(pageUrl)
  if (!page) return false

  const entry = parseUrlForMatch(website)
  if (!entry) return false

  if (!hostnamesMatch(entry.hostname, page.hostname)) return false
  return portsMatch(entry, page)
}

export function entryMatchesPage(websites: string[], pageUrl: string): boolean {
  if (!websites.length) return false
  return websites.some((site) => websiteMatchesPage(site, pageUrl))
}

/** 从页面 URL 提取用于后端 keyword 查询的主机（含非标准端口） */
export function getUrlSearchKeyword(pageUrl: string): string {
  return getPageHostLabel(pageUrl)
}

/** 当前页面的主机展示（含非标准端口） */
export function getPageHostLabel(pageUrl: string): string {
  const parsed = parseUrlForMatch(pageUrl)
  if (!parsed) return ''

  const defaultPort = DEFAULT_PORTS[parsed.protocol] ?? 80
  if (parsed.explicitPort || parsed.port !== defaultPort) {
    return `${parsed.hostname}:${parsed.port}`
  }
  return parsed.hostname
}

/** @deprecated 使用 getPageHostLabel */
export function getPageHostname(pageUrl: string): string {
  return getPageHostLabel(pageUrl)
}
