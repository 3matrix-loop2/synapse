import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { Panel, Modal, Input, Textarea, Button } from '../components/ui.jsx'

const tags = ['Note', 'Idea', 'Dev', 'Meeting']

export default function Notes() {
  const { notes, addNote, deleteNote, updateNote } = useApp()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tag, setTag] = useState('Note')

  function openNew() {
    setActive(null); setTitle(''); setBody(''); setTag('Note'); setOpen(true)
  }
  function openEdit(n) {
    setActive(n); setTitle(n.title); setBody(n.body); setTag(n.tag); setOpen(true)
  }
  function save() {
    if (!title.trim()) return
    if (active) updateNote(active.id, { title, body, tag })
    else addNote({ title, body, tag })
    setOpen(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl text-ink-50">Notes</h1>
          <p className="text-ink-300 text-sm mt-1">Capture ideas — markdown supported.</p>
        </div>
        <Button onClick={openNew}>+ New Note</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {notes.map(n => (
            <motion.div key={n.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
              <Panel className="h-full flex flex-col cursor-pointer hover:border-ember-500/30 border border-transparent" >
                <div onClick={() => openEdit(n)} className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wide text-ember-300 bg-ember-500/10 px-2 py-0.5 rounded-full">{n.tag}</span>
                    <span className="text-[10px] text-ink-300">{timeAgo(n.created)}</span>
                  </div>
                  <h3 className="font-display text-base text-ink-50 mb-1.5">{n.title}</h3>
                  <div className="text-xs text-ink-300 line-clamp-4 prose-invert markdown-body">
                    <ReactMarkdown>{n.body}</ReactMarkdown>
                  </div>
                </div>
                <button onClick={() => deleteNote(n.id)} className="text-[11px] text-ink-300 hover:text-red-300 mt-3 self-start focus-ring rounded">Delete</button>
              </Panel>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={active ? 'Edit Note' : 'New Note'}>
        <div className="flex flex-col gap-3">
          <Input autoFocus placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <div className="flex gap-2 flex-wrap">
            {tags.map(t => (
              <button key={t} onClick={() => setTag(t)} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${tag === t ? 'bg-ember-500/20 border-ember-500/50 text-ember-200' : 'border-white/10 text-ink-300'}`}>{t}</button>
            ))}
          </div>
          <Textarea rows={6} placeholder="Write in markdown..." value={body} onChange={e => setBody(e.target.value)} />
          <Button onClick={save}>{active ? 'Save changes' : 'Create note'}</Button>
        </div>
      </Modal>
    </div>
  )
}

function timeAgo(ts) {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
