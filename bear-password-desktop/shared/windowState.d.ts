/** 主窗口几何状态（位置、尺寸、是否最大化） */
export interface WindowState {
    x?: number;
    y?: number;
    width: number;
    height: number;
    isMaximized: boolean;
}
export declare function getDefaultWindowState(defaultWidth: number, defaultHeight: number): WindowState;
export declare function normalizeWindowState(raw: Partial<WindowState> | null | undefined, minWidth: number, minHeight: number, defaultWidth?: number, defaultHeight?: number): WindowState;
