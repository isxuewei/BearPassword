import jsQR from 'jsqr'

function loadImageDataFromUrl(url: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const width = image.naturalWidth
      const height = image.naturalHeight
      if (!width || !height) {
        reject(new Error('Invalid image dimensions'))
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) {
        reject(new Error('Canvas is unavailable'))
        return
      }

      context.drawImage(image, 0, 0, width, height)
      resolve(context.getImageData(0, 0, width, height))
    }
    image.onerror = () => reject(new Error('Failed to load image'))
    image.src = url
  })
}

export async function decodeQrTextFromImageUrl(url: string): Promise<string | null> {
  const imageData = await loadImageDataFromUrl(url)
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth'
  })
  return result?.data?.trim() || null
}

export async function decodeQrTextFromBlob(blob: Blob): Promise<string | null> {
  const url = URL.createObjectURL(blob)
  try {
    return await decodeQrTextFromImageUrl(url)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function decodeQrTextFromFile(file: File): Promise<string | null> {
  return decodeQrTextFromBlob(file)
}

export async function decodeQrTextFromDataUrl(dataUrl: string): Promise<string | null> {
  return decodeQrTextFromImageUrl(dataUrl)
}

async function readClipboardImageBlob(): Promise<Blob | null> {
  if (!navigator.clipboard?.read) {
    return null
  }

  const items = await navigator.clipboard.read()
  for (const item of items) {
    const imageType = item.types.find((type) => type.startsWith('image/'))
    if (!imageType) continue
    return item.getType(imageType)
  }

  return null
}

export async function decodeQrTextFromClipboard(): Promise<string | null> {
  const blob = await readClipboardImageBlob()
  if (blob) {
    return decodeQrTextFromBlob(blob)
  }

  if (!window.clipboardApi?.readImageDataUrl) {
    return null
  }

  const result = await window.clipboardApi.readImageDataUrl()
  if (!result?.ok || !result.dataUrl) {
    return null
  }

  return decodeQrTextFromDataUrl(result.dataUrl)
}
