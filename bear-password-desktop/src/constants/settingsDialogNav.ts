import type { SettingsDialogSection } from '@/types/settingsDialog'

export interface SettingsDialogNavItem {
  id: SettingsDialogSection
  labelKey: string
  icon: string
}

export const SETTINGS_DIALOG_NAV: SettingsDialogNavItem[] = [
  {
    id: 'account',
    labelKey: 'settings.tab.account',
    icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
  },
  {
    id: 'general',
    labelKey: 'settings.general',
    icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M9 1.5V3.5M9 14.5V16.5M1.5 9H3.5M14.5 9H16.5M3.6 3.6L5 5M13 13L14.4 14.4M3.6 14.4L5 13M13 5L14.4 3.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
  },
  {
    id: 'security',
    labelKey: 'settings.security',
    icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="8" width="12" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
  },
  {
    id: 'appearance',
    labelKey: 'settings.appearance',
    icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2C5.5 2 3 5 3 9c0 4.5 2.5 7 6 7 .8 0 1.5-.2 2.1-.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12.5" cy="12.5" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M14.5 10.5l-2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
  },
  {
    id: 'shortcuts',
    labelKey: 'settings.shortcuts',
    icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 8h2M9 8h4M5 11h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
  },
  {
    id: 'about',
    labelKey: 'settings.about',
    icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M9 8v5M9 5.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
  }
]
