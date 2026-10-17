import type { LngLat, Place } from './types'
import placesData from '../data/demo/places.json'

const places = placesData as Place[]

/** Odległość w metrach (wzór haversine) */
export function distanceM(a: LngLat, b: LngLat): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Najbliższe nazwane miejsce, np. „przystanek Manhattan” albo „ok. 120 m od: przystanek Manhattan” */
export function describeLocation(p: LngLat): string {
  let best = places[0]
  let bestD = Infinity
  for (const pl of places) {
    const d = distanceM(p, pl.location)
    if (d < bestD) {
      bestD = d
      best = pl
    }
  }
  if (bestD < 60) return best.name
  return `ok. ${Math.round(bestD / 10) * 10} m od: ${best.name}`
}

/** Środek osiedla demo */
export const RUBINKOWO_CENTER: LngLat = { lat: 53.0265, lng: 18.6652 }
