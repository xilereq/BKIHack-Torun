import { useEffect, useRef, useState } from 'react'
import type { LngLat } from '../lib/types'
import { MapView } from '../components/MapView'
import { Button, Spinner } from '../components/ui'
import { IconCamera, IconImage, IconMic, IconPin, IconSend } from '../components/icons'
import { describeLocation } from '../lib/geo'
import { useTypewriter } from '../lib/hooks'
import { DEFAULT_TRANSCRIPT, downscale, photoExists, SCENARIOS } from './demoPhotos'
import { FALLBACK_LOCATION, geocodeAddress, getGpsLocation } from '../lib/geocode'
import { ScreenHeader } from './ScreenHeader'

const LOC_HINT: Record<LocSource, string> = {
  locating: 'Pobieramy lokalizację z telefonu.',
  gps: 'Twoja lokalizacja z telefonu. Przesuń pinezkę, jeśli trzeba.',
  denied: 'Brak zgody na lokalizację, więc pinezka stoi na środku osiedla. Przesuń ją albo wpisz adres.',
  unavailable: 'Nie udało się pobrać lokalizacji, więc pinezka stoi na środku osiedla. Przesuń ją albo wpisz adres.',
  outside: 'Jesteś poza Toruniem, więc pinezka stoi na środku osiedla. Przesuń ją albo wpisz adres.',
  manual: 'Ustawione ręcznie na mapie.',
  address: 'Ustawione według wpisanego adresu.',
}

export interface ReportDraft {
  photo: string
  photoLabel: string
  description: string
  location: LngLat
  place: string
  /** opis podyktowany (do pokazania etapu mowa → tekst) */
  usedMic: boolean
}

type LocSource = 'locating' | 'gps' | 'denied' | 'unavailable' | 'outside' | 'manual' | 'address'

export function ReportScreen({
  preset,
  initialPhoto,
  initial,
  onBack,
  onSubmit,
}: {
  preset?: 'pothole' | 'bench' | 'violation'
  initialPhoto?: string
  initial?: ReportDraft
  onBack: () => void
  onSubmit: (d: ReportDraft) => void
}) {
  const scenario = SCENARIOS.find((s) => s.id === preset)
  const [photo, setPhoto] = useState<string | null>(initialPhoto ?? (initial && !initial.photo.endsWith('zastepcze.svg') ? initial.photo : null))
  const [description, setDescription] = useState(initial?.description ?? '')
  const [location, setLocation] = useState<LngLat>(initial?.location ?? scenario?.location ?? FALLBACK_LOCATION)
  const [locSource, setLocSource] = useState<LocSource>(initial ? 'manual' : scenario ? 'gps' : 'locating')
  const [flyTarget, setFlyTarget] = useState<LngLat | null>(null)
  const [address, setAddress] = useState('')
  const [addressLabel, setAddressLabel] = useState('')
  const [searching, setSearching] = useState(false)
  const [addressError, setAddressError] = useState('')
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [error, setError] = useState('')
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const typed = useTypewriter(transcript, { cps: 48 })

  // lokalizacja z telefonu; gdy brak (odmowa, brak GPS, poza Toruniem) — środek osiedla
  const locate = async () => {
    setLocSource('locating')
    const r = await getGpsLocation()
    if (r.ok) {
      setLocation(r.location)
      setFlyTarget(r.location)
      setLocSource('gps')
    } else {
      setLocation(FALLBACK_LOCATION)
      setFlyTarget(FALLBACK_LOCATION)
      setLocSource(r.reason)
    }
  }
  useEffect(() => {
    // scenariusz z panelu demo ma ustalone miejsce (jak z telefonu)
    if (!scenario && !initial) locate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const findAddress = async () => {
    if (address.trim().length < 3) {
      setAddressError('Wpisz ulicę i numer albo nazwę miejsca.')
      return
    }
    setSearching(true)
    setAddressError('')
    const r = await geocodeAddress(address)
    setSearching(false)
    if (!r) {
      setAddressError('Nie znaleźliśmy tego adresu w Toruniu. Spróbuj inaczej albo przesuń pinezkę.')
      return
    }
    setLocation(r.location)
    setFlyTarget(r.location)
    setAddressLabel(r.label)
    setLocSource('address')
  }

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
      place: locSource === 'address' && addressLabel ? addressLabel : describeLocation(location),
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
                  flyTo={flyTarget}
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
                <div className="min-w-0">
                  <div className="text-[17px] font-bold leading-6">
                    {locSource === 'locating'
                      ? 'Ustalam Twoją lokalizację…'
                      : locSource === 'address' && addressLabel
                        ? addressLabel
                        : locSource === 'denied' || locSource === 'unavailable' || locSource === 'outside'
                          ? 'Środek osiedla Rubinkowo'
                          : describeLocation(location)}
                  </div>
                  <div className="text-[14px] leading-5 text-ink-2">{LOC_HINT[locSource]}</div>
                </div>
              </div>
              <div className="flex flex-col gap-2 border-t border-[#eef0f3] px-4 pt-3 pb-4">
                <label htmlFor="addr" className="text-[15px] font-bold">
                  Albo wpisz adres
                </label>
                <div className="flex gap-2">
                  <input
                    id="addr"
                    type="text"
                    inputMode="search"
                    autoComplete="street-address"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value)
                      setAddressError('')
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && findAddress()}
                    placeholder="np. Dziewulskiego 20"
                    aria-invalid={!!addressError}
                    aria-describedby={addressError ? 'addr-err' : undefined}
                    className="h-12 min-w-0 flex-1 rounded-[12px] border-2 border-line-strong bg-surface px-3.5 text-[17px] outline-none placeholder:text-ink-2/70 focus:border-ink"
                  />
                  <Button size="sm" onClick={findAddress} disabled={searching} className="shrink-0 rounded-[12px]">
                    {searching ? <Spinner size={18} /> : 'Ustaw'}
                  </Button>
                </div>
                {addressError && (
                  <p id="addr-err" role="alert" className="text-[14px] font-bold leading-5 text-st-overdue">
                    {addressError}
                  </p>
                )}
                {locSource !== 'gps' && locSource !== 'locating' && (
                  <button type="button" onClick={locate} className="self-start min-h-10 text-[15px] font-bold text-brand hover:underline">
                    Użyj mojej lokalizacji
                  </button>
                )}
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
