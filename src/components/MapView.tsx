import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Map as MlMap, Marker, NavigationControl, Popup, setWorkerUrl, type StyleSpecification } from 'maplibre-gl'
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
  /** Prawy margines przy przelocie (np. gdy panel szczegółów zasłania prawą część mapy) */
  flyPadRight?: number
  /** Dymek przy punkcie mapy (treść renderuje React) */
  popup?: { key: string; location: LngLat; content: ReactNode; onClose: () => void } | null
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

// Minimalistyczne ikonki znaczników (obrys 24×24, jak w components/icons.tsx)
const ICON_PATHS: Record<MarkerKind, string> = {
  problem: '<path d="M12 7v6"/><path d="M12 17v.01"/>',
  idea: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/>',
  resolved: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M10 12h5M10 16h5"/>',
  overdue: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 2"/>',
  planned: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  me: '',
}

const SIZE: Record<MarkerKind, number> = { problem: 34, idea: 34, resolved: 30, doc: 28, overdue: 30, planned: 28, me: 18 }

/**
 * Zewnętrzny element (button) pozycjonuje MapLibre przez `transform` — nie wolno go stylować transformacjami
 * ani przejściami, bo znaczniki „pływają” przy przesuwaniu mapy. Cały wygląd jest w elemencie wewnętrznym.
 */
function styleMarker(el: HTMLElement, m: MapMarker) {
  const size = m.size ?? SIZE[m.kind]
  // classList.add, NIE className = … — nadpisanie kasuje klasy MapLibre (position:absolute) i znaczniki się rozjeżdżają
  el.classList.add('gm-marker')
  el.style.zIndex = m.selected ? '5' : m.kind === 'problem' || m.kind === 'idea' ? '3' : '2'
  el.setAttribute('aria-label', m.title)
  el.title = m.title
  const iconSize = Math.round(size * 0.56)
  const stroke = m.kind === 'problem' ? 3 : 2.2
  const count = m.label !== undefined && m.label !== '' ? `<span class="gm-count">${m.label}</span>` : ''
  el.innerHTML =
    `<span class="gm-pin gm-pin--${m.kind}${m.selected ? ' gm-pin--selected' : ''}" style="width:${size}px;height:${size}px">` +
    `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[m.kind]}</svg>` +
    `${count}</span>`
}

function createPinElement(): HTMLElement {
  const el = document.createElement('div')
  el.setAttribute('aria-label', 'Miejsce zgłoszenia. Przeciągnij, aby zmienić.')
  el.innerHTML =
    '<svg width="44" height="54" viewBox="0 0 44 54" aria-hidden="true"><path d="M22 52s-18-15.5-18-30a18 18 0 0 1 36 0c0 14.5-18 30-18 30z" fill="#c8102e" stroke="#fff" stroke-width="3"/><circle cx="22" cy="22" r="7" fill="#fff"/></svg>'
  el.style.cursor = 'grab'
  el.style.filter = 'drop-shadow(0 3px 4px rgba(22,25,29,.3))'
  el.style.width = '44px'
  el.style.height = '54px'
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
  flyPadRight = 0,
  popup = null,
  showControls = false,
  className = '',
  ariaLabel,
}: Props) {
  const [popupEl, setPopupEl] = useState<HTMLElement | null>(null)
  const popupCloseRef = useRef(popup?.onClose)
  popupCloseRef.current = popup?.onClose
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
    // „loaded” = sam styl wczytany; błędy pojedynczych kafelków nie przełączają podkładu
    map.on('style.load', () => {
      loaded = true
    })
    map.on('error', () => {
      if (!loaded && !map.isStyleLoaded()) fallback()
    })
    const timer = window.setTimeout(() => {
      if (!loaded) fallback()
    }, 8000)
    map.on('click', (e) => {
      if (pinRef.current && pinChangeRef.current) {
        pinRef.current.setLngLat(e.lngLat)
        pinChangeRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng })
      }
    })
    mapRef.current = map
    // dopóki użytkownik sam nie ruszy mapy, po każdej zmianie rozmiaru kontenera dopasowujemy widok do punktów
    let userMoved = false
    map.on('dragstart', () => (userMoved = true))
    map.on('zoomstart', (e) => {
      if ((e as { originalEvent?: Event }).originalEvent) userMoved = true
    })
    const refit = () => {
      if (userMoved || !fitPoints || fitPoints.length < 2) return
      const { clientWidth: w, clientHeight: h } = map.getContainer()
      if (w < 50 || h < 50) return
      // padding nie może zjeść całego kontenera
      const pad = {
        top: Math.min(fitPadding.top, h * 0.3),
        bottom: Math.min(fitPadding.bottom, h * 0.2),
        left: Math.min(fitPadding.left, w * 0.2),
        right: Math.min(fitPadding.right, w * 0.2),
      }
      map.fitBounds(boundsOf(fitPoints), { padding: pad, maxZoom: 16, duration: 0 })
    }
    const ro = new ResizeObserver(() => {
      map.resize()
      refit()
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

  // dymek: kontener DOM w Popup MapLibre, treść przez portal Reacta
  const popupKey = popup?.key
  useEffect(() => {
    const map = mapRef.current
    if (!map || !popup) return
    const el = document.createElement('div')
    const p = new Popup({ closeButton: false, closeOnClick: true, anchor: 'bottom', offset: 24, maxWidth: '340px', className: 'gm-popup', focusAfterOpen: false })
      .setLngLat([popup.location.lng, popup.location.lat])
      .setDOMContent(el)
      .addTo(map)
    // dymek jest nad punktem: przesuwamy mapę tak, żeby punkt był niżej i dymek zmieścił się w całości
    const h = map.getContainer().clientHeight
    map.easeTo({ center: [popup.location.lng, popup.location.lat], offset: [0, Math.round(h * 0.28)], duration: 500 })
    let closedByUs = false
    p.on('close', () => {
      if (!closedByUs) popupCloseRef.current?.()
    })
    setPopupEl(el)
    return () => {
      closedByUs = true
      p.remove()
      setPopupEl(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popupKey])

  useEffect(() => {
    if (flyTo && mapRef.current) {
      mapRef.current.flyTo({
        center: [flyTo.lng, flyTo.lat],
        zoom: Math.max(mapRef.current.getZoom(), 16),
        duration: 900,
        padding: { top: 0, bottom: 0, left: 0, right: flyPadRight },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTo])

  return (
    <>
      <div
        ref={containerRef}
        role="region"
        aria-label={ariaLabel ?? 'Mapa osiedla Rubinkowo'}
        className={`relative h-full w-full overflow-hidden bg-[#eef0ec] ${className}`}
      />
      {popupEl && popup && createPortal(popup.content, popupEl)}
    </>
  )
}
