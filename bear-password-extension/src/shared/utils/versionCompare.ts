function parseVersionParts(version: string): number[] {
  return version
    .trim()
    .split('.')
    .map((part) => {
      const matched = part.match(/^\d+/)
      return matched ? Number(matched[0]) : 0
    })
}

/** 比较版本号：a > b 返回 1，相等返回 0，a < b 返回 -1 */
export function compareVersion(a: string, b: string): number {
  const partsA = parseVersionParts(a)
  const partsB = parseVersionParts(b)
  const length = Math.max(partsA.length, partsB.length)

  for (let index = 0; index < length; index += 1) {
    const diff = (partsA[index] ?? 0) - (partsB[index] ?? 0)
    if (diff > 0) return 1
    if (diff < 0) return -1
  }

  return 0
}

export function isVersionNewer(candidate: string, current: string): boolean {
  return compareVersion(candidate, current) > 0
}
