import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { Panel, Button } from '../components/ui.jsx'

const PRESETS = [15, 25, 45, 60]

export default function FocusMode() {
  const { logFocusSession, tasks } = useApp()
  const [minutes, setMinutes] = useState(25)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            logFocusSession(minutes)
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, minutes, logFocusSession])

  function setPreset(m) {
    setMinutes(m); setSecondsLeft(m * 60); setRunning(false)
  }

  function reset() {
    setSecondsLeft(minutes * 60); setRunning(false)
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const progress = 1 - secondsLeft / (minutes * 60)
  const pending = tasks.filter(t => !t.done)

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <Panel className="flex flex-col items-center justify-center py-16">
        <p className="text-xs uppercase tracking-widest text-ember-300 mb-6">Deep Work</p>
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#2A251E" strokeWidth="10" />
            <motion.circle
              cx="100" cy="100" r="90" fill="none" stroke="#D9722E" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 90}
              animate={{ strokeDashoffset: 2 * Math.PI * 90 * (1 - progress) }}
              transition={{ duration: 0.4 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-5xl text-ink-50 tabular-nums">{mm}:{ss}</span>
            <span className="text-xs text-ink-300 mt-1">{running ? 'Stay with it' : 'Ready when you are'}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-8">
          {PRESETS.map(m => (
            <button key={m} onClick={() => setPreset(m)} disabled={running} className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors disabled:opacity-40 ${minutes === m ? 'bg-ember-500/20 border-ember-500/50 text-ember-200' : 'border-white/10 text-ink-300'}`}>{m}m</button>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={() => setRunning(r => !r)}>{running ? 'Pause' : 'Start Focus'}</Button>
          <Button variant="ghost" onClick={reset}>Reset</Button>
        </div>
      </Panel>

      <Panel title="Focus checklist">
        <ul className="flex flex-col gap-2">
          {pending.slice(0, 6).map(t => (
            <li key={t.id} className="text-sm text-ink-100 px-3 py-2 rounded-lg bg-white/5">{t.title}</li>
          ))}
          {pending.length === 0 && <p className="text-sm text-ink-300 py-4 text-center">Nothing pending — clean slate.</p>}
        </ul>
      </Panel>
    </div>
  )
}
