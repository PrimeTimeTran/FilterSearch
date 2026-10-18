export function base64ToFile(base64, filename, mimeType) {
  const byteCharacters = atob(base64)

  const byteNumbers = new Array(byteCharacters.length)

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }

  const byteArray = new Uint8Array(byteNumbers)

  return new File([byteArray], filename, {
    type: mimeType,
  })
}

export function normalizeLabelText(text) {
  return text.replace(/\*/g, '').replace(/\s+/g, ' ').trim()
}
