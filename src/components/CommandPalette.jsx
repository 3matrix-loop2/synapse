import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'

// Lightweight scored substring match — no extra dependency needed.
// Exact prefix matches rank highest, then "contains", then skipped.
function score(query, text) {
  if (!text) return -1
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  const idx = t.indexOf(q)
  if (idx === -1) return -1
  return 50 - idx // earlier match position scores slightly higher
}

export default function CommandPalette() {
  const { notes, tasks, projects, resources } = useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (open) { setQuery(''); setActiveIdx(0) }
  }, [open])

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.trim()
    const out = []

    notes.forEach(n => {
      const s = Math.max(score(q, n.title), score(q, n.body) - 20)
      if (s > -1) out.push({ kind: 'Note', id: n.id, title: n.title, subtitle: n.tag, to: '/notes', s })
    })
    tasks.forEach(t => {
      const s = score(q, t.title)
      if (s > -1) out.push({ kind: 'Task', id: t.id, title: t.title, subtitle: t.done ? 'Done' : (t.due || 'Pending'), to: '/tasks', s })
    })
    projects.forEach(p => {
      const s = score(q, p.name)
      if (s > -1) out.push({ kind: 'Project', id: p.id, title: p.name, subtitle: `${p.progress}% complete`, to: '/projects', s })
    })
    resources.forEach(r => {
      const s = score(q, r.name)
      if (s > -1) out.push({ kind: 'Resource', id: r.id, title: r.name, subtitle: r.size, to: '/resources', s })
    })

    return out.sort((a, b) => b.s - a.s).slice(0, 8)
  }, [query, notes, tasks, projects, resources])

  function go(result) {
    navigate(result.to)
    setOpen(false)
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[activeIdx]) go(results[activeIdx])
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 glass-panel rounded-lg px-3.5 py-2.5 shadow-panel w-full text-left focus-ring"
      >
        <SearchIcon />
        <span className="text-sm flex-1 text-ink-300 truncate">Search anything in Synapse...</span>
        <kbd className="hidden sm:inline text-[10px] text-ink-300 border border-white/10 rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              className="relative w-full max-w-lg glass-panel rounded-xl2 shadow-panel overflow-hidden bg-ink-800/95"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <SearchIcon />
                <input
                  autoFocus
                  value={query}
                  onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
                  onKeyDown={onKeyDown}
                  placeholder="Search notes, tasks, projects, resources..."
                  className="flex-1 bg-transparent outline-none text-sm text-ink-50 placeholder:text-ink-300"
                />
                <kbd className="text-[10px] text-ink-300 border border-white/10 rounded px-1.5 py-0.5 font-mono">esc</kbd>
              </div>

              <div className="max-h-80 overflow-y-auto py-2">
                {query.trim() === '' && (
                  <p className="text-xs text-ink-300 px-4 py-6 text-center">Start typing to search everything in your workspace.</p>
                )}
                {query.trim() !== '' && results.length === 0 && (
                  <p className="text-xs text-ink-300 px-4 py-6 text-center">No matches for "{query}".</p>
                )}
                {results.map((r, i) => (
                  <button
                    key={`${r.kind}-${r.id}`}
                    onClick={() => go(r)}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${i === activeIdx ? 'bg-ember-500/15' : 'hover:bg-white/5'}`}
                  >
                    <span className="text-[10px] uppercase tracking-wide text-ember-300 bg-ember-500/10 px-2 py-0.5 rounded-full shrink-0">{r.kind}</span>
                    <span className="text-sm text-ink-100 truncate flex-1">{r.title}</span>
                    <span className="text-[11px] text-ink-300 shrink-0">{r.subtitle}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function SearchIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-ink-300 shrink-0"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
}
