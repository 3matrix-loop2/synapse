import React, { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './components/Sidebar.jsx'
import TopBar from './components/TopBar.jsx'
import MobileNav from './components/MobileNav.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import DeskHotspots from './components/DeskHotspots.jsx'
import Auth from './pages/Auth.jsx'
import MyDesk from './pages/MyDesk.jsx'
import Projects from './pages/Projects.jsx'
import Notes from './pages/Notes.jsx'
import Tasks from './pages/Tasks.jsx'
import Calendar from './pages/Calendar.jsx'
import KnowledgeGraph from './pages/KnowledgeGraph.jsx'
import AIAssistant from './pages/AIAssistant.jsx'
import MapView from './pages/MapView.jsx'
import Resources from './pages/Resources.jsx'
import Analytics from './pages/Analytics.jsx'
import FocusMode from './pages/FocusMode.jsx'
import { useApp } from './context/AppContext.jsx'
import useAutoTheme from './hooks/useAutoTheme.js'
import { sceneTint, sceneBrightness, seasonTint, getSeason } from './utils/theme.js'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/*" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
    </Routes>
  )
}

function Workspace() {
  const { scene } = useApp()
  const location = useLocation()
  useAutoTheme()

  useEffect(() => {
    const season = getSeason()
    // Layer the time/weather tint over the seasonal wash — background
    // accepts a comma list of gradients, so both read clearly at once.
    const tint = [sceneTint[scene], seasonTint[season]].filter(Boolean).join(', ')
    document.documentElement.style.setProperty('--scene-tint', tint || 'transparent')
    document.documentElement.style.setProperty('--scene-brightness', sceneBrightness[scene] ?? 1)
  }, [scene])

  const isDesk = location.pathname === '/'

  return (
    <div className="min-h-screen relative">
      <div className="desk-backdrop" />
      {isDesk && <DeskHotspots />}
      <div className="relative z-10 flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 p-4 md:p-6">
            <PageTransition>
              <Routes>
                <Route path="/" element={<MyDesk />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/graph" element={<KnowledgeGraph />} />
                <Route path="/assistant" element={<AIAssistant />} />
                <Route path="/map" element={<MapView />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/focus" element={<FocusMode />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageTransition>
          </main>
        </div>
      </div>
      <MobileNav />
    </div>
  )
}

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function NotFound() {
  return (
    <div className="text-center py-24">
      <p className="font-display text-3xl text-ink-50 mb-2">Nothing here yet</p>
      <p className="text-ink-300 text-sm">That page doesn't exist in this workspace.</p>
    </div>
  )
}
