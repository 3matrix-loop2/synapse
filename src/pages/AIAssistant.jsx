import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { askGroq, buildWorkspaceContext, extractActions } from '../services/groq.js'
import { Panel, Textarea, Button } from '../components/ui.jsx'

const SUGGESTIONS = [
  'What should I focus on first today?',
  'Summarize my E-Commerce Website project',
  'Which tasks are overdue or piling up?',
  'Add a task to review the PR by Friday'
]

export default function AIAssistant() {
  const {
    projects, tasks, notes, events, apiKeys,
    assistantMessages, addAssistantMessage, clearAssistantMessages,
    addTask, addNote, addEvent
  } = useApp()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const isFirstRender = useRef(true)

  const hasKey = apiKeys.groq || import.meta.env.VITE_GROQ_API_KEY

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [assistantMessages, loading])

  function runActions(actions) {
    const created = []
    actions.forEach(a => {
      if (a.type === 'task' && a.title) {
        addTask({ title: a.title, due: a.due || '' })
        created.push(`Task: "${a.title}"`)
      } else if (a.type === 'note' && a.title) {
        addNote({ title: a.title, body: a.body || '', tag: a.tag || 'Note' })
        created.push(`Note: "${a.title}"`)
      } else if (a.type === 'event' && a.title && a.date) {
        addEvent({ title: a.title, date: a.date, time: a.time || '—' })
        created.push(`Event: "${a.title}"`)
      }
    })
    return created
  }

  async function send(text) {
    const question = (text ?? input).trim()
    if (!question || loading) return
    setError('')
    setInput('')
    addAssistantMessage({ role: 'user', text: question })
    setLoading(true)
    try {
      const context = buildWorkspaceContext({ projects, tasks, notes, events })
      const key = apiKeys.groq || import.meta.env.VITE_GROQ_API_KEY
      const raw = await askGroq(question, context, key, assistantMessages)
      const { text: replyText, actions } = extractActions(raw)
      addAssistantMessage({ role: 'assistant', text: replyText })
      if (actions.length > 0) {
        const created = runActions(actions)
        if (created.length > 0) {
          addAssistantMessage({ role: 'assistant', text: `✅ Done — created:\n${created.map(c => `• ${c}`).join('\n')}`, isAction: true })
        }
      }
    } catch (e) {
      setError(e.message || 'Something went wrong talking to the assistant.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4 h-[calc(100vh-140px)]">
      <Panel className="p-0 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div>
            <h2 className="font-display text-lg text-ink-50">AI Assistant</h2>
            <p className="text-xs text-ink-300">Ask questions, or ask it to create tasks, notes, and events for you.</p>
          </div>
          {assistantMessages.length > 0 && (
            <button onClick={clearAssistantMessages} className="text-xs text-ink-300 hover:text-red-300">Clear chat</button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {!hasKey && (
            <div className="rounded-lg bg-ember-500/10 border border-ember-500/25 p-4 text-sm text-ember-100">
              Add your Groq API key to the project's <code className="bg-black/20 px-1 rounded">.env</code> file
              as <code className="bg-black/20 px-1 rounded">VITE_GROQ_API_KEY</code> to enable the assistant.
              Free key at console.groq.com/keys — restart the dev server after adding it.
            </div>
          )}

          {assistantMessages.length === 0 && hasKey && (
            <div className="text-center py-10">
              <p className="text-ink-300 text-sm mb-4">Try asking:</p>
              <div className="flex flex-col gap-2 max-w-sm mx-auto">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)} className="text-left text-sm px-3.5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-ink-100 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {assistantMessages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl2 px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  m.role === 'user' ? 'bg-ember-500 text-white' : m.isAction ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-200' : 'bg-white/5 text-ink-100 border border-white/5'
                }`}>
                  {m.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/5 rounded-xl2 px-4 py-2.5 text-sm text-ink-300">Thinking…</div>
            </div>
          )}
          {error && <p className="text-xs text-red-300">{error}</p>}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-white/5 flex gap-2">
          <Textarea
            rows={1}
            placeholder={hasKey ? 'Ask, or say "add a task to..."' : 'Add an API key to .env to start chatting'}
            value={input}
            disabled={!hasKey}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            className="!py-2.5"
          />
          <Button onClick={() => send()} disabled={!hasKey || loading}>Send</Button>
        </div>
      </Panel>

      <Panel title="What the AI can do">
        <ul className="flex flex-col gap-2 text-xs text-ink-300">
          <li>· Answer questions using {projects.length} projects, {tasks.filter(t => !t.done).length} pending tasks, and your recent notes</li>
          <li>· Create tasks — "add a task to..."</li>
          <li>· Create notes — "note that..."</li>
          <li>· Schedule events — "schedule a... on..."</li>
        </ul>
        <p className="text-[11px] text-ink-300 mt-4">Anything it creates shows up instantly across Tasks, Notes, and Calendar — try it.</p>
      </Panel>
    </div>
  )
}
