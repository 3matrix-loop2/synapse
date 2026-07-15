import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import WeatherWidget from './WeatherWidget.jsx'
import MusicPlayer from './MusicPlayer.jsx'

const links = [
  { to: '/', label: 'My Desk', icon: HomeIcon, end: true },
  { to: '/projects', label: 'Projects', icon: LayersIcon },
  { to: '/notes', label: 'Notes', icon: NoteIcon },
  { to: '/tasks', label: 'Tasks', icon: CheckIcon },
  { to: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { to: '/graph', label: 'Knowledge Graph', icon: GraphIcon },
  { to: '/assistant', label: 'AI Assistant', icon: SparkleIcon },
  { to: '/map', label: 'Map', icon: MapIcon },
  { to: '/resources', label: 'Resources', icon: FolderIcon },
  { to: '/analytics', label: 'Analytics', icon: ChartIcon },
  { to: '/focus', label: 'Focus Mode', icon: TimerIcon }
]

export default function Sidebar() {
  const { user } = useApp()
  const streak = user?.streak ?? 0
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col gap-5 p-5 glass-panel rounded-xl2 m-4 mr-0 shadow-panel overflow-y-auto">
      <div className="flex items-center gap-2 px-1">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-ember-400 to-ember-600 flex items-center justify-center shadow-glow">
          <SparkIcon />
        </div>
        <div>
          <p className="font-display text-lg leading-none tracking-tight">Synapse</p>
          <p className="text-[11px] text-ink-300 leading-none mt-1">Your space. Your flow.</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors focus-ring ${
                isActive ? 'text-ember-100' : 'text-ink-200 hover:text-ink-50 hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-ember-500/15 border border-ember-500/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10"><Icon /></span>
                <span className="relative z-10">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <MusicPlayer />

      <div className="rounded-lg bg-white/5 border border-white/5 px-3 py-3 text-xs text-ink-300">
        <p className="flex items-center gap-1.5 text-ember-200 font-medium mb-0.5">
          <FireIcon /> {streak} day streak
        </p>
        <p>Keep it up.</p>
      </div>

      <WeatherWidget />
    </aside>
  )
}

function HomeIcon() { return <Svg><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></Svg> }
function LayersIcon() { return <Svg><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></Svg> }
function NoteIcon() { return <Svg><path d="M6 3h9l5 5v13H6z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></Svg> }
function CheckIcon() { return <Svg><rect x="4" y="4" width="16" height="16" rx="3" /><path d="m8.5 12.5 2.5 2.5 5-5.5" /></Svg> }
function CalendarIcon() { return <Svg><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></Svg> }
function GraphIcon() { return <Svg><circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" /><path d="M12 7v6M12 13 6.5 17.3M12 13l5.5 4.3" /></Svg> }
function FolderIcon() { return <Svg><path d="M4 6.5h5l2 2.5h9V19H4z" /></Svg> }
function ChartIcon() { return <Svg><path d="M4 20V10M11 20V4M18 20v-7" /></Svg> }
function TimerIcon() { return <Svg><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M9.5 2h5" /></Svg> }
function SparkleIcon() { return <Svg><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></Svg> }
function MapIcon() { return <Svg><path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14M15 6v14" /></Svg> }
function FireIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 4-3 5-3 9a3 3 0 0 0 6 0c1 1 2 2 2 4a5 5 0 0 1-10 0c0-5 4-6 5-13Z" /></svg> }
function SparkIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10Z" /></svg> }

function Svg({ children }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}
