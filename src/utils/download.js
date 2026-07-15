// Forces a real "save this file" download regardless of type — including
// PDFs/images that browsers would otherwise open inline in a new tab.
// Works by fetching the exact bytes and handing them to the browser as a
// local blob, so the original file is never re-encoded, resized, or
// compressed in any way — what was uploaded is byte-for-byte what comes back.
export async function downloadResource(resource) {
  if (!resource?.url) return
  try {
    const res = await fetch(resource.url)
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = resource.name || 'download'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(blobUrl)
  } catch (err) {
    // Most likely cause: the Storage bucket doesn't have CORS configured for
    // this origin yet, so the browser blocks the fetch. Fall back to just
    // opening the file — still gets the user their file, just via a new tab
    // instead of a forced save-as.
    console.warn('Synapse: direct download blocked (bucket CORS may not be configured), opening instead', err)
    window.open(resource.url, '_blank', 'noopener')
  }
}

// "Download all" — triggers a save for every resource that has a cloud copy.
// Browsers block multiple simultaneous downloads/popups if fired all at once,
// so these go out one at a time with a short gap between each.
export async function downloadAllResources(resources) {
  const downloadable = resources.filter(r => r.url)
  for (const resource of downloadable) {
    await downloadResource(resource)
    await new Promise(r => setTimeout(r, 400))
  }
  return downloadable.length
}
