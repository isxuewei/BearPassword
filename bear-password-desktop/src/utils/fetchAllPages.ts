import type { PageResult } from '@/types'

/** 循环分页拉取全部条目 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<PageResult<T>>,
  pageSize = 50
): Promise<T[]> {
  const all: T[] = []
  let page = 1

  while (true) {
    const data = await fetchPage(page, pageSize)
    all.push(...data.list)
    if (all.length >= data.total || data.list.length === 0) {
      break
    }
    page += 1
  }

  return all
}
