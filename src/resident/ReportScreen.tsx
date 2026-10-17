import { useEffect, useRef, useState } from 'react'
import type { LngLat } from '../lib/types'
import { MapView } from '../components/MapView'
import { Button } from '../components/ui'
import { IconCamera, IconImage, IconMic, IconPin, IconSend } from '../components/icons'
import { describeLocation } from '../lib/geo'
import { useTypewriter } from '../lib/hooks'
import { DEFAULT_TRANSCRIPT, DEMO_GPS, downscale, photoExists, SCENARIOS } from './demoPhotos'
import { ScreenHeader } from './ScreenHeader'

export interface ReportDraft {
  photo: string
  photoLabel: string
  description: string
  location: LngLat
  place: string
  /** opis podyktowany (do pokazania etapu mowa → tekst) */
  usedMic: boolean
}

type LocSource = 'locating' | 'gps' | 'manual'

export function ReportScreen({
  preset,
  initialPhoto,
  onBack,
  onSubmit,
}: {
  preset?: 'pothole' | 'bench'
  initialPhoto?: string
  onBack: () => void
  onSubmit: (d: ReportDraft) => void
}) {
  const scenario = SCENARIOS.find((s) => s.id === preset)
  const [photo, setPhoto] = useState<string | null>(initialPhoto ?? null)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState<LngLat>(scenario?.location ?? DEMO_GPS)
  const [locSource, setLocSource] = useState<LocSource>('locating')
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [error, setError] = useState('')
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const typed = useTypewriter(transcript, { cps: 48 })

  // symulowane ustalanie lokalizacji z telefonu
  useEffect(() => {
    const t = window.setTimeout(() => setLocSource((s) => (s === 'locating' ? 'gps' : s)), 900)
    return () => window.clearTimeout(t)
  }, [])

  // scenariusz z panelu demo: prawdziwe zdjęcie zespołu, jeśli leży w public/zdjecia/
  useEffect(() => {
    if (!scenario || initialPhoto) return
    let alive = true
    photoExists(scenario.photo).then((ok) => alive && ok && setPhoto((p) => p ?? scenario.photo))
    return () => {
      alive = false
    }
  }, [scenario, initialPhoto])

  useEffect(() => {
    if (transcript !== null) setDescription(typed.out)
  }, [typed.out, transcript])

  const onFile = async (f: File | undefined) => {
    if (!f) return
    setPhoto(await downscale(f))
  }

  const startMic = () => {
    if (recording) return
    setError('')
    setRecording(true)
    setTranscript(null)
    setDescription('')
    window.setTimeout(() => {
      setRecording(false)
      setTranscript(scenario?.transcript ?? DEFAULT_TRANSCRIPT)
    }, 1500)
  }

  const submit = () => {
    if (description.trim().length < 4) {
      setError('Napisz albo powiedz jedno zdanie, co się dzieje.')
      return
    }
    onSubmit({
      photo: photo ?? '/demo/zastepcze.svg',
      photoLabel: photo ? 'Zdjęcie mieszkańca' : 'Bez zdjęcia',
      description: description.trim(),
      location,
      place: describeLocation(location),
      usedMic: transcript !== null,
    })
  }

  return (
    <div className="flex h-full flex-col bg-canvas">
      <ScreenHeader title="Nowe zgłoszenie" onBack={onBack} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => onFile(e.target.files?.[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => onFile(e.target.files?.[0])} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 px-4 pt-4 pb-6">
          <section aria-label="Zdjęcie">
            {photo ? (
              <div className="relative overflow-hidden rounded-[20px] bg-[#e6e8eb]">
                <img src={photo} alt="Twoje zdjęcie" className="h-52 w-full object-cover" />
                <div className="absolute right-3 bottom-3 flex gap-2">
                  <button type="button" onClick={() => cameraRef.current?.click()} className="min-h-11 rounded-full bg-surface/95 px-4 text-[15px] font-bold text-ink shadow">
                    Zmień zdjęcie
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-[20px] border-2 border-dashed border-line-strong bg-surface px-4 py-6 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-brand-tint text-brand">
                  <IconCamera size={28} strokeWidth={2} />
                </span>
                <div className="text-[17px] font-bold">Dodaj zdjęcie miejsca</div>
                <div className="grid w-full grid-cols-2 gap-2.5">
                  <Button size="sm" onClick={() => cameraRef.current?.click()}>
                    <IconCamera size={20} /> Aparat
                  </Button>
                  <Button size="sm" onClick={() => galleryRef.current?.click()}>
                    <IconImage size={20} /> Galeria
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section>
            <label htmlFor="desc" className="mb-2 block px-1 text-[17px] font-bold">
              Co jest nie tak albo czego brakuje?
            </label>
            <div className={`rounded-[20px] border-2 bg-surface transition-colors focus-within:border-ink ${error ? 'border-brand' : 'border-transparent'}`}>
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
                className={`block min-h-[96px] w-full resize-none rounded-[20px] bg-transparent px-4 pt-3.5 pb-1 text-[18px] leading-7 outline-none placeholder:text-ink-2/70 ${transcript !== null && !typed.done ? 'typing-caret' : ''}`}
              />
              <div className="flex items-center justify-between gap-2 px-3 pb-3">
                <span className="pl-1 text-[14px] text-ink-2">{recording ? 'Słucham…' : 'Możesz też powiedzieć'}</span>
                <button
                  type="button"
                  onClick={startMic}
                  aria-label={recording ? 'Słucham…' : 'Powiedz zamiast pisać'}
                  className={`flex size-12 items-center justify-center rounded-full ${recording ? 'bg-brand text-white' : 'bg-canvas text-ink hover:bg-line'}`}
                  style={recording ? { animation: 'pulse-ring 1.2s ease-out infinite' } : undefined}
                >
                  <IconMic size={24} strokeWidth={2.2} />
                </button>
              </div>
            </div>
            {error && (
              <p id="desc-err" className="mt-2 px-1 text-[15px] font-bold text-st-overdue" role="alert">
                {error}
              </p>
            )}
          </section>

          <section aria-label="Miejsce">
            <div className="overflow-hidden rounded-[20px] bg-surface">
              <div className="h-40">
                <MapView
                  center={location}
                  zoom={16.4}
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
              <div className="flex items-start gap-2.5 px-4 py-3">
                <IconPin size={22} className="mt-0.5 shrink-0 text-brand" strokeWidth={2.2} />
                <div>
                  <div className="text-[17px] font-bold leading-6">{locSource === 'locating' ? 'Ustalam lokalizację…' : describeLocation(location)}</div>
                  <div className="text-[14px] leading-5 text-ink-2">
                    {locSource === 'manual' ? 'Ustawione ręcznie' : 'Lokalizacja z telefonu'} · przesuń pinezkę, jeśli trzeba
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="shrink-0 border-t border-line bg-surface px-4 pt-3 pb-[calc(var(--safe-bottom)+10px)]">
        <Button variant="primary" size="lg" className="w-full rounded-full" onClick={submit}>
          <IconSend size={22} strokeWidth={2.2} /> Wyślij zgłoszenie
        </Button>
        <p className="mt-1.5 text-center text-[14px] text-ink-2">Bez logowania. Nie zapisujemy danych osobowych.</p>
      </div>
    </div>
  )
}
