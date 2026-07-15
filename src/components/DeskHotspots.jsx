import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

// Positions are percentages matching where each object sits in
// src/assets/synapse-desk.png (monitor, laptop, notebook, coffee, phone, magazines).
const spots = [
  { to: '/graph', label: 'Knowledge Graph', top: '19%', left: '43%' },
  { to: '/projects', label: 'Projects', top: '40%', left: '80%' },
  { to: '/notes', label: 'Notes', top: '55%', left: '20%' },
  { to: '/focus', label: 'Focus Timer', top: '68%', left: '44%' },
  { to: '/tasks', label: 'Tasks', top: '72%', left: '60%' },
  { to: '/resources', label: 'Resources', top: '86%', left: '9%' }
]

export default function DeskHotspots() {
  return (
    <div className="fixed inset-0 z-[5] pointer-events-none hidden md:block">
      {spots.map((s, i) => (
        <Link
          key={s.to}
          to={s.to}
          className="absolute pointer-events-auto group -translate-x-1/2 -translate-y-1/2"
          style={{ top: s.top, left: s.left }}
        >
          <motion.span
            className="relative flex items-center justify-center w-3.5 h-3.5 rounded-full bg-ember-400 border-2 border-white/60 shadow-glow"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.08, type: 'spring', stiffness: 300, damping: 20 }}
          >
            <motion.span
              className="absolute inset-0 rounded-full bg-ember-400"
              animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: i * 0.3 }}
            />
          </motion.span>
          <span className="absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full glass-panel text-ink-50 opacity-0 group-hover:opacity-100 transition-opacity shadow-panel">
            {s.label}
          </span>
        </Link>
      ))}
    </div>
  )
}
