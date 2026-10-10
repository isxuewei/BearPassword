/** 离线模式配置 */
export interface OfflineVaultSettings {
    enabled: boolean;
    /** 本地数据目录（绝对路径） */
    dataDir: string;
}
/** 本地存储的密码条目（content 为密文 envelope 或明文对象） */
export interface OfflineVaultStoredEntry {
    id: string;
    passwordType: string;
    content: unknown;
    createTime?: string;
    updateTime?: string;
}
export interface OfflineVaultRelationMeta {
    passwordId: string;
    time?: string;
}
/** 本地 vault 数据快照 */
export interface OfflineVaultSnapshot {
    version: 1;
    nextId: number;
    entries: OfflineVaultStoredEntry[];
    favorites: OfflineVaultRelationMeta[];
    recentVisits: OfflineVaultRelationMeta[];
}
export declare const OFFLINE_VAULT_DATA_FILE = "vault-data.json";
export declare const OFFLINE_VAULT_SETTINGS_FILE = "offline-vault-settings.json";
export declare const DEFAULT_OFFLINE_VAULT_SNAPSHOT: OfflineVaultSnapshot;
export declare function normalizeOfflineVaultSettings(raw: Partial<OfflineVaultSettings> | null | undefined, defaultDataDir: string): OfflineVaultSettings;
export declare function normalizeOfflineVaultSnapshot(raw: unknown): OfflineVaultSnapshot;
/**
 * 合并离线快照：相同 ID 以本地为准，仅补充对方独有的条目与元数据。
 */
export declare function mergeOfflineVaultSnapshots(local: OfflineVaultSnapshot, incoming: OfflineVaultSnapshot): OfflineVaultSnapshot;
