/** 敏感内容复制后自动清空剪贴板的延迟（秒，0 表示不清空） */
export type ClipboardClearSeconds = 0 | 30 | 60 | 90 | 120

export const CLIPBOARD_CLEAR_OPTIONS: ClipboardClearSeconds[] = [30, 60, 90, 120, 0]

export const DEFAULT_CLIPBOARD_CLEAR_SECONDS: ClipboardClearSeconds = 30
