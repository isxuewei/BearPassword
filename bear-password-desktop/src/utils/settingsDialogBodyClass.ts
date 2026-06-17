const BODY_CLASS = 'settings-dialog-open'

export function setSettingsDialogBodyClass(open: boolean): void {
  document.body.classList.toggle(BODY_CLASS, open)
}

export function clearSettingsDialogBodyClass(): void {
  document.body.classList.remove(BODY_CLASS)
}
