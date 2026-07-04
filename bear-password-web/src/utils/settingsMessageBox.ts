import { ElMessageBox, type ElMessageBoxOptions, type MessageBoxData } from 'element-plus'
import { Z_INDEX_SETTINGS_OVERLAY } from '@/constants/zIndex'

type MessageBoxContent = ElMessageBoxOptions['message']
type MessageBoxTitle = ElMessageBoxOptions['title']

export function settingsMessageBoxConfirm(
  message: MessageBoxContent,
  title: MessageBoxTitle,
  options?: ElMessageBoxOptions
): Promise<MessageBoxData> {
  return ElMessageBox.confirm(message, title, {
    ...options,
    zIndex: Z_INDEX_SETTINGS_OVERLAY,
    appendTo: document.body
  })
}
