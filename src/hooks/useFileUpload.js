import { useState, useCallback } from 'react'
import { ref as storageRef, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage, isFirebaseConfigured } from '../firebase/config.js'

const MAX_CONCURRENT_UPLOADS = 6

// uploadBytesResumable negotiates a session with Firebase before it sends
// any bytes (an extra network round-trip). That's worth it for a big file
// so you get a live progress bar, but for a small file that handshake can
// take longer than just sending the whole thing in one request. Below this
// size we skip resumable entirely and use the plain single-shot upload.
const RESUMABLE_THRESHOLD_BYTES = 512 * 1024 // 512 KB

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Shared by Resources and Projects: uploads run a few at a time (not one
// strictly after another) and each gets a live progress %, so a batch of
// files no longer waits on the previous one to fully finish before starting.
export default function useFileUpload(addResource, uid) {
  const [inFlight, setInFlight] = useState([])

  const uploadOne = useCallback((file, extra = {}) => {
    const tempId = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    const base = { name: file.name, type: file.type.split('/')[0] || 'file', size: formatSize(file.size), ...extra }
    setInFlight(list => [...list, { id: tempId, name: file.name, progress: 0, projectId: extra.projectId || null }])

    return new Promise(resolve => {
      if (!(isFirebaseConfigured && storage && uid)) {
        addResource(base)
        setInFlight(list => list.filter(f => f.id !== tempId))
        resolve()
        return
      }

      const relativePath = file.webkitRelativePath || file.relativePath || file.name
      const path = `users/${uid}/resources/${Date.now()}_${relativePath}`
      const fileRef = storageRef(storage, path)

      // Small file: one request, no session negotiation, no incremental
      // progress needed since it lands almost instantly anyway.
      if (file.size < RESUMABLE_THRESHOLD_BYTES) {
        uploadBytes(fileRef, file)
          .then(async () => {
            const url = await getDownloadURL(fileRef)
            addResource({ ...base, url, path })
            setInFlight(list => list.filter(f => f.id !== tempId))
            resolve()
          })
          .catch(err => {
            console.warn('Synapse: Storage upload failed, saving metadata only', err)
            addResource(base)
            setInFlight(list => list.filter(f => f.id !== tempId))
            resolve()
          })
        return
      }

      // Larger file: resumable upload so the progress bar means something.
      const task = uploadBytesResumable(fileRef, file)
      task.on('state_changed',
        snap => {
          const progress = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
          setInFlight(list => list.map(f => (f.id === tempId ? { ...f, progress } : f)))
        },
        err => {
          console.warn('Synapse: Storage upload failed, saving metadata only', err)
          addResource(base)
          setInFlight(list => list.filter(f => f.id !== tempId))
          resolve()
        },
        async () => {
          const url = await getDownloadURL(fileRef)
          addResource({ ...base, url, path })
          setInFlight(list => list.filter(f => f.id !== tempId))
          resolve()
        }
      )
    })
  }, [addResource, uid])

  const uploadFiles = useCallback(async (files, extra = {}) => {
    const queue = Array.from(files)
    const workers = Array.from({ length: Math.min(MAX_CONCURRENT_UPLOADS, queue.length) }, async () => {
      while (queue.length) {
        const file = queue.shift()
        await uploadOne(file, extra)
      }
    })
    await Promise.all(workers)
  }, [uploadOne])

  return { inFlight, uploadFiles }
}
