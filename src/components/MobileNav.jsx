import React from 'react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Desk', end: true },
  { to: '/projects', label: 'Projects' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/calendar', label: 'Cal' },
  { to: '/graph', label: 'Graph' }
]

export default function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-20 glass-panel rounded-xl2 shadow-panel flex justify-around py-2.5">
      {links.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `text-[11px] px-2 py-1 rounded-lg transition-colors ${isActive ? 'text-ember-300 bg-ember-500/10' : 'text-ink-300'}`}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
