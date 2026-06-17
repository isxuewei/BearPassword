export type SettingsDialogSection =
  | 'account'
  | 'general'
  | 'security'
  | 'appearance'
  | 'shortcuts'
  | 'about'

export type SettingsContentSection = Exclude<SettingsDialogSection, 'account'>
