import { useEffect, useRef } from 'react'
import { Map as MlMap, Marker, NavigationControl, setWorkerUrl, type StyleSpecification } from 'maplibre-gl'
import type { LngLat } from '../lib/types'

// Vite przepakowuje bibliotekę i psuje ścieżkę do workera, więc serwujemy go jako plik statyczny.
// Po aktualizacji maplibre-gl: npm run copy-worker
setWorkerUrl(`${import.meta.env.BASE_URL}vendor/maplibre-gl-worker.mjs`)

export type MarkerKind = 'problem' | 'idea' | 'resolved' | 'doc' | 'overdue' | 'planned' | 'me'

export interface MapMarker {
  id: string
  location: LngLat
  kind: MarkerKind
  label?: string | number
  title: string
  selected?: boolean
  size?: number
}

interface Props {
  center: LngLat
  zoom?: number
  markers?: MapMarker[]
  onMarkerClick?: (id: string) => void
  /** Pinezka lokalizacji zgłoszenia, opcjonalnie przesuwana */
  pin?: { location: LngLat; onChange?: (p: LngLat) => void }
  flyTo?: LngLat | null
  /** Dopasuj początkowy widok do tych punktów (zamiast center/zoom) */
  fitPoints?: LngLat[]
  fitPadding?: { top: number; bottom: number; left: number; right: number }
  showControls?: boolean
  className?: string
  ariaLabel?: string
}

// Podkład wektorowy OpenFreeMap (bez klucza API). Gdy się nie załaduje, przełączamy na kafelki rastrowe OSM.
const VECTOR_STYLE = 'https://tiles.openfreemap.org/styles/positron'
const RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap',
      maxzoom: 19,
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#eef0ec' } },
    { id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-saturation': -0.6, 'raster-opacity': 0.9 } },
  ],
}

const DEFAULT_SIZE: Record<MarkerKind, number> = {
  problem: 28,
  idea: 28,
  resolved: 24,
  doc: 20,
  overdue: 22,
  planned: 22,
  me: 18,
}

function styleMarker(el: HTMLElement, m: MapMarker) {
  const size = m.size ?? DEFAULT_SIZE[m.kind] + (m.label && Number(m.label) > 9 ? 4 : 0)
  el.className = `gm-pin gm-pin--${m.kind}${m.selected ? ' gm-pin--selected' : ''}`
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  el.style.fontSize = size > 28 ? '14px' : '12px'
  el.textContent = m.label !== undefined ? String(m.label) : ''
  el.setAttribute('aria-label', m.title)
  el.title = m.title
  el.style.zIndex = m.selected ? '5' : m.kind === 'doc' || m.kind === 'overdue' || m.kind === 'planned' ? '2' : '3'
}

function createPinElement(): HTMLElement {
  const el = document.createElement('div')
  el.setAttribute('aria-label', 'Miejsce zgłoszenia. Przeciągnij, aby zmienić.')
  el.innerHTML =
    '<svg width="44" height="54" viewBox="0 0 44 54" aria-hidden="true"><path d="M22 52s-18-15.5-18-30a18 18 0 0 1 36 0c0 14.5-18 30-18 30z" fill="#c8102e" stroke="#fff" stroke-width="3"/><circle cx="22" cy="22" r="7" fill="#fff"/></svg>'
  el.style.cursor = 'grab'
  el.style.filter = 'drop-shadow(0 3px 4px rgba(22,25,29,.3))'
  return el
}

function boundsOf(points: LngLat[]): [[number, number], [number, number]] {
  const lngs = points.map((p) => p.lng)
  const lats = points.map((p) => p.lat)
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ]
}

export function MapView({
  center,
  zoom = 15,
  markers = [],
  onMarkerClick,
  pin,
  flyTo,
  fitPoints,
  fitPadding = { top: 60, bottom: 50, left: 30, right: 30 },
  showControls = false,
  className = '',
  ariaLabel,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const markersRef = useRef(new Map<string, { marker: Marker; el: HTMLElement }>())
  const pinRef = useRef<Marker | null>(null)
  const clickRef = useRef(onMarkerClick)
  const pinChangeRef = useRef(pin?.onChange)
  clickRef.current = onMarkerClick
  pinChangeRef.current = pin?.onChange

  // utworzenie mapy (raz)
  useEffect(() => {
    if (!containerRef.current) return
    let loaded = false
    let usingFallback = false
    let map: MlMap
    try {
      map = new MlMap({
        container: containerRef.current,
        style: VECTOR_STYLE,
        center: [center.lng, center.lat],
        zoom,
        ...(fitPoints && fitPoints.length > 1 ? { bounds: boundsOf(fitPoints), fitBoundsOptions: { padding: fitPadding, maxZoom: 16 } } : {}),
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
        maxZoom: 19,
      })
    } catch {
      return // brak WebGL: zostaje tło kontenera, aplikacja działa dalej
    }
    map.touchZoomRotate.disableRotation()
    if (showControls) map.addControl(new NavigationControl({ showCompass: false }), 'bottom-right')
    const fallback = () => {
      if (usingFallback) return
      usingFallback = true
      map.setStyle(RASTER_STYLE)
    }
    map.on('load', () => {
      loaded = true
    })
    // błąd przed załadowaniem stylu = podkład wektorowy niedostępny
    map.on('error', () => {
      if (!loaded) fallback()
    })
    const timer = window.setTimeout(() => {
      if (!loaded) fallback()
    }, 6000)
    map.on('click', (e) => {
      if (pinRef.current && pinChangeRef.current) {
        pinRef.current.setLngLat(e.lngLat)
        pinChangeRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng })
      }
    })
    mapRef.current = map
    let firstResize = true
    const ro = new ResizeObserver(() => {
      map.resize()
      // kontener mógł zmienić rozmiar po animacji wejścia ekranu: dopasuj widok jeszcze raz
      if (firstResize && fitPoints && fitPoints.length > 1) map.fitBounds(boundsOf(fitPoints), { padding: fitPadding, maxZoom: 16, duration: 0 })
      firstResize = false
    })
    ro.observe(containerRef.current)
    const markerStore = markersRef.current
    return () => {
      window.clearTimeout(timer)
      ro.disconnect()
      markerStore.clear()
      pinRef.current = null
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // znaczniki
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const store = markersRef.current
    const ids = new Set(markers.map((m) => m.id))
    for (const [id, entry] of store) {
      if (!ids.has(id)) {
        entry.marker.remove()
        store.delete(id)
      }
    }
    for (const m of markers) {
      let entry = store.get(m.id)
      if (!entry) {
        const el = document.createElement('button')
        el.type = 'button'
        el.addEventListener('click', (ev) => {
          ev.stopPropagation()
          clickRef.current?.(m.id)
        })
        const marker = new Marker({ element: el }).setLngLat([m.location.lng, m.location.lat]).addTo(map)
        entry = { marker, el }
        store.set(m.id, entry)
      } else {
        entry.marker.setLngLat([m.location.lng, m.location.lat])
      }
      styleMarker(entry.el, m)
    }
  }, [markers])

  // pinezka zgłoszenia
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!pin) {
      pinRef.current?.remove()
      pinRef.current = null
      return
    }
    if (!pinRef.current) {
      const marker = new Marker({ element: createPinElement(), anchor: 'bottom', draggable: !!pin.onChange })
        .setLngLat([pin.location.lng, pin.location.lat])
        .addTo(map)
      marker.on('dragend', () => {
        const ll = marker.getLngLat()
        pinChangeRef.current?.({ lat: ll.lat, lng: ll.lng })
      })
      pinRef.current = marker
    } else {
      pinRef.current.setLngLat([pin.location.lng, pin.location.lat])
    }
  }, [pin?.location.lat, pin?.location.lng, pin])

  useEffect(() => {
    if (flyTo && mapRef.current) {
      mapRef.current.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: Math.max(mapRef.current.getZoom(), 16), duration: 900 })
    }
  }, [flyTo])

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={ariaLabel ?? 'Mapa osiedla Rubinkowo'}
      className={`relative h-full w-full overflow-hidden bg-[#eef0ec] ${className}`}
    />
  )
}
