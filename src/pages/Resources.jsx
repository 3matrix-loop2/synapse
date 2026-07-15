import React, { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { isFirebaseConfigured } from '../firebase/config.js'
import { Panel, Button } from '../components/ui.jsx'
import useFileUpload from '../hooks/useFileUpload.js'
import { collectFilesFromDataTransfer } from '../utils/collectFiles.js'
import { downloadResource, downloadAllResources } from '../utils/download.js'

export default function Resources() {
  const { resources, addResource, deleteResource, projects } = useApp()
  const { user } = useAuth()
  const inputRef = useRef(null)
  const folderInputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const { inFlight, uploadFiles } = useFileUpload(addResource, user?.uid)
  const [bulkDownloading, setBulkDownloading] = useState(false)

  const handleFiles = files => uploadFiles(files)
  const projectName = id => projects.find(p => p.id === id)?.name
  const downloadableCount = resources.filter(r => r.url).length

  async function handleDownloadAll() {
    if (bulkDownloading || downloadableCount === 0) return
    setBulkDownloading(true)
    await downloadAllResources(resources)
    setBulkDownloading(false)
  }

  async function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    // Walks into any dropped folders so their contents upload too, not just
    // the top-level items the browser hands back by default.
    const files = await collectFilesFromDataTransfer(e.dataTransfer)
    if (files.length) handleFiles(files)
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-2xl text-ink-50">Resources</h1>
        <p className="text-ink-300 text-sm mt-1">Files, assets, and references for your projects.</p>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`glass-panel rounded-xl2 shadow-panel p-8 mb-4 text-center cursor-pointer transition-colors border-2 border-dashed ${dragging ? 'border-ember-400 bg-ember-500/5' : 'border-white/10'}`}
      >
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
        {/* webkitdirectory lets the native picker select a whole folder; each
            resulting File carries webkitRelativePath so structure is kept. */}
        <input ref={folderInputRef} type="file" webkitdirectory="" directory="" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
        <p className="text-sm text-ink-100 font-medium">
          {inFlight.length > 0 ? `Uploading ${inFlight.length} file${inFlight.length > 1 ? 's' : ''}…` : 'Drop files or a folder here, or click to browse'}
        </p>
        <p className="text-xs text-ink-300 mt-1">
          {isFirebaseConfigured
            ? 'Files upload at full resolution — nothing is compressed or resized.'
            : 'Firebase Storage isn\'t connected yet — files are tracked locally on this device. Add real Firebase credentials to store them in the cloud.'}
        </p>
        <button
          onClick={e => { e.stopPropagation(); folderInputRef.current?.click() }}
          className="mt-3 text-xs text-ember-300 hover:text-ember-200 underline decoration-dotted"
        >
          or upload a whole folder
        </button>
        {inFlight.length > 0 && (
          <div className="mt-4 flex flex-col gap-2 text-left max-w-xs mx-auto" onClick={e => e.stopPropagation()}>
            {inFlight.map(f => (
              <div key={f.id}>
                <div className="flex items-center justify-between text-[11px] text-ink-300 mb-1">
                  <span className="truncate max-w-[70%]">{f.name}</span>
                  <span>{f.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-ember-400 transition-all duration-200" style={{ width: `${f.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Panel
        title={`${resources.length} files`}
        action={downloadableCount > 0 && (
          <button
            onClick={handleDownloadAll}
            disabled={bulkDownloading}
            className="text-xs text-ember-300 hover:text-ember-200 underline decoration-dotted disabled:opacity-50 disabled:cursor-wait"
          >
            {bulkDownloading ? 'Downloading…' : `Download all (${downloadableCount})`}
          </button>
        )}
      >
        <ul className="flex flex-col gap-1">
          <AnimatePresence>
            {resources.map(r => (
              <motion.li key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/5 group">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-ember-300 shrink-0">
                  <FileIcon />
                </div>
                <a href={r.url} target={r.url ? '_blank' : undefined} rel="noreferrer" className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${r.url ? 'text-ember-200 hover:underline' : 'text-ink-100'}`}>{r.name}</p>
                  <p className="text-[11px] text-ink-300">
                    {r.size} · {r.uploaded}
                    {r.projectId && projectName(r.projectId) && <span className="ml-1.5 text-ember-300/80">· {projectName(r.projectId)}</span>}
                  </p>
                </a>
                <button
                  onClick={() => downloadResource(r)}
                  disabled={!r.url}
                  title={r.url ? `Download ${r.name}` : 'No cloud copy to download — connect Firebase Storage'}
                  className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-ember-300 transition-opacity disabled:opacity-0 focus-ring rounded p-1"
                >
                  <DownloadIcon />
                </button>
                <button onClick={() => deleteResource(r.id)} className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-red-300 text-xs transition-opacity">Delete</button>
              </motion.li>
            ))}
          </AnimatePresence>
          {resources.length === 0 && <p className="text-sm text-ink-300 py-6 text-center">No files yet.</p>}
        </ul>
      </Panel>
    </div>
  )
}

function FileIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h9l5 5v13H6z" /><path d="M14 3v5h5" /></svg>
}
function DownloadIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
}
