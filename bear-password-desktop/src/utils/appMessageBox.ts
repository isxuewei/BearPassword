import { ElMessageBox, type ElMessageBoxOptions, type MessageBoxData } from 'element-plus'
import { Z_INDEX_TOAST } from '@/constants/zIndex'

type MessageBoxContent = ElMessageBoxOptions['message']
type MessageBoxTitle = ElMessageBoxOptions['title']

export function appMessageBoxConfirm(
  message: MessageBoxContent,
  title: MessageBoxTitle,
  options?: ElMessageBoxOptions
): Promise<MessageBoxData> {
  return ElMessageBox.confirm(message, title, {
    ...options,
    zIndex: Z_INDEX_TOAST,
    appendTo: document.body
  })
}
