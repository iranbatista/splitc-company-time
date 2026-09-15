/** Dispara o download de um blob com o nome dado. */
export function baixarBlob(blob: Blob, nomeArquivo: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revogar na mesma volta do event loop aborta o download no Firefox.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
