// AI Assistant service — Groq API (OpenAI-compatible chat completions + tools)
// Get a free key at https://console.groq.com/keys
//
// This is the AI Workspace Assistant brain: it sends the model the full
// workspace context plus a set of real tools (see aiTools.js), lets the
// model decide when to call them, executes them against the live workspace,
// and loops the results back until the model has a final answer. There is no
// more fragile ```actions markdown parsing — every create/update/delete goes
// through structured JSON function calling, and the assistant never reports
// success unless a tool call actually returned success:true.

import { TOOL_DEFINITIONS } from './aiTools.js'

const MODEL = 'llama-3.3-70b-versatile'
const MAX_TOOL_ROUNDS = 6

const SYSTEM_PROMPT = `You are Synapse AI, the built-in AI Workspace Assistant inside "Synapse" — a Notion AI / Cursor-style assistant with real access to this user's entire workspace (projects, tasks, notes, events, and remembered facts).

CORE RULES — follow these strictly:
1. You have real tools that read and modify the user's actual workspace. When the user asks you to create, update, delete, rename, move, append to, summarize, or find something, call the appropriate tool — never just describe what you would do.
2. Never say something was created, updated, or deleted unless a tool call actually returned success:true for it. If a tool fails, can't find the target, or returns multiple possible matches, say so honestly and ask the user to clarify instead of guessing or pretending it worked.
3. Detect intent from everyday phrasing — "remember this", "note that", "save this", "delete my docker note", "rename the react project to X", "find firebase", "what did I write yesterday" — no exact command syntax is required.
4. When the user refers to something by name rather than id, and you're not already certain which item they mean from the WORKSPACE CONTEXT below, use search_notes / search_tasks / workspace_search first to find it before updating or deleting. If a tool returns more than one candidate, ask the user which one they mean rather than picking one yourself.
5. When the user shares a fact worth remembering for later ("my interview is July 20", "I prefer dark mode"), call save_memory. Use recall_memory or the REMEMBERED FACTS section below to answer questions about things the user told you previously.
6. For plain questions that don't require changing anything, just answer directly and concisely using the WORKSPACE CONTEXT below — no tool call needed for that.
7. Be concise and practical. Don't narrate internal steps or mention tool/function names to the user — just do the work and report the outcome in plain language.`

async function callGroq(messages, apiKey) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools: TOOL_DEFINITIONS,
      tool_choice: 'auto',
      temperature: 0.3
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Groq request failed (${res.status})`)
  }
  return res.json()
}

// Runs the full ask → (maybe call tools) → respond loop.
// executeTool: async (name, args) => { success, message, data? } — see aiTools.js
// Returns { text, actions } where `actions` is a plain-language log of every
// tool call that actually succeeded, suitable for showing the user what happened.
export async function askGroq({ question, contextText, apiKey, history = [], executeTool }) {
  if (!apiKey) throw new Error('Missing Groq API key')
  if (!executeTool) throw new Error('askGroq requires an executeTool function')

  const messages = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\nWORKSPACE CONTEXT:\n${contextText}` },
    ...history.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text })),
    { role: 'user', content: question }
  ]

  const actions = []

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const data = await callGroq(messages, apiKey)
    const message = data.choices?.[0]?.message
    if (!message) throw new Error('No response from the assistant.')

    if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      // The assistant's own tool-call message must be replayed back before
      // the tool result messages, per the OpenAI/Groq tool-calling protocol.
      messages.push({ role: 'assistant', content: message.content || null, tool_calls: message.tool_calls })

      for (const call of message.tool_calls) {
        let args = {}
        let parseError = null
        try {
          args = call.function?.arguments ? JSON.parse(call.function.arguments) : {}
        } catch {
          parseError = 'Arguments were not valid JSON.'
        }

        let result
        if (parseError) {
          result = { success: false, message: parseError }
        } else {
          try {
            result = await executeTool(call.function.name, args)
          } catch (err) {
            result = { success: false, message: err?.message || 'Tool execution failed unexpectedly.' }
          }
        }

        if (result?.success && result?.message) actions.push(result.message)
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result ?? { success: false, message: 'No result.' })
        })
      }
      continue // give the model another turn to respond to the tool results
    }

    return { text: (message.content || '').trim() || "I couldn't generate a response for that.", actions }
  }

  return {
    text: "I ran into trouble finishing that — it took more steps than expected. Could you try rephrasing it as a smaller request?",
    actions
  }
}

// Builds the full workspace context block the model sees on every turn.
// Includes full note bodies (not just titles), task priority/description,
// project status/description, event descriptions, and remembered facts —
// everything the assistant needs to answer questions and resolve references
// without necessarily needing a search tool call first.
export function buildWorkspaceContext({ projects = [], tasks = [], notes = [], events = [], memories = [] }) {
  const pending = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  const projectLines = projects.slice(0, 40).map(p =>
    `- [id:${p.id}] ${p.name} — ${p.progress ?? 0}% complete${p.status ? `, status: ${p.status}` : ''}${p.description ? `\n  ${p.description}` : ''}`
  ).join('\n') || 'None yet.'

  const taskLines = tasks.slice(0, 60).map(t =>
    `- [id:${t.id}] ${t.done ? '[x]' : '[ ]'} ${t.title}${t.due ? ` (due ${t.due})` : ''}${t.priority ? ` (priority: ${t.priority})` : ''}${t.description ? `\n  ${t.description}` : ''}`
  ).join('\n') || 'No tasks yet.'

  const noteLines = notes.slice(0, 40).map(n =>
    `- [id:${n.id}] "${n.title}" [${n.tag}]\n  ${(n.body || '').slice(0, 500)}`
  ).join('\n') || 'No notes yet.'

  const eventLines = events.slice(0, 30).map(e =>
    `- [id:${e.id}] ${e.title} on ${e.date} at ${e.time || '—'}${e.description ? `\n  ${e.description}` : ''}`
  ).join('\n') || 'Nothing scheduled.'

  const memoryLines = memories.slice(0, 30).map(m => `- ${m.fact}`).join('\n') || 'No stored facts yet.'

  return [
    `PROJECTS (${projects.length}):\n${projectLines}`,
    `TASKS (${pending.length} pending, ${done.length} completed):\n${taskLines}`,
    `NOTES (${notes.length}):\n${noteLines}`,
    `EVENTS (${events.length}):\n${eventLines}`,
    `REMEMBERED FACTS:\n${memoryLines}`
  ].join('\n\n')
}
