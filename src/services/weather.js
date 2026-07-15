// Weather service — OpenWeatherMap (https://openweathermap.org/api)
// Free tier is enough for this app. Get a key at:
// https://home.openweathermap.org/api_keys

export async function fetchWeather(lat, lon, apiKey) {
  if (!apiKey) throw new Error('Missing OpenWeatherMap API key')
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message || `Weather request failed (${res.status})`)
  }
  const data = await res.json()
  return {
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    condition: mapCondition(data.weather?.[0]?.main || ''),
    description: data.weather?.[0]?.description || '',
    city: data.name,
    updatedAt: Date.now()
  }
}

function mapCondition(main) {
  const m = main.toLowerCase()
  if (m.includes('thunderstorm')) return 'stormy'
  if (m.includes('drizzle') || m.includes('rain')) return 'rainy'
  if (m.includes('snow')) return 'snowy'
  if (m.includes('fog') || m.includes('mist') || m.includes('haze')) return 'foggy'
  if (m.includes('cloud')) return 'cloudy'
  return 'sunny'
}

export const conditionEmoji = {
  sunny: '☀️', cloudy: '☁️', rainy: '🌧️', stormy: '⛈️', snowy: '❄️', foggy: '🌫️'
}
