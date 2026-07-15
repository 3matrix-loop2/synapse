import { useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { getTimeScene, weatherScenes } from '../utils/theme.js'
import { fetchWeather } from '../services/weather.js'

const FALLBACK_COORDS = { lat: 28.6139, lon: 77.209 } // used if geolocation is denied

export default function useAutoTheme() {
  const { followRealWorld, setScene, setWeather, apiKeys, weather } = useApp()
  const weatherRef = useRef(weather)
  weatherRef.current = weather

  // Pick the scene from the real-world clock, letting live weather
  // (rain / storm / snow / fog) override the plain time-of-day look.
  useEffect(() => {
    if (!followRealWorld) return
    function apply() {
      const cond = weatherRef.current?.condition
      const scene = weatherScenes.includes(cond) ? cond : getTimeScene()
      setScene(scene)
    }
    apply()
    const id = setInterval(apply, 60 * 1000)
    return () => clearInterval(id)
  }, [followRealWorld, setScene, weather])

  // Pull live weather from OpenWeatherMap using the browser's geolocation.
  useEffect(() => {
    if (!followRealWorld) return
    const key = apiKeys.openWeather || import.meta.env.VITE_OPENWEATHER_API_KEY
    if (!key) return

    function load(lat, lon) {
      fetchWeather(lat, lon, key).then(setWeather).catch(err => {
        console.warn('Synapse weather fetch failed:', err.message)
      })
    }

    function loadWithLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => load(pos.coords.latitude, pos.coords.longitude),
          () => load(FALLBACK_COORDS.lat, FALLBACK_COORDS.lon),
          { timeout: 8000 }
        )
      } else {
        load(FALLBACK_COORDS.lat, FALLBACK_COORDS.lon)
      }
    }

    loadWithLocation()
    const id = setInterval(loadWithLocation, 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [followRealWorld, apiKeys.openWeather, setWeather])
}
