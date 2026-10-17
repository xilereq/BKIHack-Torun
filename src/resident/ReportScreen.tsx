import { useEffect, useRef, useState } from 'react'
import type { LngLat } from '../lib/types'
import { MapView } from '../components/MapView'
import { Button } from '../components/ui'
import { IconCamera, IconCheck, IconMic, IconPin, IconSend } from '../components/icons'
import { describeLocation } from '../lib/geo'
import { useTypewriter } from '../lib/hooks'
import { DEMO_GPS, DEMO_PHOTOS, type DemoPhoto } from './demoPhotos'
import { ScreenHeader } from './ScreenHeader'

export interface ReportDraft {
  photo: string
  photoLabel: string
  description: string
  location: LngLat
  place: string
}

type LocSource = 'locating' | 'gps' | 'photo' | 'manual'

/** Zmniejsza zdjęcie z telefonu do małego obrazka (żeby zmieściło się w stanie demo) */
function downscale(file: File): Promise<string> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, 640 / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      try {
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      } catch {
        resolve('/demo/zastepcze.svg')
      }
    }
    img.onerror = () => resolve('/demo/zastepcze.svg')
    img.src = url
  })
}

export function ReportScreen({ preset, onBack, onSubmit }: { preset?: 'pothole' | 'bench'; onBack: () => void; onSubmit: (d: ReportDraft) => void }) {
  const [photo, setPhoto] = useState<DemoPhoto | { id: 'own'; src: string; label: string } | null>(null)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState<LngLat>(DEMO_GPS)
  const [locSource, setLocSource] = useState<LocSource>('locating')
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const typed = useTypewriter(transcript, { cps: 48 })

  // symulowane ustalanie lokalizacji z telefonu
  useEffect(() => {
    const t = window.setTimeout(() => setLocSource((s) => (s === 'locating' ? 'gps' : s)), 900)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (transcript !== null) setDescription(typed.out)
  }, [typed.out, transcript])

  const choosePhoto = (p: DemoPhoto) => {
    setPhoto(p)
    setLocation(p.location)
    setLocSource('photo')
  }

  // scenariusz z panelu demo: wybrane zdjęcie
  useEffect(() => {
    if (!preset) return
    const p = DEMO_PHOTOS.find((x) => x.id === preset)
    if (p) choosePhoto(p)
  }, [preset])

  const onFile = async (f: File | undefined) => {
    if (!f) return
    const src = await downscale(f)
    setPhoto({ id: 'own', src, label: 'Twoje zdjęcie' })
  }

  const startMic = () => {
    if (recording) return
    setError('')
    setRecording(true)
    setTranscript(null)
    setDescription('')
    const text = photo && photo.id !== 'own' ? (photo as DemoPhoto).transcript : DEMO_PHOTOS[0].transcript
    window.setTimeout(() => {
      setRecording(false)
      setTranscript(text)
    }, 1500)
  }

  const submit = () => {
    if (description.trim().length < 4) {
      setError('Napisz albo powiedz jedno zdanie, co się dzieje.')
      return
    }
    onSubmit({
      photo: photo?.src ?? '/demo/zastepcze.svg',
      photoLabel: photo?.label ?? 'Bez zdjęcia',
      description: description.trim(),
      location,
      place: describeLocation(location),
    })
  }

  const locLabel =
    locSource === 'locating'
      ? 'Ustalam lokalizację telefonu…'
      : locSource === 'photo'
        ? 'Lokalizacja odczytana ze zdjęcia'
        : locSource === 'gps'
          ? 'Lokalizacja z telefonu'
          : 'Lokalizacja ustawiona ręcznie'

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Nowe zgłoszenie" onBack={onBack} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6 px-4 py-5">
          <section aria-labelledby="sec-photo">
            <h2 id="sec-photo" className="mb-2 text-[18px] font-bold">
              1. Zdjęcie
            </h2>
            {photo ? (
              <div className="relative overflow-hidden rounded-card border border-line">
                <img src={photo.src} alt={photo.label} className="h-44 w-full object-cover" />
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-[14px] font-bold text-st-done">
                  <IconCheck size={16} strokeWidth={2.6} /> Zdjęcie dodane
                </div>
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="absolute right-3 bottom-3 min-h-11 rounded-btn bg-surface px-4 text-[15px] font-bold text-ink hover:bg-canvas"
                >
                  Zmień
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Button onClick={() => fileRef.current?.click()} className="min-h-14 w-full rounded-[16px] border-2 border-dashed border-line-strong text-[18px]">
                  <IconCamera size={24} /> Zrób zdjęcie lub wybierz
                </Button>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} aria-label="Wybierz zdjęcie z telefonu" />
                <div className="text-small text-ink-2">albo użyj zdjęcia demo:</div>
                <div className="grid grid-cols-2 gap-2.5">
                  {DEMO_PHOTOS.map((p) => (
                    <button key={p.id} type="button" onClick={() => choosePhoto(p)} className="overflow-hidden rounded-btn border border-line bg-surface text-left hover:border-ink">
                      <img src={p.src} alt="" className="h-20 w-full object-cover" />
                      <span className="block px-2.5 py-1.5 text-[15px] font-bold leading-5">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section aria-labelledby="sec-desc">
            <label id="sec-desc" htmlFor="desc" className="mb-2 block text-[18px] font-bold">
              2. Co jest nie tak albo czego brakuje?
            </label>
            <div className="flex items-stretch gap-2.5">
              <textarea
                id="desc"
                value={description}
                onChange={(e) => {
                  setTranscript(null)
                  setDescription(e.target.value)
                  setError('')
                }}
                rows={3}
                placeholder="Wielka dziura przy przystanku"
                aria-invalid={!!error}
                aria-describedby={error ? 'desc-err' : undefined}
                className={`min-h-[96px] min-w-0 flex-1 resize-none rounded-[12px] border-2 bg-surface px-4 py-3 text-[18px] leading-7 outline-none placeholder:text-ink-2/70 focus:border-ink ${error ? 'border-brand' : 'border-line-strong'} ${transcript !== null && !typed.done ? 'typing-caret' : ''}`}
              />
              <button
                type="button"
                onClick={startMic}
                aria-label={recording ? 'Słucham…' : 'Powiedz zamiast pisać'}
                className={`flex w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-[12px] border text-[13px] font-bold ${recording ? 'border-brand bg-brand text-white' : 'border-line-strong bg-surface text-ink hover:bg-canvas'}`}
                style={recording ? { animation: 'pulse-ring 1.2s ease-out infinite' } : undefined}
              >
                <IconMic size={26} strokeWidth={2.2} />
                {recording ? 'Słucham' : 'Powiedz'}
              </button>
            </div>
            {error && (
              <p id="desc-err" className="mt-2 text-[15px] font-bold text-st-overdue" role="alert">
                {error}
              </p>
            )}
          </section>

          <section aria-labelledby="sec-loc">
            <h2 id="sec-loc" className="mb-2 text-[18px] font-bold">
              3. Miejsce
            </h2>
            <div className="overflow-hidden rounded-card border border-line">
              <div className="h-44">
                <MapView
                  center={location}
                  zoom={16.4}
                  flyTo={locSource === 'photo' ? location : null}
                  pin={{
                    location,
                    onChange: (p) => {
                      setLocation(p)
                      setLocSource('manual')
                    },
                  }}
                  ariaLabel="Mapa z pinezką miejsca zgłoszenia"
                />
              </div>
              <div className="flex items-start gap-2.5 bg-surface px-4 py-3">
                <IconPin size={22} className="mt-0.5 shrink-0 text-brand" strokeWidth={2.2} />
                <div>
                  <div className="text-[17px] font-bold leading-6">{locSource === 'locating' ? '…' : describeLocation(location)}</div>
                  <div className="text-small text-ink-2">{locLabel}. Przesuń pinezkę, jeśli trzeba.</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      <div className="shrink-0 border-t border-line bg-surface px-4 pt-3 pb-5">
        <Button variant="primary" size="lg" className="w-full" onClick={submit}>
          <IconSend size={24} strokeWidth={2.2} /> Wyślij zgłoszenie
        </Button>
        <p className="mt-2 text-center text-[15px] text-ink-2">Bez logowania. Nie zapisujemy Twoich danych osobowych.</p>
      </div>
    </div>
  )
}
