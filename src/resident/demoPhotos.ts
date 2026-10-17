import type { LngLat } from '../lib/types'

/**
 * Scenariusze pokazu (panel demo → „Dziura” / „Ławka”). Ustawiają miejsce i tekst,
 * który pojawia się po naciśnięciu mikrofonu (symulowana transkrypcja).
 * Zdjęcie: prawdziwe zdjęcie zespołu z public/zdjecia/ (jeśli jest), inaczej mieszkaniec robi je sam.
 */
export interface Scenario {
  id: 'pothole' | 'bench' | 'violation'
  photo: string
  location: LngLat
  transcript: string
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'pothole',
    photo: '/zdjecia/zgloszenie-dziura.jpg',
    location: { lat: 53.02846, lng: 18.65779 },
    transcript: 'Przy przystanku Rubinkowo Centrum jest wielka dziura w jezdni. Autobusy w nią wjeżdżają, a woda chlapie na ludzi.',
  },
  {
    id: 'bench',
    photo: '/zdjecia/zgloszenie-lawka.jpg',
    location: { lat: 53.02733, lng: 18.66424 },
    transcript: 'Przydałaby się tu ławka dla seniorów. Nie ma gdzie usiąść w drodze do przychodni.',
  },
  {
    // ścieżka z błędem: dane osobowe, obraźliwe słowo, numer telefonu i reklama — AI wskazuje, co poprawić
    id: 'violation',
    photo: '/zdjecia/zgloszenie-bledne.jpg',
    location: { lat: 53.02905, lng: 18.66885 },
    transcript:
      'Sąsiad Jan Kowalski z bloku przy Dziewulskiego znowu parkuje na trawniku i niszczy zieleń, to idiota! Dzwońcie do niego: 601 234 567. Kupcie u mnie tanie opony: www.opony-tanio.pl',
  },
]

/** Domyślna „lokalizacja z telefonu” w demo i tekst mikrofonu bez scenariusza */
export const DEMO_GPS: LngLat = { lat: 53.02846, lng: 18.65779 }
export const DEFAULT_TRANSCRIPT = SCENARIOS[0].transcript

/** Sprawdza, czy zespół wrzucił prawdziwe zdjęcie do public/zdjecia/ */
export function photoExists(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img.naturalWidth > 0)
    img.onerror = () => resolve(false)
    img.src = src
  })
}

/** Zmniejsza zdjęcie z telefonu do małego obrazka (żeby zmieściło się w stanie demo) */
export function downscale(file: File): Promise<string> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, 720 / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      try {
        resolve(canvas.toDataURL('image/jpeg', 0.74))
      } catch {
        resolve('/demo/zastepcze.svg')
      }
    }
    img.onerror = () => resolve('/demo/zastepcze.svg')
    img.src = url
  })
}
