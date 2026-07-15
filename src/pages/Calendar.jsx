import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Panel, Modal, Input, Button } from '../components/ui.jsx'

const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function Calendar() {
  const { events, addEvent, deleteEvent } = useApp()
  const [cursor, setCursor] = useState(new Date())
  const [selected, setSelected] = useState(new Date().toISOString().slice(0, 10))
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')

  const days = useMemo(() => buildMonth(cursor), [cursor])
  const dayEvents = events.filter(e => e.date === selected)

  function submit() {
    if (!title.trim()) return
    addEvent({ title: title.trim(), date: selected, time: time || '—' })
    setTitle(''); setTime(''); setOpen(false)
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <Panel>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-ink-50">{cursor.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <div className="flex gap-1">
            <NavBtn onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>‹</NavBtn>
            <NavBtn onClick={() => setCursor(new Date())}>Today</NavBtn>
            <NavBtn onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>›</NavBtn>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-ink-300 mb-2">
          {WD.map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            const iso = d ? d.toISOString().slice(0, 10) : null
            const hasEvents = iso && events.some(e => e.date === iso)
            const isToday = iso === new Date().toISOString().slice(0, 10)
            const isSelected = iso === selected
            return (
              <button
                key={i}
                disabled={!d}
                onClick={() => setSelected(iso)}
                className={`aspect-square rounded-lg text-xs flex flex-col items-center justify-center gap-1 transition-colors focus-ring ${
                  !d ? '' : isSelected ? 'bg-ember-500 text-white' : isToday ? 'bg-ember-500/15 text-ember-200' : 'hover:bg-white/5 text-ink-100'
                }`}
              >
                {d && <span>{d.getDate()}</span>}
                {hasEvents && !isSelected && <span className="w-1 h-1 rounded-full bg-ember-400" />}
              </button>
            )
          })}
        </div>
      </Panel>

      <Panel title={fmt(selected)} action={<Button onClick={() => setOpen(true)}>+ Event</Button>}>
        <ul className="flex flex-col gap-2">
          {dayEvents.length === 0 && <p className="text-sm text-ink-300 py-4 text-center">No events scheduled.</p>}
          {dayEvents.map(e => (
            <li key={e.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 group">
              <div>
                <p className="text-sm text-ink-100">{e.title}</p>
                <p className="text-[11px] text-ink-300">{e.time}</p>
              </div>
              <button onClick={() => deleteEvent(e.id)} className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-red-300 text-xs transition-opacity">×</button>
            </li>
          ))}
        </ul>
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title="New Event">
        <div className="flex flex-col gap-3">
          <Input autoFocus placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} />
          <Input placeholder="Time (e.g. 3:00 PM)" value={time} onChange={e => setTime(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          <Button onClick={submit}>Add event</Button>
        </div>
      </Modal>
    </div>
  )
}

function NavBtn({ children, onClick }) {
  return <button onClick={onClick} className="px-2.5 py-1 rounded-md text-xs bg-white/5 hover:bg-white/10 text-ink-100 transition-colors focus-ring">{children}</button>
}

function buildMonth(cursor) {
  const year = cursor.getFullYear(), month = cursor.getMonth()
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array(startPad).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  return cells
}

function fmt(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })
}
