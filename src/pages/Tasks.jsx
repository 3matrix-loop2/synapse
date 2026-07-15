import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { Panel, Input, Button } from '../components/ui.jsx'
import KanbanBoard from '../components/KanbanBoard.jsx'

export default function Tasks() {
  const { tasks, projects, addTask, toggleTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask } = useApp()
  const [text, setText] = useState('')
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('list')
  const [expanded, setExpanded] = useState(null)
  const [subtaskDraft, setSubtaskDraft] = useState('')

  const filtered = useMemo(() => {
    if (filter === 'active') return tasks.filter(t => !t.done)
    if (filter === 'done') return tasks.filter(t => t.done)
    return tasks
  }, [tasks, filter])

  function submit() {
    if (!text.trim()) return
    addTask({ title: text.trim() })
    setText('')
  }

  function projectName(id) {
    return projects.find(p => p.id === id)?.name
  }

  function submitSubtask(taskId) {
    if (!subtaskDraft.trim()) return
    addSubtask(taskId, subtaskDraft.trim())
    setSubtaskDraft('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="font-display text-2xl text-ink-50">Tasks</h1>
          <p className="text-ink-300 text-sm mt-1">{tasks.filter(t => !t.done).length} remaining today.</p>
        </div>
        <div className="flex gap-1 p-1 rounded-full bg-white/5 border border-white/10">
          {['list', 'board'].map(v => (
            <button key={v} onClick={() => setView(v)} className={`text-xs px-3 py-1.5 rounded-full capitalize transition-colors ${view === v ? 'bg-ember-500/20 text-ember-200' : 'text-ink-300'}`}>{v}</button>
          ))}
        </div>
      </div>

      <Panel className="mb-4">
        <div className="flex gap-2">
          <Input placeholder="Add a task and press Enter..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          <Button onClick={submit}>Add</Button>
        </div>
      </Panel>

      {view === 'board' ? (
        <KanbanBoard tasks={tasks} projectName={projectName} />
      ) : (
        <Panel>
          <div className="flex gap-2 mb-4">
            {['all', 'active', 'done'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${filter === f ? 'bg-ember-500/20 border-ember-500/50 text-ember-200' : 'border-white/10 text-ink-300'}`}>{f}</button>
            ))}
          </div>

          <ul className="flex flex-col gap-1">
            <AnimatePresence>
              {filtered.map(t => {
                const subtasks = t.subtasks || []
                const subDone = subtasks.filter(s => s.done).length
                const isOpen = expanded === t.id
                return (
                  <motion.li
                    key={t.id}
                    layout
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -10 }}
                    className="rounded-lg hover:bg-white/5 group"
                  >
                    <div className="flex items-center gap-3 px-2 py-2.5">
                      <button
                        onClick={() => toggleTask(t.id)}
                        className={`w-[18px] h-[18px] shrink-0 rounded border flex items-center justify-center transition-colors focus-ring ${t.done ? 'bg-ember-500 border-ember-500' : 'border-white/20 hover:border-ember-400'}`}
                      >
                        {t.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 5 5 9-10" /></svg>}
                      </button>
                      <button className="flex-1 text-left" onClick={() => setExpanded(isOpen ? null : t.id)}>
                        <p className={`text-sm ${t.done ? 'line-through text-ink-300' : 'text-ink-100'}`}>{t.title}</p>
                        <p className="text-[11px] text-ink-300">
                          {[t.due, projectName(t.project), subtasks.length > 0 ? `${subDone}/${subtasks.length} subtasks` : null].filter(Boolean).join(' · ')}
                        </p>
                      </button>
                      <button onClick={() => setExpanded(isOpen ? null : t.id)} className="text-ink-300 hover:text-ember-300 text-xs px-1 focus-ring rounded">
                        {isOpen ? 'Hide' : 'Subtasks'}
                      </button>
                      <button onClick={() => deleteTask(t.id)} className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-red-300 text-xs transition-opacity focus-ring rounded px-1">Delete</button>
                    </div>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pl-9 pr-3"
                        >
                          <ul className="flex flex-col gap-1 pb-2">
                            {subtasks.map(st => (
                              <li key={st.id} className="flex items-center gap-2 text-xs group/sub">
                                <button
                                  onClick={() => toggleSubtask(t.id, st.id)}
                                  className={`w-3.5 h-3.5 shrink-0 rounded-sm border flex items-center justify-center ${st.done ? 'bg-ember-500 border-ember-500' : 'border-white/20'}`}
                                >
                                  {st.done && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"><path d="m5 12 5 5 9-10" /></svg>}
                                </button>
                                <span className={`flex-1 ${st.done ? 'line-through text-ink-300' : 'text-ink-200'}`}>{st.title}</span>
                                <button onClick={() => deleteSubtask(t.id, st.id)} className="opacity-0 group-hover/sub:opacity-100 text-ink-300 hover:text-red-300">×</button>
                              </li>
                            ))}
                          </ul>
                          <div className="flex gap-1.5 pb-3">
                            <input
                              value={subtaskDraft}
                              onChange={e => setSubtaskDraft(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && submitSubtask(t.id)}
                              placeholder="Add subtask…"
                              className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-ink-50 outline-none focus:border-ember-500/60"
                            />
                            <button onClick={() => submitSubtask(t.id)} className="text-xs text-ember-300 px-2">Add</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                )
              })}
            </AnimatePresence>
            {filtered.length === 0 && <p className="text-sm text-ink-300 py-6 text-center">Nothing here. Add a task above.</p>}
          </ul>
        </Panel>
      )}
    </div>
  )
}
