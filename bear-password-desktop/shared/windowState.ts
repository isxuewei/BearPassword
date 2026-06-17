/** 主窗口几何状态（位置、尺寸、是否最大化） */
export interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
  isMaximized: boolean
}

export function getDefaultWindowState(defaultWidth: number, defaultHeight: number): WindowState {
  return {
    width: defaultWidth,
    height: defaultHeight,
    isMaximized: false
  }
}

export function normalizeWindowState(
  raw: Partial<WindowState> | null | undefined,
  minWidth: number,
  minHeight: number,
  defaultWidth: number = minWidth,
  defaultHeight: number = minHeight
): WindowState {
  const fallback = getDefaultWindowState(defaultWidth, defaultHeight)
  const width = Number(raw?.width)
  const height = Number(raw?.height)
  const x = raw?.x === undefined ? undefined : Number(raw.x)
  const y = raw?.y === undefined ? undefined : Number(raw.y)

  return {
    x: x !== undefined && Number.isFinite(x) ? Math.round(x) : undefined,
    y: y !== undefined && Number.isFinite(y) ? Math.round(y) : undefined,
    width: Number.isFinite(width) && width >= minWidth ? Math.round(width) : fallback.width,
    height: Number.isFinite(height) && height >= minHeight ? Math.round(height) : fallback.height,
    isMaximized: raw?.isMaximized === true
  }
}
