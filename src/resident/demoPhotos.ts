import type { LngLat } from '../lib/types'

/**
 * Przygotowane zdjęcia demo (dane demonstracyjne). Każde ma lokalizację „odczytaną ze zdjęcia”
 * i tekst, który pojawia się po naciśnięciu mikrofonu (symulowana transkrypcja).
 * Podmień pliki w public/demo/ na prawdziwe zdjęcia o tych samych nazwach.
 */
export interface DemoPhoto {
  id: string
  src: string
  label: string
  location: LngLat
  transcript: string
}

export const DEMO_PHOTOS: DemoPhoto[] = [
  {
    id: 'pothole',
    src: '/demo/dziura.svg',
    label: 'Dziura przy przystanku',
    location: { lat: 53.02846, lng: 18.65779 },
    transcript: 'Przy przystanku Rubinkowo Centrum jest wielka dziura w jezdni. Autobusy w nią wjeżdżają, a woda chlapie na ludzi.',
  },
  {
    id: 'bench',
    src: '/demo/trawnik.svg',
    label: 'Trawnik przed blokiem',
    location: { lat: 53.02733, lng: 18.66424 },
    transcript: 'Przydałaby się tu ławka dla seniorów. Nie ma gdzie usiąść w drodze do przychodni.',
  },
  {
    id: 'lamp',
    src: '/demo/latarnia.svg',
    label: 'Ciemne przejście',
    location: { lat: 53.024, lng: 18.66696 },
    transcript: 'Nie świeci latarnia nad przejściem przy przystanku tramwajowym. Wieczorem jest zupełnie ciemno.',
  },
  {
    id: 'graffiti',
    src: '/demo/graffiti.svg',
    label: 'Pomalowana wiata',
    location: { lat: 53.02551, lng: 18.67226 },
    transcript: 'Ktoś pomalował sprayem wiatę przystanku.',
  },
]

/** Domyślna „lokalizacja z telefonu” w demo */
export const DEMO_GPS: LngLat = { lat: 53.02846, lng: 18.65779 }
