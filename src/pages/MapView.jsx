import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Panel, Input, Button } from '../components/ui.jsx'

// Vite doesn't resolve Leaflet's default marker asset paths automatically —
// point them at the CDN so pins render correctly.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

const FALLBACK = [28.6139, 77.209]

export default function MapView() {
  const { pins = [], addPin, deletePin } = usePins()
  const [center, setCenter] = useState(FALLBACK)
  const [label, setLabel] = useState('')
  const [located, setLocated] = useState(false)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { setCenter([pos.coords.latitude, pos.coords.longitude]); setLocated(true) },
        () => setLocated(true)
      )
    } else {
      setLocated(true)
    }
  }, [])

  function pinHere() {
    if (!label.trim()) return
    addPin({ label: label.trim(), lat: center[0], lng: center[1] })
    setLabel('')
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4 h-[calc(100vh-140px)]">
      <Panel className="p-0 overflow-hidden">
        {located && (
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', background: '#14120E' }}>
            <Recenter center={center} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <Marker position={center}>
              <Popup>You are here</Popup>
            </Marker>
            {pins.map(p => (
              <Marker key={p.id} position={[p.lat, p.lng]}>
                <Popup>{p.label}</Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </Panel>

      <div className="flex flex-col gap-4">
        <Panel title="Pin this location">
          <div className="flex flex-col gap-2">
            <Input placeholder="e.g. Client office, coworking space" value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && pinHere()} />
            <Button onClick={pinHere}>Add pin at map center</Button>
            <p className="text-[11px] text-ink-300">Uses free OpenStreetMap tiles — no API key required. Swap the TileLayer url for Mapbox/Google if you want a custom map style.</p>
          </div>
        </Panel>

        <Panel title="Saved pins">
          <ul className="flex flex-col gap-2">
            {pins.length === 0 && <p className="text-sm text-ink-300 py-4 text-center">No pins yet.</p>}
            {pins.map(p => (
              <li key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 text-sm group">
                <span className="text-ink-100">{p.label}</span>
                <button onClick={() => deletePin(p.id)} className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-red-300 text-xs">×</button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}

function Recenter({ center }) {
  const map = useMap()
  useEffect(() => { map.setView(center) }, [center, map])
  return null
}

function usePins() {
  const [pins, setPins] = useState(() => {
    try { return JSON.parse(localStorage.getItem('synapse:pins')) || [] } catch { return [] }
  })
  useEffect(() => { localStorage.setItem('synapse:pins', JSON.stringify(pins)) }, [pins])
  const addPin = (pin) => setPins(p => [...p, { id: 'pin' + Date.now(), ...pin }])
  const deletePin = (id) => setPins(p => p.filter(x => x.id !== id))
  return { pins, addPin, deletePin }
}
