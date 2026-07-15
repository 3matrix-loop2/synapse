import React, { useMemo } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'
import { useApp } from '../context/AppContext.jsx'
import { Panel } from '../components/ui.jsx'

const COLORS = ['#D9722E', '#C9A15A', '#8FA37E', '#6E9BC9', '#B071C9']

export default function Analytics() {
  const { weeklyFocus, tasks, projects } = useApp()

  const taskSplit = useMemo(() => ([
    { name: 'Completed', value: tasks.filter(t => t.done).length },
    { name: 'Pending', value: tasks.filter(t => !t.done).length }
  ]), [tasks])

  const projectData = useMemo(() =>
    projects.map(p => ({ name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name, progress: p.progress, fill: p.color })),
    [projects]
  )

  const totalFocus = weeklyFocus.reduce((a, d) => a + d.minutes, 0)
  const avgFocus = Math.round(totalFocus / weeklyFocus.length)

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-2xl text-ink-50">Analytics</h1>
        <p className="text-ink-300 text-sm mt-1">How your week is actually going.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <Stat label="Weekly focus" value={`${Math.floor(totalFocus / 60)}h ${totalFocus % 60}m`} />
        <Stat label="Daily average" value={`${avgFocus}m`} />
        <Stat label="Tasks completed" value={`${taskSplit[0].value}/${tasks.length}`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Panel title="Focus Minutes — This Week">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weeklyFocus}>
              <defs>
                <linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D9722E" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#D9722E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A251E" vertical={false} />
              <XAxis dataKey="day" stroke="#877D6C" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#877D6C" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1D1A15', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="minutes" stroke="#D9722E" strokeWidth={2} fill="url(#focusFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Task Completion">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={taskSplit} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {taskSplit.map((entry, i) => <Cell key={i} fill={i === 0 ? '#D9722E' : '#3D372D'} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1D1A15', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="Project Progress">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={projectData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A251E" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} stroke="#877D6C" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" stroke="#877D6C" fontSize={12} tickLine={false} axisLine={false} width={110} />
            <Tooltip contentStyle={{ background: '#1D1A15', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="progress" radius={[0, 6, 6, 0]}>
              {projectData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="glass-panel rounded-xl2 shadow-panel p-5">
      <p className="text-xs text-ink-300 mb-1.5">{label}</p>
      <p className="font-display text-2xl text-ink-50">{value}</p>
    </div>
  )
}
