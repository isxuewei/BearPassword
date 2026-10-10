/** Dock 栏图标配置 */
export interface DockSettings {
    hidden: boolean;
}
export declare const DEFAULT_DOCK_SETTINGS: DockSettings;
export declare function normalizeDockSettings(raw: Partial<DockSettings> | null | undefined): DockSettings;
