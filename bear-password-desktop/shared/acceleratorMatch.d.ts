/** 快捷键匹配（主进程 / 渲染进程共用） */
export interface ShortcutKeyInput {
    type?: string;
    alt: boolean;
    shift: boolean;
    control: boolean;
    meta: boolean;
    key?: string;
    code?: string;
}
export declare const DEFAULT_SHORTCUT_BINDINGS: {
    readonly open: "Alt+B";
    readonly lock: "Alt+L";
};
/** 判断按键事件是否匹配 Electron Accelerator */
export declare function matchAccelerator(input: ShortcutKeyInput, accelerator: string): boolean;
export declare function keyboardEventToShortcutInput(event: KeyboardEvent): ShortcutKeyInput;
/** 规范化 Accelerator 字符串，便于注册与匹配 */
export declare function normalizeAcceleratorString(accelerator: string): string;
/** 检测是否为录制时产生的无效 accelerator（如 Alt+特殊符号） */
export declare function isBrokenAccelerator(accelerator: string | null | undefined): boolean;
