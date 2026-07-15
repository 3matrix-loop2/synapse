// AI Tool Executor — structured JSON tool calling for the Synapse AI Assistant.
//
// This replaces the old fragile ```actions markdown-block parsing with real
// OpenAI/Groq-style function tools. The model calls a tool by name with JSON
// arguments; `createToolExecutor` maps that call onto the real AppContext
// CRUD functions and returns a structured { success, message, data } result
// that gets fed straight back to the model so it always knows what actually
// happened (never guesses, never claims success on a failed action).

// ---------------------------------------------------------------------------
// Tool schemas (OpenAI-compatible "tools" format, understood by Groq's API)
// ---------------------------------------------------------------------------

function tool(name, description, properties, required = []) {
  return {
    type: 'function',
    function: { name, description, parameters: { type: 'object', properties, required } }
  }
}

const idOrMatch = (label) => ({
  id: { type: 'string', description: `Exact ${label} id, if already known from earlier context or a prior tool result.` },
  match: { type: 'string', description: `Title/name (or a distinctive fragment of it) to look the ${label} up by, when the id isn't known. Case-insensitive, partial match is fine.` }
})

export const TOOL_DEFINITIONS = [
  tool('create_note', 'Create a new note in the workspace.', {
    title: { type: 'string', description: 'Note title.' },
    body: { type: 'string', description: 'Note body/content.' },
    tag: { type: 'string', description: 'One of: Note, Idea, Dev, Meeting.' }
  }, ['title']),

  tool('update_note', 'Update an existing note (title, body, and/or tag). Also used to rename or append to a note — for append, pass the full new body including the old content plus the addition.', {
    ...idOrMatch('note'),
    title: { type: 'string', description: 'New title, if renaming.' },
    body: { type: 'string', description: 'New full body text, if changing/appending content.' },
    tag: { type: 'string', description: 'New tag: Note, Idea, Dev, or Meeting.' }
  }),

  tool('delete_note', 'Permanently delete a note.', idOrMatch('note')),

  tool('search_notes', 'Full-text search across all note titles and bodies.', {
    query: { type: 'string', description: 'Search text.' }
  }, ['query']),

  tool('create_task', 'Create a new task.', {
    title: { type: 'string' },
    due: { type: 'string', description: 'Due date/time as free text, e.g. "Friday" or "2026-07-20 5:00 PM".' },
    priority: { type: 'string', description: 'low, normal, or high.' },
    description: { type: 'string' },
    project: { type: 'string', description: 'Project id this task belongs to, if known.' }
  }, ['title']),

  tool('update_task', 'Update an existing task — title, due date, priority, description, project, or completion status.', {
    ...idOrMatch('task'),
    title: { type: 'string' },
    due: { type: 'string' },
    priority: { type: 'string' },
    description: { type: 'string' },
    done: { type: 'boolean', description: 'Mark complete (true) or incomplete (false).' }
  }),

  tool('delete_task', 'Permanently delete a task.', idOrMatch('task')),

  tool('search_tasks', 'Full-text search across all task titles and descriptions.', {
    query: { type: 'string' }
  }, ['query']),

  tool('create_event', 'Schedule a new calendar event.', {
    title: { type: 'string' },
    date: { type: 'string', description: 'YYYY-MM-DD' },
    time: { type: 'string', description: 'e.g. "10:00 AM"' },
    description: { type: 'string' }
  }, ['title', 'date']),

  tool('update_event', 'Update an existing event — title, date, time, or description.', {
    ...idOrMatch('event'),
    title: { type: 'string' },
    date: { type: 'string' },
    time: { type: 'string' },
    description: { type: 'string' }
  }),

  tool('delete_event', 'Permanently delete an event.', idOrMatch('event')),

  tool('create_project', 'Create a new project.', {
    name: { type: 'string' },
    description: { type: 'string' },
    status: { type: 'string', description: 'e.g. planning, active, blocked, done.' },
    progress: { type: 'number', description: '0-100.' }
  }, ['name']),

  tool('update_project', 'Update an existing project — name, description, status, or progress. Also used to rename a project.', {
    ...idOrMatch('project'),
    name: { type: 'string' },
    description: { type: 'string' },
    status: { type: 'string' },
    progress: { type: 'number' }
  }),

  tool('delete_project', 'Permanently delete a project.', idOrMatch('project')),

  tool('workspace_search', 'Search across everything in the workspace at once — notes, tasks, projects, and events — by title/body/description text. Use this for broad questions like "find firebase" or "what did I write about the API".', {
    query: { type: 'string' }
  }, ['query']),

  tool('save_memory', 'Remember a fact the user told you for future conversations (e.g. "my interview is July 20", "I prefer dark mode"). Use whenever the user shares something worth recalling later.', {
    fact: { type: 'string', description: 'The fact to remember, written as a short, self-contained statement.' }
  }, ['fact']),

  tool('recall_memory', 'Search previously remembered facts about the user.', {
    query: { type: 'string', description: 'What to search for. Leave empty-ish (e.g. "recent") to just list the latest facts.' }
  }, ['query'])
]

// ---------------------------------------------------------------------------
// Matching helpers
// ---------------------------------------------------------------------------

function norm(s) {
  return (s || '').toString().toLowerCase().trim()
}

// Finds an item by exact id, then exact name match, then substring match.
// Returns { item, ambiguous: [...] } — ambiguous is populated when more than
// one item substring-matches and none was an exact match, so the caller can
// ask the model to disambiguate instead of silently picking the wrong one.
function resolve(list, { id, match }, nameFields) {
  if (id) {
    const byId = list.find(x => x.id === id)
    if (byId) return { item: byId }
  }
  if (!match) return { item: null }
  const q = norm(match)
  const exact = list.find(x => nameFields.some(f => norm(x[f]) === q))
  if (exact) return { item: exact }
  const partial = list.filter(x => nameFields.some(f => norm(x[f]).includes(q)))
  if (partial.length === 1) return { item: partial[0] }
  if (partial.length > 1) return { item: null, ambiguous: partial }
  return { item: null }
}

function notFound(kind, args, ambiguous) {
  if (ambiguous?.length) {
    return {
      success: false,
      message: `Found ${ambiguous.length} ${kind}s matching "${args.match}" — ask the user which one they mean.`,
      candidates: ambiguous.map(x => ({ id: x.id, label: x.title || x.name }))
    }
  }
  return { success: false, message: `No ${kind} found matching "${args.match || args.id || ''}". Double check with search_${kind}s or workspace_search, or ask the user for more detail.` }
}

function snippet(text, query, radius = 60) {
  if (!text) return ''
  const i = norm(text).indexOf(norm(query))
  if (i === -1) return text.slice(0, 120)
  const start = Math.max(0, i - radius)
  return (start > 0 ? '…' : '') + text.slice(start, i + query.length + radius) + '…'
}

// ---------------------------------------------------------------------------
// Executor — bound to a live AppContext value for one AI turn
// ---------------------------------------------------------------------------

// `app` is the object returned by useApp(). We keep local mirror arrays that
// start as a copy of the current state and get updated in place as tools run,
// so a chain of tool calls within the same turn (e.g. create a note, then
// immediately search for it) sees consistent, up-to-date data even though the
// real React state update is async.
export function createToolExecutor(app) {
  const local = {
    notes: [...app.notes],
    tasks: [...app.tasks],
    projects: [...app.projects],
    events: [...app.events],
    memories: [...(app.memories || [])]
  }

  async function execute(name, args = {}) {
    switch (name) {
      // ---- Notes ----------------------------------------------------
      case 'create_note': {
        if (!args.title) return { success: false, message: 'A title is required to create a note.' }
        const n = app.addNote({ title: args.title, body: args.body || '', tag: args.tag || 'Note' })
        local.notes = [n, ...local.notes]
        return { success: true, message: `Created note "${n.title}".`, data: { id: n.id } }
      }
      case 'update_note': {
        const { item, ambiguous } = resolve(local.notes, args, ['title'])
        if (!item) return notFound('note', args, ambiguous)
        const patch = {}
        if (args.title) patch.title = args.title
        if (args.body !== undefined) patch.body = args.body
        if (args.tag) patch.tag = args.tag
        app.updateNote(item.id, patch)
        local.notes = local.notes.map(n => n.id === item.id ? { ...n, ...patch } : n)
        return { success: true, message: `Updated note "${patch.title || item.title}".`, data: { id: item.id } }
      }
      case 'delete_note': {
        const { item, ambiguous } = resolve(local.notes, args, ['title'])
        if (!item) return notFound('note', args, ambiguous)
        app.deleteNote(item.id)
        local.notes = local.notes.filter(n => n.id !== item.id)
        return { success: true, message: `Deleted note "${item.title}".` }
      }
      case 'search_notes': {
        const q = norm(args.query)
        const hits = local.notes.filter(n => norm(n.title).includes(q) || norm(n.body).includes(q))
        return {
          success: true,
          message: `Found ${hits.length} note(s) matching "${args.query}".`,
          data: hits.slice(0, 15).map(n => ({ id: n.id, title: n.title, tag: n.tag, snippet: snippet(n.body, args.query) }))
        }
      }

      // ---- Tasks ------------------------------------------------------
      case 'create_task': {
        if (!args.title) return { success: false, message: 'A title is required to create a task.' }
        const t = app.addTask({
          title: args.title,
          due: args.due || '',
          priority: args.priority || 'normal',
          description: args.description || '',
          project: args.project || null
        })
        local.tasks = [...local.tasks, t]
        return { success: true, message: `Created task "${t.title}".`, data: { id: t.id } }
      }
      case 'update_task': {
        const { item, ambiguous } = resolve(local.tasks, args, ['title'])
        if (!item) return notFound('task', args, ambiguous)
        const patch = {}
        if (args.title) patch.title = args.title
        if (args.due !== undefined) patch.due = args.due
        if (args.priority) patch.priority = args.priority
        if (args.description !== undefined) patch.description = args.description
        if (typeof args.done === 'boolean') { patch.done = args.done; patch.status = args.done ? 'done' : 'todo' }
        app.updateTask(item.id, patch)
        local.tasks = local.tasks.map(t => t.id === item.id ? { ...t, ...patch } : t)
        return { success: true, message: `Updated task "${patch.title || item.title}".`, data: { id: item.id } }
      }
      case 'delete_task': {
        const { item, ambiguous } = resolve(local.tasks, args, ['title'])
        if (!item) return notFound('task', args, ambiguous)
        app.deleteTask(item.id)
        local.tasks = local.tasks.filter(t => t.id !== item.id)
        return { success: true, message: `Deleted task "${item.title}".` }
      }
      case 'search_tasks': {
        const q = norm(args.query)
        const hits = local.tasks.filter(t => norm(t.title).includes(q) || norm(t.description).includes(q))
        return {
          success: true,
          message: `Found ${hits.length} task(s) matching "${args.query}".`,
          data: hits.slice(0, 15).map(t => ({ id: t.id, title: t.title, done: t.done, due: t.due }))
        }
      }

      // ---- Events -------------------------------------------------------
      case 'create_event': {
        if (!args.title || !args.date) return { success: false, message: 'A title and date (YYYY-MM-DD) are required to create an event.' }
        const e = app.addEvent({ title: args.title, date: args.date, time: args.time || '—', description: args.description || '' })
        local.events = [...local.events, e]
        return { success: true, message: `Scheduled event "${e.title}" on ${e.date}.`, data: { id: e.id } }
      }
      case 'update_event': {
        const { item, ambiguous } = resolve(local.events, args, ['title'])
        if (!item) return notFound('event', args, ambiguous)
        const patch = {}
        if (args.title) patch.title = args.title
        if (args.date) patch.date = args.date
        if (args.time) patch.time = args.time
        if (args.description !== undefined) patch.description = args.description
        if (!app.updateEvent) return { success: false, message: 'Event updates are not supported in this workspace yet.' }
        app.updateEvent(item.id, patch)
        local.events = local.events.map(e => e.id === item.id ? { ...e, ...patch } : e)
        return { success: true, message: `Updated event "${patch.title || item.title}".`, data: { id: item.id } }
      }
      case 'delete_event': {
        const { item, ambiguous } = resolve(local.events, args, ['title'])
        if (!item) return notFound('event', args, ambiguous)
        app.deleteEvent(item.id)
        local.events = local.events.filter(e => e.id !== item.id)
        return { success: true, message: `Deleted event "${item.title}".` }
      }

      // ---- Projects -------------------------------------------------------
      case 'create_project': {
        if (!args.name) return { success: false, message: 'A name is required to create a project.' }
        const p = app.addProject({ name: args.name, description: args.description || '', status: args.status || 'planning', progress: args.progress ?? 0 })
        local.projects = [p, ...local.projects]
        return { success: true, message: `Created project "${p.name}".`, data: { id: p.id } }
      }
      case 'update_project': {
        const { item, ambiguous } = resolve(local.projects, args, ['name'])
        if (!item) return notFound('project', { ...args, match: args.match }, ambiguous)
        const patch = {}
        if (args.name) patch.name = args.name
        if (args.description !== undefined) patch.description = args.description
        if (args.status) patch.status = args.status
        if (typeof args.progress === 'number') patch.progress = args.progress
        app.updateProject(item.id, patch)
        local.projects = local.projects.map(p => p.id === item.id ? { ...p, ...patch } : p)
        return { success: true, message: `Updated project "${patch.name || item.name}".`, data: { id: item.id } }
      }
      case 'delete_project': {
        const { item, ambiguous } = resolve(local.projects, args, ['name'])
        if (!item) return notFound('project', args, ambiguous)
        app.deleteProject(item.id)
        local.projects = local.projects.filter(p => p.id !== item.id)
        return { success: true, message: `Deleted project "${item.name}".` }
      }

      // ---- Cross-workspace search -----------------------------------------
      case 'workspace_search': {
        const q = norm(args.query)
        const notes = local.notes.filter(n => norm(n.title).includes(q) || norm(n.body).includes(q))
          .map(n => ({ type: 'note', id: n.id, title: n.title, snippet: snippet(n.body, args.query) }))
        const tasks = local.tasks.filter(t => norm(t.title).includes(q) || norm(t.description).includes(q))
          .map(t => ({ type: 'task', id: t.id, title: t.title, done: t.done }))
        const projects = local.projects.filter(p => norm(p.name).includes(q) || norm(p.description).includes(q))
          .map(p => ({ type: 'project', id: p.id, title: p.name, status: p.status }))
        const events = local.events.filter(e => norm(e.title).includes(q) || norm(e.description).includes(q))
          .map(e => ({ type: 'event', id: e.id, title: e.title, date: e.date }))
        const results = [...notes, ...tasks, ...projects, ...events]
        return { success: true, message: `Found ${results.length} result(s) across the workspace for "${args.query}".`, data: results.slice(0, 20) }
      }

      // ---- Memory -----------------------------------------------------------
      case 'save_memory': {
        if (!args.fact) return { success: false, message: 'Nothing to remember — fact was empty.' }
        if (!app.addMemory) return { success: false, message: 'Memory is not supported in this workspace yet.' }
        const m = app.addMemory(args.fact)
        local.memories = [m, ...local.memories]
        return { success: true, message: `Remembered: "${args.fact}".`, data: { id: m.id } }
      }
      case 'recall_memory': {
        const q = norm(args.query)
        const hits = q
          ? local.memories.filter(m => norm(m.fact).includes(q))
          : local.memories
        return {
          success: true,
          message: `Found ${hits.length} remembered fact(s).`,
          data: hits.slice(0, 15).map(m => ({ id: m.id, fact: m.fact }))
        }
      }

      default:
        return { success: false, message: `Unknown tool "${name}".` }
    }
  }

  return execute
}
