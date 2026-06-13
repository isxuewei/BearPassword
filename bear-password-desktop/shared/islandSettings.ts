/** 顶部灵动岛配置 */
export interface IslandSettings {
  enabled: boolean
}

export const DEFAULT_ISLAND_SETTINGS: IslandSettings = {
  enabled: true
}

export function normalizeIslandSettings(raw: Partial<IslandSettings> | null | undefined): IslandSettings {
  return {
    enabled: raw?.enabled !== false
  }
}
