/** 顶部灵动岛配置 */
export interface IslandSettings {
    enabled: boolean;
}
export declare const DEFAULT_ISLAND_SETTINGS: IslandSettings;
export declare function normalizeIslandSettings(raw: Partial<IslandSettings> | null | undefined): IslandSettings;
