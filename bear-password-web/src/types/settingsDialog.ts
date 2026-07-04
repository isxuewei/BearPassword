export type SettingsDialogSection =
  | 'account'
  | 'security'
  | 'appearance'
  | 'about'

export type SettingsContentSection = Exclude<SettingsDialogSection, 'account'>
