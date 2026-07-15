import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { useAuth } from './AuthContext.jsx'
import { db, isFirebaseConfigured } from '../firebase/config.js'

function keyFor(uid) {
  return `synapse:v1:${uid || 'guest'}`
}

const seed = {
  user: { plan: 'Pro Plan', streak: 14 },
  scene: 'sunset',
  projects: [
    { id: 'p1', name: 'E-Commerce Website', progress: 72, updated: '2h ago', color: '#D9722E' },
    { id: 'p2', name: 'Study Planner App', progress: 43, updated: '4h ago', color: '#C9A15A' },
    { id: 'p3', name: 'AI Notes Summarizer', progress: 80, updated: '1d ago', color: '#8FA37E' }
  ],
  notes: [
    { id: 'n1', title: 'React Best Practices', body: 'Keep components small. Lift state only as high as it needs to go. Co-locate logic with the UI that uses it.', tag: 'Dev', created: Date.now() - 1000 * 60 * 60 * 2 },
    { id: 'n2', title: 'Meeting — 10:00 AM', body: 'Review PR #42, discuss database schema for the E-Commerce project.', tag: 'Meeting', created: Date.now() - 1000 * 60 * 60 * 20 },
    { id: 'n3', title: "Don't stop until you're proud.", body: 'Small steps every day lead to big results.', tag: 'Idea', created: Date.now() - 1000 * 60 * 60 * 40 }
  ],
  tasks: [
    { id: 't1', title: 'Design homepage', done: true, due: '10:00 AM', project: 'p1' },
    { id: 't2', title: 'Implement authentication', done: true, due: '12:30 PM', project: 'p2' },
    { id: 't3', title: 'Database integration', done: false, due: '03:00 PM', project: 'p1' },
    { id: 't4', title: 'Write documentation', done: false, due: '05:30 PM', project: 'p3' },
    { id: 't5', title: 'Test & deploy', done: false, due: '07:00 PM', project: 'p1' },
    { id: 't6', title: 'Usability testing', done: false, due: '08:00 PM', project: 'p2' }
  ],
  events: [
    { id: 'e1', title: 'Design review', date: new Date().toISOString().slice(0, 10), time: '10:00 AM' },
    { id: 'e2', title: 'Sprint planning', date: new Date().toISOString().slice(0, 10), time: '02:00 PM' }
  ],
  resources: [
    { id: 'r1', name: 'UI Kit.fig', type: 'design', size: '4.2 MB', uploaded: '1h ago' },
    { id: 'r2', name: 'Brand Guidelines.pdf', type: 'doc', size: '1.8 MB', uploaded: '1d ago' }
  ],
  graph: {
    nodes: [
      { id: 'core', position: { x: 0, y: 0 }, data: { label: 'Synapse' }, type: 'core' },
      { id: 'notes', position: { x: -260, y: -140 }, data: { label: 'Notes' }, type: 'branch' },
      { id: 'ideas', position: { x: 260, y: -140 }, data: { label: 'Ideas' }, type: 'branch' },
      { id: 'tasks', position: { x: 300, y: 120 }, data: { label: 'Tasks' }, type: 'branch' },
      { id: 'resources', position: { x: -300, y: 120 }, data: { label: 'Resources' }, type: 'branch' }
    ],
    edges: [
      { id: 'c-n', source: 'core', target: 'notes' },
      { id: 'c-i', source: 'core', target: 'ideas' },
      { id: 'c-t', source: 'core', target: 'tasks' },
      { id: 'c-r', source: 'core', target: 'resources' }
    ]
  },
  activity: [
    { id: 'a1', type: 'note', text: 'You created a new note "React Best Practices"', time: '2m ago' },
    { id: 'a2', type: 'task', text: 'Task "Design Dashboard" completed', time: '15m ago' },
    { id: 'a3', type: 'file', text: 'File uploaded — UI Kit.fig', time: '1h ago' },
    { id: 'a4', type: 'project', text: 'Project "E-Commerce Website" updated', time: '2h ago' }
  ],
  focusMinutes: 25,
  weeklyFocus: [
    { day: 'Mon', minutes: 90 }, { day: 'Tue', minutes: 140 }, { day: 'Wed', minutes: 60 },
    { day: 'Thu', minutes: 170 }, { day: 'Fri', minutes: 110 }, { day: 'Sat', minutes: 40 }, { day: 'Sun', minutes: 25 }
  ],
  followRealWorld: true,
  weather: null,
  apiKeys: { openWeather: '', gemini: '', groq: '' },
  assistantMessages: [],
  musicUri: ''
}

function load(key) {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return { ...seed, ...JSON.parse(raw) }
  } catch (e) { /* ignore corrupt storage */ }
  return seed
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { user: authUser } = useAuth()
  const [uid, setUid] = useState(authUser?.uid || null)
  const [state, setState] = useState(() => load(keyFor(authUser?.uid)))
  const [cloudReady, setCloudReady] = useState(!isFirebaseConfigured) // no cloud to wait for in local mode
  const remoteEcho = useRef(false) // true while applying data that just came FROM Firestore, to avoid writing it straight back

  // Reload the right local slice whenever the signed-in user changes
  useEffect(() => {
    if ((authUser?.uid || null) !== uid) {
      setUid(authUser?.uid || null)
      setState(load(keyFor(authUser?.uid)))
      setCloudReady(!isFirebaseConfigured)
    }
  }, [authUser?.uid, uid])

  // Cloud sync: when real Firebase credentials are present, each signed-in
  // user's workspace lives at Firestore doc workspaces/{uid} and stays in
  // sync in real time (works across tabs/devices). Until then, everything
  // still works fully offline via localStorage below.
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !uid) return
    const ref = doc(db, 'workspaces', uid)
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        remoteEcho.current = true
        setState(s => ({ ...s, ...snap.data() }))
      } else {
        setDoc(ref, state).catch(err => console.warn('Synapse: initial cloud sync failed', err))
      }
      setCloudReady(true)
    }, (err) => {
      console.warn('Synapse: cloud sync unavailable, continuing offline:', err.message)
      setCloudReady(true)
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  // Local cache — always on, keeps the app instant and usable offline
  useEffect(() => {
    localStorage.setItem(keyFor(uid), JSON.stringify(state))
  }, [state, uid])

  // Push local changes to the cloud, skipping writes that just arrived FROM the cloud
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !uid) return
    if (remoteEcho.current) { remoteEcho.current = false; return }
    const ref = doc(db, 'workspaces', uid)
    const timeout = setTimeout(() => {
      setDoc(ref, state, { merge: true }).catch(err => console.warn('Synapse: cloud save failed', err))
    }, 400) // small debounce so rapid edits (typing, dragging) don't spam writes
    return () => clearTimeout(timeout)
  }, [state, uid])

  const logActivity = useCallback((text, type = 'note') => {
    setState(s => ({
      ...s,
      activity: [{ id: 'a' + Date.now(), type, text, time: 'just now' }, ...s.activity].slice(0, 20)
    }))
  }, [])

  const addNote = useCallback((note) => {
    const n = { id: 'n' + Date.now(), created: Date.now(), tag: 'Note', ...note }
    setState(s => ({ ...s, notes: [n, ...s.notes] }))
    logActivity(`You created a new note "${n.title}"`, 'note')
  }, [logActivity])

  const deleteNote = useCallback((id) => {
    setState(s => ({ ...s, notes: s.notes.filter(n => n.id !== id) }))
  }, [])

  const updateNote = useCallback((id, patch) => {
    setState(s => ({ ...s, notes: s.notes.map(n => n.id === id ? { ...n, ...patch } : n) }))
  }, [])

  const addTask = useCallback((task) => {
    const t = { id: 't' + Date.now(), done: false, status: 'todo', due: '', project: null, subtasks: [], ...task }
    if (t.done && t.status === 'todo') t.status = 'done'
    setState(s => ({ ...s, tasks: [...s.tasks, t] }))
    logActivity(`New task added: "${t.title}"`, 'task')
  }, [logActivity])

  const toggleTask = useCallback((id) => {
    setState(s => {
      const t = s.tasks.find(x => x.id === id)
      if (t && !t.done) logActivity(`Task "${t.title}" completed`, 'task')
      return {
        ...s,
        tasks: s.tasks.map(x => x.id === id ? { ...x, done: !x.done, status: !x.done ? 'done' : 'todo' } : x)
      }
    })
  }, [logActivity])

  const setTaskStatus = useCallback((id, status) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => t.id === id ? { ...t, status, done: status === 'done' } : t)
    }))
  }, [])

  const updateTask = useCallback((id, patch) => {
    setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, ...patch } : t) }))
  }, [])

  const addSubtask = useCallback((taskId, title) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => t.id === taskId
        ? { ...t, subtasks: [...(t.subtasks || []), { id: 'sub' + Date.now(), title, done: false }] }
        : t)
    }))
  }, [])

  const toggleSubtask = useCallback((taskId, subId) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => t.id === taskId
        ? { ...t, subtasks: (t.subtasks || []).map(st => st.id === subId ? { ...st, done: !st.done } : st) }
        : t)
    }))
  }, [])

  const deleteSubtask = useCallback((taskId, subId) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => t.id === taskId
        ? { ...t, subtasks: (t.subtasks || []).filter(st => st.id !== subId) }
        : t)
    }))
  }, [])

  const deleteTask = useCallback((id) => {
    setState(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== id) }))
  }, [])

  const addProject = useCallback((project) => {
    const p = { id: 'p' + Date.now(), progress: 0, updated: 'just now', color: '#D9722E', autoTrack: false, ...project }
    setState(s => ({ ...s, projects: [p, ...s.projects] }))
    logActivity(`Project "${p.name}" created`, 'project')
  }, [logActivity])

  const updateProject = useCallback((id, patch) => {
    setState(s => ({ ...s, projects: s.projects.map(p => p.id === id ? { ...p, ...patch, updated: 'just now' } : p) }))
  }, [])

  const deleteProject = useCallback((id) => {
    setState(s => ({ ...s, projects: s.projects.filter(p => p.id !== id) }))
  }, [])

  const addEvent = useCallback((event) => {
    const e = { id: 'e' + Date.now(), ...event }
    setState(s => ({ ...s, events: [...s.events, e] }))
    logActivity(`Event scheduled: "${e.title}"`, 'note')
  }, [logActivity])

  const deleteEvent = useCallback((id) => {
    setState(s => ({ ...s, events: s.events.filter(e => e.id !== id) }))
  }, [])

  const addResource = useCallback((resource) => {
    const r = { id: 'r' + Date.now(), uploaded: 'just now', ...resource }
    setState(s => ({ ...s, resources: [r, ...s.resources] }))
    logActivity(`File uploaded — ${r.name}`, 'file')
  }, [logActivity])

  const deleteResource = useCallback((id) => {
    setState(s => ({ ...s, resources: s.resources.filter(r => r.id !== id) }))
  }, [])

  const setScene = useCallback((scene) => {
    setState(s => ({ ...s, scene }))
  }, [])

  const setFollowRealWorld = useCallback((val) => {
    setState(s => ({ ...s, followRealWorld: val }))
  }, [])

  const setWeather = useCallback((weather) => {
    setState(s => ({ ...s, weather }))
  }, [])

  const setApiKeys = useCallback((patch) => {
    setState(s => ({ ...s, apiKeys: { ...s.apiKeys, ...patch } }))
  }, [])

  const addAssistantMessage = useCallback((message) => {
    setState(s => ({ ...s, assistantMessages: [...s.assistantMessages, message].slice(-50) }))
  }, [])

  const clearAssistantMessages = useCallback(() => {
    setState(s => ({ ...s, assistantMessages: [] }))
  }, [])

  const setMusicUri = useCallback((uri) => {
    setState(s => ({ ...s, musicUri: uri }))
  }, [])

  const updateGraph = useCallback((graph) => {
    setState(s => ({ ...s, graph }))
  }, [])

  const logFocusSession = useCallback((minutes) => {
    setState(s => {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'short' })
      const weeklyFocus = s.weeklyFocus.map(d => d.day === today ? { ...d, minutes: d.minutes + minutes } : d)
      return { ...s, weeklyFocus }
    })
    logActivity(`Completed a ${minutes}-minute focus session`, 'task')
  }, [logActivity])

  const exportWorkspace = useCallback(() => {
    setState(s => {
      const { apiKeys, assistantMessages, ...safe } = s // leave keys/chat history out of the export
      const blob = new Blob([JSON.stringify(safe, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `synapse-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      return s
    })
  }, [])

  const value = {
    ...state,
    user: { ...state.user, name: authUser?.name || 'Guest', email: authUser?.email || '' },
    isFirebaseConfigured, cloudReady,
    addNote, deleteNote, updateNote,
    addTask, toggleTask, deleteTask, setTaskStatus, updateTask,
    addSubtask, toggleSubtask, deleteSubtask,
    addProject, updateProject, deleteProject,
    addEvent, deleteEvent,
    addResource, deleteResource,
    setScene, updateGraph, logFocusSession, logActivity,
    setFollowRealWorld, setWeather, setApiKeys,
    addAssistantMessage, clearAssistantMessages, setMusicUri,
    exportWorkspace
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
