/**
 * Lokalizacja zgłoszenia: GPS telefonu, a gdy niedostępny — środek osiedla; adres wpisany ręcznie → współrzędne.
 */
import type { LngLat, Place } from './types'
import placesData from '../data/demo/places.json'
import { RUBINKOWO_CENTER } from './geo'

const places = placesData as Place[]

/** Granice Torunia (z zapasem) — lokalizacja spoza nich nie ma sensu dla zgłoszeń miejskich */
const TORUN_BOX = { south: 52.955, north: 53.085, west: 18.49, east: 18.77 }

export const FALLBACK_LOCATION: LngLat = RUBINKOWO_CENTER

export function inTorun(p: LngLat): boolean {
  return p.lat > TORUN_BOX.south && p.lat < TORUN_BOX.north && p.lng > TORUN_BOX.west && p.lng < TORUN_BOX.east
}

export type GpsResult = { ok: true; location: LngLat } | { ok: false; reason: 'denied' | 'unavailable' | 'outside' }

/** Pobiera lokalizację telefonu (maks. 6 s). Nigdy nie wisi: po czasie zwraca „unavailable”. */
export function getGpsLocation(timeoutMs = 6000): Promise<GpsResult> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve({ ok: false, reason: 'unavailable' })
    let done = false
    const finish = (r: GpsResult) => {
      if (done) return
      done = true
      resolve(r)
    }
    const timer = window.setTimeout(() => finish({ ok: false, reason: 'unavailable' }), timeoutMs)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.clearTimeout(timer)
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        finish(inTorun(p) ? { ok: true, location: p } : { ok: false, reason: 'outside' })
      },
      (err) => {
        window.clearTimeout(timer)
        finish({ ok: false, reason: err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable' })
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 },
    )
  })
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/\b(ul|ulica|al|aleja|pl|plac|os|osiedle)\.?\s+/g, '')
    .replace(/,?\s*torun\b/g, '')
    .trim()

/** Adres → współrzędne. Najpierw znane miejsca (offline), potem OpenStreetMap (Nominatim) w granicach Torunia. */
export async function geocodeAddress(query: string): Promise<{ location: LngLat; label: string } | null> {
  const q = norm(query)
  if (q.length < 3) return null
  const local = places.find((p) => norm(p.name).includes(q) || q.includes(norm(p.name)))
  if (local) return { location: local.location, label: local.name }
  try {
    const params = new URLSearchParams({
      format: 'json',
      limit: '1',
      countrycodes: 'pl',
      bounded: '1',
      addressdetails: '1',
      viewbox: `${TORUN_BOX.west},${TORUN_BOX.north},${TORUN_BOX.east},${TORUN_BOX.south}`,
      q: `${query}, Toruń`,
    })
    const ctrl = new AbortController()
    const t = window.setTimeout(() => ctrl.abort(), 5000)
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal: ctrl.signal, headers: { 'Accept-Language': 'pl' } })
    window.clearTimeout(t)
    const data = (await res.json()) as { lat: string; lon: string; display_name: string; address?: { road?: string; house_number?: string; pedestrian?: string; square?: string } }[]
    if (!data[0]) return null
    const location = { lat: Number(data[0].lat), lng: Number(data[0].lon) }
    if (!inTorun(location)) return null
    const ad = data[0].address
    const street = ad?.road ?? ad?.pedestrian ?? ad?.square
    const label = street ? `${street}${ad?.house_number ? ` ${ad.house_number}` : ''}` : data[0].display_name.split(',').slice(0, 2).join(',').trim()
    return { location, label }
  } catch {
    return null
  }
}
