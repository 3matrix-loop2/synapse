import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'doing', label: 'In Progress' },
  { key: 'done', label: 'Done' }
]

function statusOf(task) {
  return task.status || (task.done ? 'done' : 'todo')
}

export default function KanbanBoard({ tasks, projectName }) {
  const { setTaskStatus, deleteTask } = useApp()
  const [dragId, setDragId] = useState(null)
  const [overCol, setOverCol] = useState(null)

  function onDrop(colKey) {
    if (dragId) setTaskStatus(dragId, colKey)
    setDragId(null)
    setOverCol(null)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {COLUMNS.map(col => {
        const items = tasks.filter(t => statusOf(t) === col.key)
        return (
          <div
            key={col.key}
            onDragOver={e => { e.preventDefault(); setOverCol(col.key) }}
            onDragLeave={() => setOverCol(c => c === col.key ? null : c)}
            onDrop={() => onDrop(col.key)}
            className={`glass-panel rounded-xl2 shadow-panel p-3 min-h-[200px] transition-colors ${overCol === col.key ? 'ring-2 ring-ember-500/50' : ''}`}
          >
            <div className="flex items-center justify-between px-1 mb-3">
              <p className="text-xs font-medium text-ink-200 uppercase tracking-wide">{col.label}</p>
              <span className="text-[11px] text-ink-300 bg-white/5 rounded-full px-2 py-0.5">{items.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {items.map(t => (
                <motion.div
                  key={t.id}
                  layout
                  draggable
                  onDragStart={() => setDragId(t.id)}
                  onDragEnd={() => setDragId(null)}
                  className={`rounded-lg bg-white/5 border border-white/5 p-3 cursor-grab active:cursor-grabbing group ${dragId === t.id ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-ink-100">{t.title}</p>
                    <button onClick={() => deleteTask(t.id)} className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-red-300 text-xs shrink-0">×</button>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {t.due && <span className="text-[10px] text-ink-300 bg-white/5 rounded-full px-2 py-0.5">{t.due}</span>}
                    {projectName(t.project) && <span className="text-[10px] text-ember-300 bg-ember-500/10 rounded-full px-2 py-0.5">{projectName(t.project)}</span>}
                    {t.subtasks?.length > 0 && (
                      <span className="text-[10px] text-ink-300 bg-white/5 rounded-full px-2 py-0.5">
                        {t.subtasks.filter(s => s.done).length}/{t.subtasks.length}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
              {items.length === 0 && (
                <p className="text-[11px] text-ink-300 text-center py-6">Drop tasks here</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
