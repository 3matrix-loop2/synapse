import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import AppearanceModal from './AppearanceModal.jsx'
import CommandPalette from './CommandPalette.jsx'

export default function TopBar() {
  const { user, tasks, isFirebaseConfigured, cloudReady, exportWorkspace } = useApp()
  const { signOut } = useAuth()
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pending = tasks.filter(t => !t.done).length

  return (
    <header className="flex items-center gap-4 p-4 pb-0">
      <div className="flex-1 max-w-xl">
        <CommandPalette />
      </div>

      <div className="flex items-center gap-2.5 relative">
        <SyncBadge configured={isFirebaseConfigured} ready={cloudReady} />

        <IconButton label="Appearance settings" onClick={() => setAppearanceOpen(true)}>
          <PaletteIcon />
        </IconButton>

        <IconButton label={`${pending} tasks pending`}>
          <BellIcon />
          {pending > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-ember-500 text-[10px] flex items-center justify-center text-white font-medium">
              {pending}
            </span>
          )}
        </IconButton>

        <button
          onClick={() => setMenuOpen(o => !o)}
          className="flex items-center gap-2.5 glass-panel rounded-lg pl-2 pr-3 py-1.5 shadow-panel focus-ring"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brass to-ember-500 flex items-center justify-center text-xs font-semibold text-ink-900">
            {(user.name || 'G').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="leading-tight text-left">
            <p className="text-xs font-medium text-ink-50">{user.name}</p>
            {/* <p className="text-[10px] text-ember-300">{user.plan}</p> */}
          </div>
        </button>

        <AnimatePresence>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="absolute right-0 top-14 w-52 glass-panel rounded-xl2 shadow-panel p-2 z-50"
              >
                <div className="px-2.5 py-2 text-xs text-ink-300 truncate">{user.email || 'Local demo account'}</div>
                <button
                  onClick={() => { setMenuOpen(false); exportWorkspace() }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-sm text-ink-100 hover:bg-white/5 transition-colors"
                >
                  Export data (.json)
                </button>
                <button
                  onClick={() => { setMenuOpen(false); signOut() }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-sm text-ink-100 hover:bg-white/5 transition-colors"
                >
                  Sign out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <AppearanceModal open={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
    </header>
  )
}

function SyncBadge({ configured, ready }) {
  if (!configured) {
    return (
      <span title="Data is saved on this device only. Add Firebase credentials to sync to the cloud." className="hidden sm:flex items-center gap-1.5 text-[11px] text-ink-300 px-2.5 py-1.5 rounded-full glass-panel shadow-panel">
        <span className="w-1.5 h-1.5 rounded-full bg-ink-300" /> Local only
      </span>
    )
  }
  return (
    <span title={ready ? 'Synced to the cloud' : 'Connecting…'} className="hidden sm:flex items-center gap-1.5 text-[11px] text-ember-200 px-2.5 py-1.5 rounded-full glass-panel shadow-panel">
      <span className={`w-1.5 h-1.5 rounded-full ${ready ? 'bg-emerald-400' : 'bg-ember-400 animate-pulse'}`} /> {ready ? 'Synced' : 'Connecting…'}
    </span>
  )
}

function IconButton({ children, label, onClick }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className="relative w-10 h-10 rounded-lg glass-panel shadow-panel flex items-center justify-center text-ink-200 hover:text-ember-300 transition-colors focus-ring">
      {children}
    </button>
  )
}

function PaletteIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.7 1.6-1.5 0-.4-.15-.7-.4-1-.25-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16a4 4 0 0 0 4-4c0-4.4-3.6-8-8-8Z" /><circle cx="7.5" cy="11.5" r="1" fill="currentColor" /><circle cx="10.5" cy="7.5" r="1" fill="currentColor" /><circle cx="15" cy="8" r="1" fill="currentColor" /></svg>
}

function BellIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10.5 20a1.5 1.5 0 0 0 3 0" /></svg>
}
