export type DesktopUpdatePhase =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'error'

export interface DesktopUpdateStatus {
  supported: boolean
  phase: DesktopUpdatePhase
  version: string | null
  percent: number
  message: string | null
}

export const API_CONTEXT_PATH = '/api'

export function buildDesktopUpdateFeedUrl(serverOrigin: string, platform: NodeJS.Platform): string {
  const sub = platform === 'darwin' ? 'mac' : 'win'
  return `${serverOrigin.replace(/\/+$/, '')}${API_CONTEXT_PATH}/desktop-updates/${sub}`
}
