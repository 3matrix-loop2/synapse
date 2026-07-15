import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { Panel, ProgressBar, Modal, Input, Button } from '../components/ui.jsx'

const scenes = ['dawn', 'morning', 'afternoon', 'sunset', 'evening', 'night', 'rainy', 'stormy']

export default function MyDesk() {
  const { user, tasks, toggleTask, projects, activity, scene, setScene, setFollowRealWorld, followRealWorld, addTask, focusMinutes, logFocusSession } = useApp()
  const [quickOpen, setQuickOpen] = useState(false)
  const [quickText, setQuickText] = useState('')
  const [zen, setZen] = useState(false)
  const done = tasks.filter(t => t.done).length
  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 18) return 'Good Afternoon'
    return 'Good Evening'
  }, [])

  function submitQuick() {
    if (!quickText.trim()) return
    addTask({ title: quickText.trim(), due: '' })
    setQuickText('')
    setQuickOpen(false)
  }

  if (zen) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl text-ink-50 drop-shadow-lg">{greeting}, {user.name.split(' ')[0]}</h1>
          <p className="text-ink-200 text-sm mt-2 drop-shadow">{done}/{tasks.length} tasks done · Click anything on the desk to open it</p>
        </motion.div>
        <button onClick={() => setZen(false)} className="mt-6 text-xs px-4 py-2 rounded-full glass-panel shadow-panel text-ink-200 hover:text-ink-50 transition-colors">
          Show panels
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
      <div className="flex flex-col gap-4">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl2 shadow-panel p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-2xl text-ink-50">{greeting}, {user.name.split(' ')[0]}! 👋</h1>
              <p className="text-ink-300 text-sm mt-1">Let's make today productive.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setZen(true)}>Clean view</Button>
              <Button onClick={() => setQuickOpen(true)}>+ Quick Task</Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            <div className="rounded-lg bg-white/5 border border-white/5 p-4">
              <p className="text-xs text-ink-300 mb-2">Today's Tasks</p>
              <p className="font-display text-xl text-ink-50">{done}/{tasks.length} done</p>
              <div className="mt-2"><ProgressBar value={tasks.length ? (done / tasks.length) * 100 : 0} /></div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/5 p-4">
              <p className="text-xs text-ink-300 mb-2">Focus Time</p>
              <p className="font-display text-xl text-ink-50">{focusMinutes}:00</p>
              <Link to="/focus" className="text-xs text-ember-300 hover:text-ember-200 mt-1 inline-block">Start focus →</Link>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/5 p-4">
              <p className="text-xs text-ink-300 mb-2">Active Projects</p>
              <p className="font-display text-xl text-ink-50">{projects.length}</p>
              <Link to="/projects" className="text-xs text-ember-300 hover:text-ember-200 mt-1 inline-block">View all →</Link>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          <Panel title="Today's Plan" action={<Link to="/tasks" className="text-xs text-ember-300 hover:text-ember-200">View all</Link>}>
            <ul className="flex flex-col gap-2.5">
              {tasks.slice(0, 6).map(t => (
                <li key={t.id} className="flex items-center gap-2.5 text-sm">
                  <button
                    onClick={() => toggleTask(t.id)}
                    className={`w-4.5 h-4.5 shrink-0 rounded border flex items-center justify-center transition-colors focus-ring ${t.done ? 'bg-ember-500 border-ember-500' : 'border-white/20 hover:border-ember-400'}`}
                    style={{ width: 18, height: 18 }}
                    aria-label={t.done ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {t.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 5 5 9-10" /></svg>}
                  </button>
                  <span className={t.done ? 'line-through text-ink-300' : 'text-ink-100'}>{t.title}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="My Projects" action={<Link to="/projects" className="text-xs text-ember-300 hover:text-ember-200">New project +</Link>}>
            <ul className="flex flex-col gap-4">
              {projects.slice(0, 3).map(p => (
                <li key={p.id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-ink-100">{p.name}</span>
                    <span className="text-ink-300 text-xs">{p.progress}%</span>
                  </div>
                  <ProgressBar value={p.progress} color={p.color} />
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel title="Workspace Scenes">
          <p className="text-xs text-ink-300 mb-3">
            {followRealWorld ? 'Following the real-world time and weather automatically.' : 'Manual override active — pick a scene below.'}
          </p>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setFollowRealWorld(true)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${followRealWorld ? 'bg-ember-500/20 border-ember-500/50 text-ember-200' : 'border-white/10 text-ink-300 hover:text-ink-100'}`}>
              Follow real world
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {scenes.map(s => (
              <button
                key={s}
                onClick={() => { setFollowRealWorld(false); setScene(s) }}
                className={`px-3 py-1.5 rounded-full text-xs capitalize border transition-colors focus-ring ${
                  scene === s && !followRealWorld ? 'bg-ember-500/20 border-ember-500/50 text-ember-200' : 'border-white/10 text-ink-300 hover:text-ink-100 hover:border-white/20'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <div className="flex flex-col gap-4">
        <Panel title="Recent Activity">
          <ul className="flex flex-col gap-3">
            {activity.slice(0, 6).map(a => (
              <li key={a.id} className="flex items-start gap-2.5 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dot(a.type)}`} />
                <div>
                  <p className="text-ink-100">{a.text}</p>
                  <p className="text-ink-300 mt-0.5">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Quick Capture">
          <div className="grid grid-cols-2 gap-2">
            <Link to="/notes" className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 p-3 text-center text-xs text-ink-100 transition-colors">New Note</Link>
            <button onClick={() => setQuickOpen(true)} className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 p-3 text-center text-xs text-ink-100 transition-colors">New Task</button>
            <Link to="/resources" className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 p-3 text-center text-xs text-ink-100 transition-colors">Upload File</Link>
            <Link to="/focus" className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 p-3 text-center text-xs text-ink-100 transition-colors">Start Focus</Link>
          </div>
        </Panel>
      </div>

      <Modal open={quickOpen} onClose={() => setQuickOpen(false)} title="Quick Task">
        <div className="flex flex-col gap-3">
          <Input autoFocus placeholder="What do you need to do?" value={quickText} onChange={e => setQuickText(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitQuick()} />
          <Button onClick={submitQuick}>Add task</Button>
        </div>
      </Modal>
    </div>
  )
}

function dot(type) {
  return { note: 'bg-blue-400', task: 'bg-emerald-400', file: 'bg-ember-400', project: 'bg-purple-400' }[type] || 'bg-ink-300'
}
