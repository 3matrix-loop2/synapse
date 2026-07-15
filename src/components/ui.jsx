import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function Panel({ title, action, children, className = '' }) {
  return (
    <div className={`glass-panel rounded-xl2 shadow-panel p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="font-display text-base tracking-tight text-ink-50">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function Modal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-md glass-panel rounded-xl2 shadow-panel p-6 bg-ink-700/95"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-ink-50">{title}</h3>
              <button onClick={onClose} className="text-ink-300 hover:text-ink-50 focus-ring rounded p-1" aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-ember-500 hover:bg-ember-400 text-white shadow-glow',
    ghost: 'bg-white/5 hover:bg-white/10 text-ink-100 border border-white/10',
    danger: 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/20'
  }
  return (
    <button
      className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors focus-ring disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Input(props) {
  return (
    <input
      {...props}
      className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink-50 placeholder:text-ink-300 outline-none focus:border-ember-500/60 transition-colors ${props.className || ''}`}
    />
  )
}

export function Textarea(props) {
  return (
    <textarea
      {...props}
      className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink-50 placeholder:text-ink-300 outline-none focus:border-ember-500/60 transition-colors resize-none ${props.className || ''}`}
    />
  )
}

export function ProgressBar({ value, color = '#D9722E' }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}
