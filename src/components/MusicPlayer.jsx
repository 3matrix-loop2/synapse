import React, { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'

// Uses Spotify's public oEmbed player — just needs a track/album/playlist
// link, no API key or OAuth required. For search, playback control, or
// "now playing" data instead of a fixed embed, swap this for the real
// Spotify Web API + Web Playback SDK (needs a Spotify Developer app + OAuth).
const DEFAULT_URI = 'spotify:playlist:37i9dQZF1DWWQRwui0ExPn' // Lo-Fi Beats

export default function MusicPlayer() {
  const { musicUri, setMusicUri } = useApp()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const embedSrc = toEmbedUrl(musicUri || DEFAULT_URI)

  function save() {
    if (draft.trim()) setMusicUri(draft.trim())
    setEditing(false)
    setDraft('')
  }

  return (
    <div className="rounded-lg overflow-hidden border border-white/5 bg-white/5">
      <iframe
        title="Synapse music player"
        src={embedSrc}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
      <div className="px-2.5 py-1.5">
        {editing ? (
          <div className="flex gap-1.5">
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="Paste a Spotify link…"
              className="flex-1 bg-white/10 rounded px-2 py-1 text-[11px] text-ink-50 outline-none"
            />
            <button onClick={save} className="text-[11px] text-ember-300">Set</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-[11px] text-ink-300 hover:text-ember-300">
            Change playlist / track
          </button>
        )}
      </div>
    </div>
  )
}

function toEmbedUrl(uriOrUrl) {
  // Accepts spotify:type:id URIs or open.spotify.com links, normalizes to embed form
  let type, id
  const uriMatch = uriOrUrl.match(/^spotify:(track|album|playlist|artist|episode|show):(\w+)/)
  if (uriMatch) { type = uriMatch[1]; id = uriMatch[2] }
  else {
    const urlMatch = uriOrUrl.match(/open\.spotify\.com\/(track|album|playlist|artist|episode|show)\/(\w+)/)
    if (urlMatch) { type = urlMatch[1]; id = urlMatch[2] }
  }
  if (!type || !id) return `https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn`
  return `https://open.spotify.com/embed/${type}/${id}`
}
