import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { Input, Button } from './ui.jsx'
import { getSeason, seasonMeta } from '../utils/theme.js'

const TIME_SCENES = ['dawn', 'morning', 'afternoon', 'sunset', 'evening', 'night']
const WEATHER_SCENES = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy']
const TABS = ['Time', 'Weather', 'Season', 'Display']

export default function AppearanceModal({ open, onClose }) {
  const { scene, setScene, followRealWorld, setFollowRealWorld, weather, apiKeys, setApiKeys } = useApp()
  const { theme, accent, customColor, setTheme, setAccent, setCustomColor, toggleTheme } = useTheme()
  const [tab, setTab] = useState('Time')
  const [owKey, setOwKey] = useState(apiKeys.openWeather)
  const [gKey, setGKey] = useState(apiKeys.gemini)
  const season = getSeason()

  function saveKeys() {
    setApiKeys({ openWeather: owKey.trim(), gemini: gKey.trim() })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-start justify-end p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-sm glass-panel rounded-xl2 shadow-panel p-5 bg-ink-700/95 mt-16"
            initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-ink-50">Appearance</h3>
              <button onClick={onClose} className="text-ink-300 hover:text-ink-50 focus-ring rounded p-1" aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>

            <div className="flex items-center justify-between mb-4 rounded-lg bg-white/5 border border-white/5 px-3 py-2.5">
              <div>
                <p className="text-sm text-ink-100">Follow Real World</p>
                <p className="text-[11px] text-ink-300">Sync time, weather, and season</p>
              </div>
              <Toggle checked={followRealWorld} onChange={setFollowRealWorld} />
            </div>

            <div className="flex gap-1 mb-4 border-b border-white/5">
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${tab === t ? 'text-ember-300 border-ember-400' : 'text-ink-300 border-transparent hover:text-ink-100'}`}>{t}</button>
              ))}
            </div>

            {tab === 'Time' && (
              <div className="grid grid-cols-3 gap-2">
                {TIME_SCENES.map(s => (
                  <SceneButton key={s} active={scene === s} label={s} onClick={() => { setFollowRealWorld(false); setScene(s) }} />
                ))}
              </div>
            )}

            {tab === 'Weather' && (
              <>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {WEATHER_SCENES.map(s => (
                    <SceneButton key={s} active={scene === s} label={s} onClick={() => { setFollowRealWorld(false); setScene(s) }} />
                  ))}
                </div>
                {weather && (
                  <p className="text-xs text-ink-300 mb-3">Live: {weather.temp}°C, {weather.description} in {weather.city}.</p>
                )}
                {/* <label className="text-xs text-ink-300 block mb-1.5">OpenWeatherMap API key</label>
                <Input placeholder="Paste your API key" value={owKey} onChange={e => setOwKey(e.target.value)} type="password" />
                <p className="text-[11px] text-ink-300 mt-1.5">Free key at openweathermap.org/api_keys — powers live weather + the auto weather theme.</p> */}
              </>
            )}

            {tab === 'Season' && (
              <div className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/5 px-4 py-4">
                <span className="text-3xl">{seasonMeta[season].emoji}</span>
                <div>
                  <p className="font-display text-lg text-ink-50">{seasonMeta[season].label}</p>
                  <p className="text-xs text-ink-300">Detected from today's date. Synapse washes the desk in a seasonal color year-round.</p>
                </div>
              </div>
            )}

            {tab === 'Display' && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs text-ink-300 mb-2">Mode</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setTheme('dark')} className={`px-3 py-2.5 rounded-lg text-xs border transition-colors ${theme === 'dark' ? 'bg-ember-500/20 border-ember-500/50 text-ember-200' : 'border-white/10 text-ink-300'}`}>🌙 Dark</button>
                    <button onClick={() => setTheme('light')} className={`px-3 py-2.5 rounded-lg text-xs border transition-colors ${theme === 'light' ? 'bg-ember-500/20 border-ember-500/50 text-ember-200' : 'border-white/10 text-ink-300'}`}>☀️ Light</button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-ink-300 mb-2">Accent color</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setAccent('orange')} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs border transition-colors ${accent === 'orange' ? 'border-ember-500/50 bg-ember-500/10' : 'border-white/10 text-ink-300'}`}>
                      <span className="w-3.5 h-3.5 rounded-full" style={{ background: '#D9722E' }} /> Ember
                    </button>
                    <button onClick={() => setAccent('blue')} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs border transition-colors ${accent === 'blue' ? 'border-ember-500/50 bg-ember-500/10' : 'border-white/10 text-ink-300'}`}>
                      <span className="w-3.5 h-3.5 rounded-full" style={{ background: '#2E72D9' }} /> Ocean
                    </button>
                  </div>

                  <label className={`mt-2 flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs border cursor-pointer transition-colors ${accent === 'custom' ? 'border-ember-500/50 bg-ember-500/10' : 'border-white/10 text-ink-300 hover:border-white/20'}`}>
                    <span className="relative w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 ring-1 ring-white/20" style={{ background: customColor }}>
                      <input
                        type="color"
                        value={customColor}
                        onChange={e => setCustomColor(e.target.value)}
                        className="absolute -top-1 -left-1 w-6 h-6 cursor-pointer opacity-0"
                        aria-label="Pick a custom accent color"
                      />
                    </span>
                    <span className={accent === 'custom' ? 'text-ember-200' : ''}>Custom{accent === 'custom' ? ` — ${customColor}` : ''}</span>
                  </label>
                </div>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-white/5">
              {/* <label className="text-xs text-ink-300 block mb-1.5">Gemini API key (AI Assistant)</label> */}
              {/* <Input placeholder="Paste your API key" value={gKey} onChange={e => setGKey(e.target.value)} type="password" /> */}
              {/* <p className="text-[11px] text-ink-300 mt-1.5 mb-3">Free key at aistudio.google.com/app/apikey — powers the AI Assistant.</p> */}
              {/* <Button onClick={saveKeys} className="w-full">Save keys</Button> */}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SceneButton({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`px-2 py-2 rounded-lg text-[11px] capitalize border transition-colors ${active ? 'bg-ember-500/20 border-ember-500/50 text-ember-200' : 'border-white/10 text-ink-300 hover:text-ink-100 hover:border-white/20'}`}>
      {label}
    </button>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-10 h-5.5 rounded-full relative transition-colors focus-ring ${checked ? 'bg-ember-500' : 'bg-white/15'}`}
      style={{ height: 22 }}
      aria-pressed={checked}
    >
      <motion.span
        className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white"
        style={{ width: 18, height: 18 }}
        animate={{ left: checked ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      />
    </button>
  )
}
