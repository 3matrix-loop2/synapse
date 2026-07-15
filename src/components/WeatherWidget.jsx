import React from 'react'
import { useApp } from '../context/AppContext.jsx'
import { conditionEmoji } from '../services/weather.js'

export default function WeatherWidget() {
  const { weather, apiKeys, followRealWorld } = useApp()
  const hasKey = apiKeys.openWeather || import.meta.env.VITE_OPENWEATHER_API_KEY

  if (!followRealWorld) return null

  if (!hasKey) {
    return (
      <div className="rounded-lg bg-white/5 border border-white/5 px-3 py-3 text-xs text-ink-300">
        <p className="font-medium text-ink-100 mb-0.5">Weather</p>
        <p>Add an OpenWeatherMap key in Appearance to see live conditions.</p>
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="rounded-lg bg-white/5 border border-white/5 px-3 py-3 text-xs text-ink-300">
        Fetching local weather…
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white/5 border border-white/5 px-3 py-3 text-xs text-ink-300 flex items-center gap-2.5">
      <span className="text-2xl leading-none">{conditionEmoji[weather.condition] || '🌤️'}</span>
      <div>
        <p className="text-ink-50 font-display text-base leading-none">{weather.temp}°C</p>
        <p className="capitalize mt-0.5">{weather.description || weather.condition}</p>
        <p className="text-[10px] text-ink-300/80 mt-0.5">Feels like {weather.feelsLike}°C{weather.city ? ` · ${weather.city}` : ''}</p>
      </div>
    </div>
  )
}
