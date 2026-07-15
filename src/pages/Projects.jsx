import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { Panel, ProgressBar, Modal, Input, Button } from '../components/ui.jsx'
import useFileUpload from '../hooks/useFileUpload.js'
import { downloadResource } from '../utils/download.js'

const palette = ['#D9722E', '#C9A15A', '#8FA37E', '#6E9BC9', '#B071C9']

export default function Projects() {
  const { projects, notes, tasks, resources, addProject, updateProject, deleteProject, addResource, deleteResource } = useApp()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const { inFlight, uploadFiles } = useFileUpload(addResource, user?.uid)

  // Lightweight backlinks: count notes whose title/body mention the project
  // by name, and tasks explicitly linked via task.project (including how
  // many of those are actually done — that's what powers auto-tracking).
  const mentions = useMemo(() => {
    const map = {}
    projects.forEach(p => {
      const needle = p.name.toLowerCase()
      const noteHits = notes.filter(n => n.title.toLowerCase().includes(needle) || n.body.toLowerCase().includes(needle)).length
      const projectTasks = tasks.filter(t => t.project === p.id)
      const projectFiles = resources.filter(r => r.projectId === p.id)
      map[p.id] = {
        notes: noteHits,
        tasks: projectTasks.length,
        tasksDone: projectTasks.filter(t => t.done).length,
        files: projectFiles
      }
    })
    return map
  }, [projects, notes, tasks, resources])

  function create() {
    if (!name.trim()) return
    addProject({ name: name.trim(), color: palette[projects.length % palette.length] })
    setName('')
    setOpen(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl text-ink-50">Projects</h1>
          <p className="text-ink-300 text-sm mt-1">Everything you're building, in one place.</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ New Project</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p, i) => {
          const m = mentions[p.id] || { notes: 0, tasks: 0, tasksDone: 0, files: [] }
          const hasTasks = m.tasks > 0
          const autoProgress = hasTasks ? Math.round((m.tasksDone / m.tasks) * 100) : 0
          const displayProgress = p.autoTrack && hasTasks ? autoProgress : p.progress
          const filesUploading = inFlight.filter(f => f.projectId === p.id)

          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Panel>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold text-white" style={{ background: p.color }}>
                    {p.name[0]}
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-ink-300 hover:text-ember-300 cursor-pointer focus-ring rounded p-1.5" title="Attach a file to this project">
                      <input
                        type="file" multiple className="hidden"
                        onChange={e => { if (e.target.files.length) uploadFiles(e.target.files, { projectId: p.id }); e.target.value = '' }}
                      />
                      <PaperclipIcon />
                    </label>
                    <button onClick={() => deleteProject(p.id)} className="text-ink-300 hover:text-red-300 text-xs focus-ring rounded px-1">Remove</button>
                  </div>
                </div>
                <h3 className="font-display text-base text-ink-50">{p.name}</h3>
                <p className="text-xs text-ink-300 mb-3">Updated {p.updated}</p>

                <div className="flex items-center justify-between text-xs text-ink-300 mb-1.5">
                  <span>Progress</span>
                  <span>{displayProgress}%</span>
                </div>
                <ProgressBar value={displayProgress} color={p.color} />

                {p.autoTrack && hasTasks ? (
                  <p className="text-[11px] text-ink-300 mt-2">Auto-tracked from tasks — {m.tasksDone}/{m.tasks} complete.</p>
                ) : (
                  <input
                    type="range" min="0" max="100" value={p.progress}
                    onChange={e => updateProject(p.id, { progress: Number(e.target.value) })}
                    className="w-full mt-3 accent-ember-500"
                  />
                )}

                <button
                  onClick={() => updateProject(p.id, { autoTrack: !p.autoTrack })}
                  disabled={!hasTasks && !p.autoTrack}
                  className={`mt-2 text-[11px] underline decoration-dotted transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${p.autoTrack ? 'text-ember-300' : 'text-ink-300 hover:text-ink-100'}`}
                >
                  {p.autoTrack ? 'Switch to manual progress' : hasTasks ? 'Track real completion from tasks' : 'Link tasks to enable auto-tracking'}
                </button>

                {(m.notes > 0 || m.tasks > 0) && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {m.notes > 0 && <span className="text-[10px] text-ink-300 bg-white/5 rounded-full px-2 py-0.5">Mentioned in {m.notes} note{m.notes > 1 ? 's' : ''}</span>}
                    {m.tasks > 0 && <span className="text-[10px] text-ink-300 bg-white/5 rounded-full px-2 py-0.5">{m.tasks} linked task{m.tasks > 1 ? 's' : ''}</span>}
                  </div>
                )}

                {filesUploading.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    {filesUploading.map(f => (
                      <div key={f.id}>
                        <div className="flex items-center justify-between text-[10px] text-ink-300 mb-0.5">
                          <span className="truncate max-w-[70%]">{f.name}</span>
                          <span>{f.progress}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-ember-400 transition-all duration-200" style={{ width: `${f.progress}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {m.files.length > 0 && (
                  <ul className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-1 max-h-32 overflow-y-auto">
                    <AnimatePresence>
                      {m.files.map(f => (
                        <motion.li key={f.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 group">
                          <FileIcon />
                          <a
                            href={f.url} target={f.url ? '_blank' : undefined} rel="noreferrer"
                            className={`flex-1 min-w-0 text-[11px] truncate ${f.url ? 'text-ember-200 hover:underline' : 'text-ink-100'}`}
                            title={f.url ? 'Opens with whatever your device uses for this file type' : 'No cloud copy — connect Firebase Storage to open this file'}
                          >
                            {f.name}
                          </a>
                          <button
                            onClick={() => downloadResource(f)}
                            disabled={!f.url}
                            title={f.url ? `Download ${f.name}` : 'No cloud copy to download'}
                            className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-ember-300 transition-opacity disabled:opacity-0 shrink-0"
                          >
                            <DownloadIcon />
                          </button>
                          <button onClick={() => deleteResource(f.id)} className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-red-300 text-[10px] transition-opacity shrink-0">✕</button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </Panel>
            </motion.div>
          )
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Project">
        <div className="flex flex-col gap-3">
          <Input autoFocus placeholder="Project name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} />
          <Button onClick={create}>Create project</Button>
        </div>
      </Modal>
    </div>
  )
}

function PaperclipIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05 12.25 20.24a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.67 3.67 0 0 1 5.19 5.19l-9.2 9.19a1.83 1.83 0 0 1-2.6-2.6l8.49-8.48" /></svg>
}
function FileIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-ember-300 shrink-0"><path d="M6 3h9l5 5v13H6z" /><path d="M14 3v5h5" /></svg>
}
function DownloadIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
}
