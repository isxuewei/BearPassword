function resolveDocument(root: ParentNode): Document {
  return root instanceof Document ? root : (root as Node & { ownerDocument?: Document }).ownerDocument ?? document
}

function copyViaExecCommand(text: string, root: ParentNode): boolean {
  const doc = resolveDocument(root)
  const textarea = doc.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.width = '2em'
  textarea.style.height = '2em'
  textarea.style.padding = '0'
  textarea.style.border = 'none'
  textarea.style.outline = 'none'
  textarea.style.boxShadow = 'none'
  textarea.style.background = 'transparent'
  doc.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, text.length)

  let copied = false
  try {
    copied = doc.execCommand('copy')
  } catch {
    copied = false
  }

  doc.body.removeChild(textarea)
  return copied
}

/** 在用户点击回调中同步复制，HTTP 页面也适用 */
export function copyTextToClipboardSync(text: string, root: ParentNode = document): boolean {
  const normalized = text.trim()
  if (!normalized) return false
  return copyViaExecCommand(normalized, root)
}

export async function copyTextToClipboard(text: string, root: ParentNode = document): Promise<boolean> {
  const normalized = text.trim()
  if (!normalized) return false

  if (copyViaExecCommand(normalized, root)) return true

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(normalized)
      return true
    }
  } catch {
    // ignore
  }

  return false
}
