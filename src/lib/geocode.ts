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

function askPosition(highAccuracy: boolean, timeoutMs: number): Promise<GeolocationPosition | GeolocationPositionError | null> {
  return new Promise((resolve) => {
    let done = false
    const finish = (r: GeolocationPosition | GeolocationPositionError | null) => {
      if (!done) {
        done = true
        resolve(r)
      }
    }
    // własny limit: dłuższy niż limit GPS, żeby zdążyć odpowiedzieć na pytanie przeglądarki o zgodę
    const timer = window.setTimeout(() => finish(null), timeoutMs + 12000)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.clearTimeout(timer)
        finish(pos)
      },
      (err) => {
        window.clearTimeout(timer)
        finish(err)
      },
      { enableHighAccuracy: highAccuracy, timeout: timeoutMs, maximumAge: highAccuracy ? 0 : 120000 },
    )
  })
}

/**
 * Pobiera lokalizację telefonu. Najpierw dokładną (GPS), a gdy nie odpowie — przybliżoną (Wi-Fi, sieć).
 * Każde wywołanie pyta od nowa, więc po włączeniu lokalizacji w telefonie „Spróbuj ponownie” zadziała.
 */
export async function getGpsLocation(): Promise<GpsResult> {
  if (!('geolocation' in navigator)) return { ok: false, reason: 'unavailable' }
  let r = await askPosition(true, 8000)
  if (!r || ('code' in r && r.code !== r.PERMISSION_DENIED)) r = await askPosition(false, 8000)
  if (!r) return { ok: false, reason: 'unavailable' }
  if ('code' in r) return { ok: false, reason: r.code === r.PERMISSION_DENIED ? 'denied' : 'unavailable' }
  const p = { lat: r.coords.latitude, lng: r.coords.longitude }
  return inTorun(p) ? { ok: true, location: p } : { ok: false, reason: 'outside' }
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
