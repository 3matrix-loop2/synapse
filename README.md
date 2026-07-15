# Synapse — Intelligent Visual Workspace

A visual workspace for projects, notes, tasks, calendar, resources, analytics,
a knowledge graph, live weather, a map, music, and a Groq-powered AI
assistant — behind real sign-in, with your data synced to the cloud, in an
interface that shifts its mood with the real-world time, weather, and
season, and switches between dark/light and two accent palettes.

## Stack
React 18 · Vite · JavaScript (ES6+) · Tailwind CSS · React Router · Context API ·
Firebase Auth / Firestore / Storage · React Flow · Framer Motion · Recharts ·
React Markdown · OpenWeatherMap API · Groq API · Leaflet (OpenStreetMap) ·
Spotify Embed

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). You'll land on the
sign-in screen first.

```bash
npm run build     # production build → dist/
npm run preview   # preview the production build locally
```

## What's new in this update

- **Real search (⌘K)** — the search bar is now a working command palette
  that fuzzy-matches across notes, tasks, projects, and resources and jumps
  straight to the result. `src/components/CommandPalette.jsx`
- **Kanban board for Tasks** — toggle List/Board on the Tasks page; drag
  cards between To Do / In Progress / Done. `src/components/KanbanBoard.jsx`
- **Subtasks/checklists** — expand any task in List view to add a checklist
  under it.
- **AI Assistant can now take action**, not just answer — ask it to "add a
  task to...", "note that...", or "schedule a... on..." and it creates the
  real task/note/event directly. `src/services/groq.js` (`extractActions`)
- **Project backlinks** — project cards now show "Mentioned in N notes" and
  linked task counts, computed live from your actual data.
- **Export your data** — top-right user menu → "Export data (.json)"
  downloads your full workspace.
- **Installable PWA** — Synapse can now be installed to your home
  screen/desktop and has basic offline support via a lightweight service
  worker (`public/sw.js`, `public/manifest.json`) — no extra build plugin
  or `npm install` needed for this.
- Switched the AI Assistant from Gemini to **Groq (Llama 3.3 70B)** — much
  more generous free-tier limits.
- API keys are now **`.env`-only** — the in-app key entry fields were
  removed from Appearance and the AI Assistant page, so keys never get
  saved into localStorage or Firestore by accident.

---

## ⚠️ Before you deploy: connect real Firebase

The app runs immediately with **local demo auth + localStorage**, which is
great for trying it out — but local storage never leaves the browser it was
created in, so after deploying, every visitor would get their own empty,
disconnected workspace with no real accounts. **For a real deployment, set
up Firebase first** (it's free and takes about five minutes):

1. Create a project at https://console.firebase.google.com
2. **Authentication** → Sign-in method → enable **Email/Password** (and
   **Google** if you want that button to work)
3. **Firestore Database** → Create database → start in production mode
4. **Storage** → Get started (default settings are fine)
5. Project settings → your web app (create one if you haven't) → copy the
   config object
6. Paste it into `src/firebase/config.js`, replacing the `YOUR_...` placeholders

That's it — no other code changes. The moment real credentials are present,
`AuthContext` and `AppContext` automatically switch from local-only mode to:

- **Real accounts** via Firebase Auth
- **Real cloud data** — every project/note/task/event/resource/graph change
  is saved to Firestore at `workspaces/{your-uid}`, live-synced in real time
  (open the app in two tabs or two devices signed into the same account and
  watch changes appear on both)
- **Real file storage** — uploads on the Resources page go to Firebase
  Storage under `users/{your-uid}/resources/...` and get a real, permanent
  download URL

localStorage is still used underneath as an instant local cache (so the UI
never feels laggy waiting on the network), but Firestore is the source of
truth once configured. You'll see a **"Synced" / "Local only"** badge in the
top bar telling you which mode is active.

**Lock down access before going live**: this repo includes
`firestore.rules` and `storage.rules`, which restrict every user to only
their own data. Deploy them with the Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase use --add        # pick your project
firebase deploy --only firestore:rules,storage
```

---

## Deploying

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Synapse workspace"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```
(`.gitignore` already excludes `node_modules`, `dist`, and `.env` — your
Firebase web config in `src/firebase/config.js` is safe to commit; it's a
public client identifier, not a secret. Actual security comes from the
Firestore/Storage rules above.)

### 2. Deploy — pick one

**Vercel (recommended, easiest with React Router)**
1. https://vercel.com → New Project → import your GitHub repo
2. Framework preset: Vite (auto-detected)
3. Add environment variables (see below) if you're using `.env` instead of
   in-app key entry
4. Deploy — `vercel.json` (included) handles client-side routing so deep
   links like `/notes` work on refresh

**Netlify**
1. https://netlify.com → Add new site → import your GitHub repo
2. Build command: `npm run build`, publish directory: `dist`
3. `public/_redirects` (included) handles client-side routing

**Firebase Hosting** (nice fit since you're already on Firebase)
```bash
npm run build
firebase deploy --only hosting
```
`firebase.json` (included) is already set up for this.

### 3. Environment variables on your host
If you're using `.env` for the weather/AI keys instead of pasting them
in-app, add these in your host's dashboard (Vercel: Settings → Environment
Variables; Netlify: Site settings → Environment variables):
```
VITE_OPENWEATHER_API_KEY=your_key
VITE_GROQ_API_KEY=your_key
```
Or skip this entirely if you'd rather manage keys purely via `.env` — both
the weather and AI features read from `.env` only now (see below).

---

## Weather + automatic theming

Palette icon in the top bar → **Appearance**:

- **Follow Real World** (on by default) — cycles dawn → morning →
  afternoon → sunset → evening → night by your device clock, switches to a
  rain/storm/snow/fog look when live weather matches. **Season** tab shows
  spring/summer/autumn/winter from today's date.
- **Display tab** — dark/light mode and two accent palettes, **Ember**
  (orange) and **Ocean** (blue), applied instantly via CSS variables.
- **Manual override** — pick a scene yourself anytime.

On **My Desk**, click "Clean view" to hide all panels and just see the
photo — the glowing dots on the desk itself (monitor, laptop, notebook,
coffee cup...) are clickable shortcuts to their matching page.

**Weather API key**: Appearance → Weather tab, or `.env`
(`VITE_OPENWEATHER_API_KEY`). Free: https://home.openweathermap.org/api_keys

## AI Assistant

`/assistant` — every question is sent to Groq (Llama 3.3 70B) with a live summary of your
actual projects, pending tasks, notes, and events, so answers are grounded
in your real workspace. It can also take action: ask it to "add a task to
review the PR by Friday" or "note that the client wants a redesign" and it
creates the task/note/event directly — no copy-pasting its answer yourself.

**Groq API key**: add it to `.env` as
`VITE_GROQ_API_KEY`. Free: https://console.groq.com/keys

## Map

`/map` — your location + custom pins, via free OpenStreetMap tiles, no key
required. Swap the `TileLayer` URL in `src/pages/MapView.jsx` for
Mapbox/Google if you want custom styling.

## Music

Spotify player in the sidebar — paste any track/album/playlist link, plays
immediately via Spotify's public embed, no API key or OAuth needed.

## All APIs at a glance

| Feature | Service | Key needed? | Required for deployment? |
|---|---|---|---|
| Accounts | Firebase Auth | No (local mode works) | Yes, for real multi-user accounts |
| Cloud data sync | Firestore | No (local mode works) | Yes, so data survives per-visitor |
| File storage | Firebase Storage | No (local mode works) | Yes, for real file uploads |
| Live weather + weather theme | OpenWeatherMap | Yes (free) | No — degrades gracefully |
| AI Assistant | Groq (Llama 3.3 70B) | Yes (free) | No — degrades gracefully |
| Map | OpenStreetMap | No | No |
| Music | Spotify Embed | No | No |

## Project structure

```
src/
  assets/            synapse-desk.png — your workspace background
  components/        Sidebar, TopBar, MobileNav, WeatherWidget, MusicPlayer,
                     AppearanceModal, DeskHotspots, ProtectedRoute, shared UI
  context/           AppContext (workspace data + cloud sync), AuthContext
                     (sign-in), ThemeContext (dark/light + accent)
  firebase/          config.js — Firebase setup (placeholder credentials)
  hooks/             useAutoTheme.js — real-world time/weather → scene logic
  services/          weather.js, groq.js
  utils/             theme.js — time-of-day / season calculations
  pages/             Auth, MyDesk, Projects, Notes, Tasks, Calendar,
                     KnowledgeGraph, AIAssistant, MapView, Resources,
                     Analytics, FocusMode
firestore.rules      Per-user data access rules
storage.rules        Per-user file access rules
firebase.json        Firebase Hosting config
vercel.json          Vercel SPA routing config
public/_redirects    Netlify SPA routing config
```

## Notes

- The Knowledge Graph (`/graph`) is a real React Flow canvas — drag nodes,
  draw new connections, click "Save layout" to persist.
- Sidebar collapses into a bottom nav bar below the `lg` breakpoint.
- Without weather/Groq keys, those two features just show a friendly
  prompt to add one to `.env` — everything else works regardless.
- API keys are managed exclusively via `.env` now (no in-app key entry UI),
  so they never end up saved in localStorage or Firestore by accident.
