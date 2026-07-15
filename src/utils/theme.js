// Maps the real-world clock and calendar to Synapse's visual scenes.

export function getTimeScene(date = new Date()) {
  const h = date.getHours()
  if (h >= 5 && h < 7) return 'dawn'
  if (h >= 7 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 19) return 'sunset'
  if (h >= 19 && h < 21) return 'evening'
  return 'night'
}

export function getSeason(date = new Date(), hemisphere = 'N') {
  const m = date.getMonth() // 0 = Jan
  const north = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter']
  const south = ['summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter', 'winter', 'winter', 'spring', 'spring', 'spring', 'summer']
  return (hemisphere === 'S' ? south : north)[m]
}

export const seasonMeta = {
  spring: { label: 'Spring', accent: '#8FA37E', emoji: '🌱' },
  summer: { label: 'Summer', accent: '#D9722E', emoji: '☀️' },
  autumn: { label: 'Autumn', accent: '#B85A22', emoji: '🍂' },
  winter: { label: 'Winter', accent: '#6E9BC9', emoji: '❄️' }
}

// Light-tint overlays laid over the desk photo per scene/weather —
// this is what actually shifts the interface's mood hour to hour.
// Punched up on purpose so the shift actually reads through the desk
// photo's own dark vignette instead of disappearing into it.
export const sceneTint = {
  dawn: 'linear-gradient(180deg, rgba(233,196,160,0.34) 0%, transparent 60%)',
  morning: 'linear-gradient(180deg, rgba(250,220,150,0.26) 0%, transparent 60%)',
  afternoon: 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 60%)',
  sunset: 'linear-gradient(180deg, rgba(217,114,46,0.40) 0%, transparent 60%)',
  evening: 'linear-gradient(180deg, rgba(110,80,150,0.36) 0%, transparent 60%)',
  night: 'linear-gradient(180deg, rgba(20,30,65,0.46) 0%, transparent 60%)',
  rainy: 'linear-gradient(180deg, rgba(80,100,130,0.40) 0%, transparent 60%)',
  stormy: 'linear-gradient(180deg, rgba(40,40,60,0.50) 0%, transparent 60%)',
  snowy: 'linear-gradient(180deg, rgba(205,215,235,0.38) 0%, transparent 60%)',
  foggy: 'linear-gradient(180deg, rgba(150,150,150,0.34) 0%, transparent 60%)',
  cloudy: 'linear-gradient(180deg, rgba(120,120,130,0.28) 0%, transparent 60%)',
  sunny: 'linear-gradient(180deg, rgba(255,220,150,0.24) 0%, transparent 60%)'
}

export const sceneBrightness = {
  dawn: 0.92, morning: 1, afternoon: 1.08, sunset: 0.9, evening: 0.72, night: 0.55,
  rainy: 0.72, stormy: 0.58, snowy: 0.98, foggy: 0.8, cloudy: 0.88, sunny: 1.1
}

export const weatherScenes = ['rainy', 'stormy', 'snowy', 'foggy']

// Seasonal color wash — a second, lower layer under the time/weather tint
// so the season is felt in the room, not just labeled in a menu.
export const seasonTint = {
  spring: 'radial-gradient(120% 90% at 50% -10%, rgba(143,163,126,0.26) 0%, transparent 65%)',
  summer: 'radial-gradient(120% 90% at 50% -10%, rgba(255,183,77,0.26) 0%, transparent 65%)',
  autumn: 'radial-gradient(120% 90% at 50% -10%, rgba(184,90,34,0.30) 0%, transparent 65%)',
  winter: 'radial-gradient(120% 90% at 50% -10%, rgba(110,155,201,0.28) 0%, transparent 65%)'
}

// ---------------------------------------------------------------------
// Custom accent color support
// ---------------------------------------------------------------------

function hexToRgb(hex) {
  const clean = hex.replace('#', '').trim()
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const num = parseInt(full, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  const d = max - min
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r: h = ((g - b) / d) % 6; break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: s * 100, l: l * 100 }
}

function hslToRgb({ h, s, l }) {
  s /= 100; l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  }
}

// Lightness targets per ramp step, tuned to match the feel of the built-in
// ember/ocean scales (near-white 50 down to near-black 900).
const RAMP_LIGHTNESS = { 50: 96, 100: 90, 200: 79, 300: 68, 400: 57, 500: 47, 600: 39, 700: 31, 800: 21, 900: 13 }

// Turns any hex color into a full 50–900 ramp, formatted as space-separated
// "r g b" strings so it can be dropped straight into --ember-* CSS vars.
export function generateAccentRamp(hex) {
  const { h, s } = rgbToHsl(hexToRgb(hex))
  const sat = Math.max(s, 35) // keep muted/gray picks from washing out completely
  const ramp = {}
  for (const step of Object.keys(RAMP_LIGHTNESS)) {
    const { r, g, b } = hslToRgb({ h, s: sat, l: RAMP_LIGHTNESS[step] })
    ramp[step] = `${r} ${g} ${b}`
  }
  return ramp
}
