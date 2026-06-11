import type { ThemeTokens } from '@/shared/theme/presets'

const CONTENT_FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"

export function inlinePickerStyles(pickerId: string, tokens: ThemeTokens): string {
  return `
    #${pickerId} {
      position: fixed;
      z-index: 2147483647;
      min-width: 280px;
      max-width: 360px;
      max-height: 320px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: ${tokens.surface};
      border: 1px solid ${tokens.border};
      border-radius: 12px;
      box-shadow: ${tokens.shadowLg};
      font-family: ${CONTENT_FONT_FAMILY};
      color: ${tokens.text};
    }
    #${pickerId} .bear-picker-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid ${tokens.border};
      background: ${tokens.surface2};
      flex-shrink: 0;
    }
    #${pickerId} .bear-picker-logo {
      width: 22px;
      height: 22px;
      border-radius: 6px;
    }
    #${pickerId} .bear-picker-title {
      font-size: 12px;
      font-weight: 600;
      color: ${tokens.primary};
    }
    #${pickerId} .bear-picker-count {
      margin-left: auto;
      font-size: 11px;
      color: ${tokens.textMuted};
      background: ${tokens.badgeBg};
      padding: 2px 8px;
      border-radius: 999px;
    }
    #${pickerId} .bear-picker-list {
      overflow-y: auto;
      flex: 1;
    }
    #${pickerId} .bear-picker-item {
      display: block;
      width: 100%;
      padding: 10px 12px;
      border: none;
      border-bottom: 1px solid ${tokens.border};
      background: transparent;
      color: ${tokens.text};
      text-align: left;
      cursor: pointer;
      transition: background 0.12s ease;
    }
    #${pickerId} .bear-picker-item:hover,
    #${pickerId} .bear-picker-item.bear-active {
      background: ${tokens.surfaceHover};
    }
    #${pickerId} .bear-picker-item-title {
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #${pickerId} .bear-picker-item-user {
      margin-top: 2px;
      font-size: 11px;
      color: ${tokens.textMuted};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #${pickerId} .bear-picker-empty {
      padding: 20px 14px;
      font-size: 12px;
      color: ${tokens.textMuted};
      text-align: center;
      line-height: 1.5;
    }
    #${pickerId} .bear-picker-footer {
      flex-shrink: 0;
      padding: 10px 12px;
      border-top: 1px solid ${tokens.border};
      background: ${tokens.surface2};
    }
    #${pickerId} .bear-picker-quick-hint {
      font-size: 11px;
      color: ${tokens.textMuted};
      margin-bottom: 8px;
      line-height: 1.4;
      text-align: center;
    }
    #${pickerId} .bear-picker-quick-save {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      padding: 8px 12px;
      border: 1px solid ${tokens.borderHover};
      border-radius: 8px;
      background: ${tokens.accentSubtle};
      color: ${tokens.primary};
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
    }
    #${pickerId} .bear-picker-quick-save:hover:not(:disabled) {
      background: ${tokens.surfaceHover};
      border-color: ${tokens.primary};
      box-shadow: ${tokens.shadowSm};
    }
    #${pickerId} .bear-picker-quick-save:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    #${pickerId} .bear-picker-quick-hint--success {
      color: ${tokens.primary};
      font-weight: 600;
    }
    #${pickerId} .bear-picker-quick-save--success {
      background: ${tokens.primary};
      border-color: ${tokens.primary};
      color: #fff;
      opacity: 1;
    }
  `
}

export function saveBannerStyles(bannerId: string, tokens: ThemeTokens): string {
  return `
    #${bannerId} {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483646;
      width: 320px;
      padding: 16px;
      border-radius: 12px;
      background: ${tokens.surface};
      color: ${tokens.text};
      font-family: ${CONTENT_FONT_FAMILY};
      font-size: 13px;
      box-shadow: ${tokens.shadowLg};
      border: 1px solid ${tokens.border};
    }
    #${bannerId} .bear-title {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 8px;
      color: ${tokens.primary};
    }
    #${bannerId} .bear-desc {
      color: ${tokens.textSecondary};
      margin-bottom: 12px;
      line-height: 1.4;
    }
    #${bannerId} .bear-actions {
      display: flex;
      gap: 8px;
    }
    #${bannerId} button {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: background 0.15s ease, box-shadow 0.15s ease;
    }
    #${bannerId} .bear-save {
      background: ${tokens.primary};
      color: #fff;
    }
    #${bannerId} .bear-save:hover {
      background: ${tokens.primaryHover};
      box-shadow: 0 0 16px ${tokens.accentGlow};
    }
    #${bannerId} .bear-dismiss {
      background: ${tokens.surface2};
      color: ${tokens.textSecondary};
      border: 1px solid ${tokens.border};
    }
    #${bannerId} .bear-dismiss:hover {
      background: ${tokens.surfaceHover};
    }
  `
}
