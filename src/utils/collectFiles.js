// A plain drag-and-drop only ever gives you the top-level entries — dropping
// a folder does NOT automatically include the files inside it. This walks
// the full tree (via the non-standard but widely supported webkitGetAsEntry
// API) so dropping a folder behaves the same as dropping all its files.
export async function collectFilesFromDataTransfer(dataTransfer) {
  const items = dataTransfer?.items
  if (!items || items.length === 0) return Array.from(dataTransfer?.files || [])

  const entries = Array.from(items)
    .map(item => item.webkitGetAsEntry?.())
    .filter(Boolean)

  // Browser without folder-entry support (e.g. some mobile browsers) — fall
  // back to whatever flat file list the browser gave us.
  if (entries.length === 0) return Array.from(dataTransfer.files || [])

  const files = []

  async function walk(entry, path) {
    if (entry.isFile) {
      const file = await new Promise((resolve, reject) => entry.file(resolve, reject))
      if (path) Object.defineProperty(file, 'relativePath', { value: `${path}${file.name}`, writable: false })
      files.push(file)
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      const readBatch = () => new Promise((resolve, reject) => reader.readEntries(resolve, reject))
      let batch
      do {
        batch = await readBatch()
        for (const child of batch) await walk(child, `${path}${entry.name}/`)
      } while (batch.length > 0)
    }
  }

  for (const entry of entries) await walk(entry, '')
  return files
}
