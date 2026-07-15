// AI Assistant service — Groq API (OpenAI-compatible chat completions)
// Get a free key at https://console.groq.com/keys

const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are Synapse AI, the built-in assistant inside "Synapse", a visual workspace app.
Answer questions about the user's projects, notes, and tasks using the workspace context below when relevant. Be concise, practical, and specific.

You can also take action on the workspace when the user clearly asks you to create or schedule something (e.g. "add a task to...", "remind me to...", "note that...", "schedule a...", "create a task for..."). To do this, end your reply with a single fenced block like this, containing a JSON array of actions — only include it when the user actually asked you to create something, never for plain questions:

\`\`\`actions
[{ "type": "task", "title": "Review the PR", "due": "Friday" }]
\`\`\`

Valid action types and their fields:
- {"type": "task", "title": string, "due"?: string}
- {"type": "note", "title": string, "body"?: string, "tag"?: "Note"|"Idea"|"Dev"|"Meeting"}
- {"type": "event", "title": string, "date": "YYYY-MM-DD", "time"?: string}

Write your normal conversational reply first, then the actions block after it if needed. Never mention the actions block itself in your reply text — the app handles showing the user what was created.`

export async function askGroq(question, contextText, apiKey, history = []) {
  if (!apiKey) throw new Error('Missing Groq API key')

  const messages = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\nWORKSPACE CONTEXT:\n${contextText}` },
    ...history.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text
    })),
    { role: 'user', content: question }
  ]

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.7 })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Groq request failed (${res.status})`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || "I couldn't generate a response for that."
}

// Splits a raw model reply into the text to display and any structured
// actions it asked to perform (see the ```actions fenced block in the prompt).
export function extractActions(rawText) {
  const match = rawText.match(/```actions\s*([\s\S]*?)```/)
  if (!match) return { text: rawText.trim(), actions: [] }

  const text = rawText.slice(0, match.index).trim()
  try {
    const actions = JSON.parse(match[1].trim())
    return { text, actions: Array.isArray(actions) ? actions : [] }
  } catch {
    return { text, actions: [] }
  }
}

export function buildWorkspaceContext({ projects, tasks, notes, events }) {
  const pending = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  const projectLines = projects
    .map(p => `- ${p.name} (${p.progress}% complete, updated ${p.updated})`)
    .join('\n') || 'None yet.'

  const taskLines = pending.slice(0, 20)
    .map(t => `- [ ] ${t.title}${t.due ? ` (due ${t.due})` : ''}`)
    .join('\n') || 'No pending tasks.'

  const noteLines = notes.slice(0, 10)
    .map(n => `- "${n.title}" [${n.tag}]`)
    .join('\n') || 'No notes yet.'

  const eventLines = events.slice(0, 10)
    .map(e => `- ${e.title} on ${e.date} at ${e.time}`)
    .join('\n') || 'Nothing scheduled.'

  return [
    `PROJECTS:\n${projectLines}`,
    `PENDING TASKS (${pending.length} pending, ${done.length} completed):\n${taskLines}`,
    `RECENT NOTES:\n${noteLines}`,
    `UPCOMING EVENTS:\n${eventLines}`
  ].join('\n\n')
}
