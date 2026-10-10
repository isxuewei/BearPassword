/** 状态栏图标点击行为 */
export type TrayClickAction = 'vault' | 'favorites' | 'recent' | 'settings';
/** 状态栏图标配置 */
export interface TraySettings {
    enabled: boolean;
    clickAction: TrayClickAction;
}
export declare const DEFAULT_TRAY_SETTINGS: TraySettings;
export declare const TRAY_CLICK_ACTIONS: TrayClickAction[];
export declare function normalizeTrayClickAction(raw: unknown): TrayClickAction;
export declare function normalizeTraySettings(raw: Partial<TraySettings> | null | undefined): TraySettings;
