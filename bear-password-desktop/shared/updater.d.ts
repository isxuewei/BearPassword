export type DesktopUpdatePhase = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error';
export interface DesktopUpdateStatus {
    supported: boolean;
    phase: DesktopUpdatePhase;
    version: string | null;
    percent: number;
    message: string | null;
}
export declare const API_CONTEXT_PATH = "/api";
export declare function buildDesktopUpdateFeedUrl(serverOrigin: string, platform: NodeJS.Platform): string;
