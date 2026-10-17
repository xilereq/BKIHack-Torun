import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useDemo } from '../lib/store'
import { MapView, type MapMarker } from '../components/MapView'
import { Logo } from '../components/ui'
import { IconSparkle, IconX } from '../components/icons'
import { caseMarkers, commitmentState, documentMarkers } from '../components/shared'
import { districts, districtName, nearestDistrict } from '../lib/geo'
import { COUNCILLOR } from '../lib/interpelacja'
import { buildList, CaseList, type Filters, type SortKey, type StatusFilter } from './CaseList'
import { CaseDetail } from './CaseDetail'
import { InterpellationModal } from './InterpellationModal'
import { CasePopup, DocPopup } from './MapPopups'
import { AiArchitectureModal } from './AiArchitectureModal'

type Tab = 'problem' | 'idea'
type Layers = { problems: boolean; ideas: boolean; docs: boolean; commitments: boolean }
type Period = 'all' | '7' | '30' | '90' | '365' | 'custom'

/** Okręg zainteresowań radnej (dane demo): osiedla, którymi zajmuje się na co dzień */
export const MY_AREA = { label: 'Mój okręg', districts: ['rubinkowo', 'na-skarpie'] }

const LAYER_LABELS: { key: keyof Layers; label: string; swatch: string }[] = [
  { key: 'problems', label: 'Problemy', swatch: 'size-3.5 rounded-full bg-brand' },
  { key: 'ideas', label: 'Pomysły', swatch: 'size-3.5 rounded-full bg-idea-pin' },
  { key: 'docs', label: 'Dokumenty', swatch: 'size-3.5 rounded-full border-[1.5px] border-line-strong bg-surface' },
  { key: 'commitments', label: 'Plany miasta', swatch: 'size-3.5 rounded-full border-[2.5px] border-st-planned bg-surface' },
]

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Wszystkie' },
  { key: 'attention', label: 'Do działania' },
  { key: 'planned', label: 'W planie' },
  { key: 'done', label: 'Wykonane' },
]

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'urgency', label: 'Pilność' },
  { key: 'newest', label: 'Najnowsze zgłoszenia' },
  { key: 'oldest', label: 'Najdłużej czekające' },
  { key: 'reports', label: 'Najwięcej zgłoszeń' },
  { key: 'supporters', label: 'Najwięcej podbić' },
]

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: 'all', label: 'Cały okres' },
  { key: '7', label: 'Ostatnie 7 dni' },
  { key: '30', label: 'Ostatnie 30 dni' },
  { key: '90', label: 'Ostatnie 3 miesiące' },
  { key: '365', label: 'Ostatnie 12 miesięcy' },
  { key: 'custom', label: 'Własny zakres…' },
]

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[13px] font-bold text-ink-2">{label}</span>
      {children}
    </label>
  )
}

const selectCls = 'h-11 w-full min-w-0 rounded-[10px] border border-line-strong bg-surface px-2.5 text-[15px] font-bold text-ink outline-none focus:border-ink'

export function CouncilApp() {
  const s = useDemo()
  const [tab, setTab] = useState<Tab>('problem')
  const [area, setArea] = useState<string>('mine')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [period, setPeriod] = useState<Period>('all')
  const [from, setFrom] = useState(daysAgo(30))
  const [to, setTo] = useState(daysAgo(0))
  const [sort, setSort] = useState<SortKey>('urgency')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [popupId, setPopupId] = useState<string | null>(null)
  const [drafting, setDrafting] = useState(false)
  const [showAi, setShowAi] = useState(false)
  const [layers, setLayers] = useState<Layers>({ problems: true, ideas: true, docs: true, commitments: true })

  // szerokość mapy: panel historii zajmuje min(540 px, 46%), ale nie mniej niż 380 px
  const mapBoxRef = useRef<HTMLElement>(null)
  const [mapWidth, setMapWidth] = useState(900)
  useEffect(() => {
    const el = mapBoxRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setMapWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // na wąskiej mapie panel historii zajmuje całą szerokość
  const detailPx = mapWidth < 760 ? mapWidth : Math.min(mapWidth, Math.max(380, Math.min(540, Math.round(mapWidth * 0.46))))

  // zmiana obszaru zamyka dymek (punkt mógł zniknąć z widoku)
  useEffect(() => setPopupId(null), [area])

  const areaDistricts = area === 'mine' ? MY_AREA.districts : area === 'all' ? null : [area]
  const filters: Filters = useMemo(
    () => ({
      districts: areaDistricts,
      status,
      from: period === 'all' ? null : period === 'custom' ? from || null : daysAgo(Number(period)),
      to: period === 'custom' ? to || null : null,
      sort,
      verifiedOnly,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area, status, period, from, to, sort, verifiedOnly],
  )

  const reports = useMemo(() => (verifiedOnly ? s.reports.filter((r) => r.verified) : s.reports), [s.reports, verifiedOnly])
  const problems = useMemo(() => buildList(s, reports, 'problem', filters), [s, reports, filters])
  const ideas = useMemo(() => buildList(s, reports, 'idea', filters), [s, reports, filters])
  const items = tab === 'problem' ? problems : ideas
  const waitingCount = problems.filter((it) =>
    it.c.documentIds.some((id) => {
      const d = s.documents.find((x) => x.id === id && !x.hidden)
      return !!d && commitmentState(d, s) === 'overdue'
    }),
  ).length
  const filtersActive = area !== 'mine' || status !== 'all' || period !== 'all' || sort !== 'urgency' || verifiedOnly

  const visibleCaseIds = useMemo(() => new Set([...problems, ...ideas].map((it) => it.c.id)), [problems, ideas])
  const markers: MapMarker[] = useMemo(() => {
    const cm = caseMarkers({ ...s, reports }, { selectedId: popupId ?? selected, problems: layers.problems, ideas: layers.ideas }).filter((m) => visibleCaseIds.has(m.id))
    const dm = documentMarkers(s, { docs: layers.docs, commitments: layers.commitments, selectedId: popupId }).filter((m) => {
      const owner = s.cases.find((c) => c.documentIds.includes(m.id))
      if (owner) return visibleCaseIds.has(owner.id)
      return !areaDistricts || areaDistricts.includes(nearestDistrict(m.location))
    })
    return [...dm, ...cm]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, reports, visibleCaseIds, selected, layers, popupId, area])

  const fitPoints = useMemo(() => {
    const pts = s.cases.filter((c) => !areaDistricts || areaDistricts.includes(c.district)).map((c) => c.location)
    return pts.length ? pts : districts.map((d) => d.center)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, s.cases.length])

  const selectedCase = selected ? s.cases.find((c) => c.id === selected) : null
  const popupCase = popupId ? s.cases.find((c) => c.id === popupId) : null
  const popupDoc = popupId && !popupCase ? s.documents.find((d) => d.id === popupId) : null

  // klik w punkt: dymek ze zdjęciami; „Historia miejsca” otwiera panel szczegółów
  const openCase = (id: string) => {
    const c = s.cases.find((x) => x.id === id)
    if (!c) return
    setTab(c.type)
    setSelected(id)
    setPopupId(null)
  }
  const closePopup = () => setPopupId(null)
  const popup = popupCase
    ? {
        key: popupCase.id,
        location: popupCase.location,
        onClose: closePopup,
        content: <CasePopup s={s} caseId={popupCase.id} reports={reports} onOpen={() => openCase(popupCase.id)} onClose={closePopup} />,
      }
    : popupDoc
      ? {
          key: popupDoc.id,
          location: popupDoc.location,
          onClose: closePopup,
          content: <DocPopup s={s} docId={popupDoc.id} onOpenCase={openCase} onClose={closePopup} />,
        }
      : null

  const areaLabel = area === 'mine' ? `${MY_AREA.label}: ${MY_AREA.districts.map(districtName).join(', ')}` : area === 'all' ? 'Całe miasto' : districtName(area)

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-[clamp(16px,2vw,28px)] py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Logo />
          <div className="text-[20px] font-bold">Głos Osiedla</div>
          <div className="h-7 w-px bg-line" />
          <div className="min-w-0 truncate text-[16px] text-ink-2">Panel radnego · Toruń · {areaLabel}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAi(true)}
            className="inline-flex h-11 items-center gap-2 rounded-btn border border-line bg-surface px-3.5 text-[15px] font-bold hover:bg-canvas"
          >
            <IconSparkle size={18} className="text-brand" /> Jak działa AI
          </button>
          <label className="inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-btn border border-line bg-surface px-3.5 text-[15px] hover:bg-canvas">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="size-5 accent-brand" />
            Tylko zweryfikowani
          </label>
          <div className="flex items-center gap-2.5" title={COUNCILLOR.note}>
            <div className="flex size-11 items-center justify-center rounded-full bg-st-new-bg text-[16px] font-bold text-st-new">{COUNCILLOR.initials}</div>
            <div className="hidden text-[14px] leading-5 2xl:block">
              <div className="font-bold">{COUNCILLOR.name}</div>
              <div className="text-ink-2">radna (postać fikcyjna)</div>
            </div>
          </div>
        </div>
      </header>

      {/* wąskie okno (< 1000 px): lista nad mapą, całość przewijana */}
      <div className="flex min-h-0 flex-1 gap-[clamp(12px,1.4vw,20px)] px-[clamp(12px,2vw,28px)] py-[clamp(12px,1.4vw,20px)] max-[999px]:flex-col max-[999px]:overflow-y-auto">
        <section className="flex w-[clamp(330px,31vw,440px)] shrink-0 flex-col gap-2.5 max-[999px]:w-full" aria-label="Sprawy">
          <div className="flex flex-col gap-2.5 rounded-card border border-line bg-surface p-3" role="group" aria-label="Filtry i sortowanie">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Obszar">
                <select className={selectCls} value={area} onChange={(e) => setArea(e.target.value)}>
                  <option value="mine">{MY_AREA.label} (Rubinkowo, Na Skarpie)</option>
                  <option value="all">Całe miasto</option>
                  <optgroup label="Osiedla">
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </Field>
              <Field label="Sortuj według">
                <select className={selectCls} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-4 gap-1 rounded-[10px] bg-canvas p-1" role="radiogroup" aria-label="Status spraw">
              {STATUS_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  role="radio"
                  aria-checked={status === o.key}
                  onClick={() => setStatus(o.key)}
                  className={`min-h-10 min-w-0 rounded-[8px] px-0.5 text-[13px] font-bold leading-4 [overflow-wrap:anywhere] ${status === o.key ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className={`grid gap-2 ${period === 'custom' ? 'grid-cols-3' : 'grid-cols-[1fr_auto]'}`}>
              <Field label="Zgłoszone">
                <select className={selectCls} value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
                  {PERIOD_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              {period === 'custom' ? (
                <>
                  <Field label="Od">
                    <input type="date" className={selectCls} value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
                  </Field>
                  <Field label="Do">
                    <input type="date" className={selectCls} value={to} min={from} onChange={(e) => setTo(e.target.value)} />
                  </Field>
                </>
              ) : (
                <div className="flex items-end">
                  {filtersActive && (
                    <button
                      type="button"
                      onClick={() => {
                        setArea('mine')
                        setStatus('all')
                        setPeriod('all')
                        setSort('urgency')
                        setVerifiedOnly(false)
                      }}
                      className="inline-flex h-11 items-center gap-1 rounded-[10px] px-2.5 text-[14px] font-bold text-brand hover:bg-brand-tint"
                    >
                      <IconX size={16} strokeWidth={2.4} /> Wyczyść
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 [@media(max-height:820px)]:hidden">
            <Stat value={problems.length} label="problemy" />
            <Stat value={waitingCount} label="czeka na nowy termin" accent />
            <Stat value={ideas.reduce((n, it) => n + it.count, 0)} label="próśb o zmiany" />
          </div>
          <div role="tablist" aria-label="Rodzaj spraw" className="grid grid-cols-2 rounded-btn border border-line bg-surface p-1">
            {(
              [
                ['problem', `Problemy (${problems.length})`],
                ['idea', `Pomysły (${ideas.length})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`min-h-10 rounded-[10px] px-3 text-[15px] font-bold ${tab === key ? 'bg-ink text-white' : 'text-ink hover:bg-canvas'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1 max-[999px]:max-h-[55vh] max-[999px]:flex-none">
            <CaseList items={items} s={s} reports={reports} selectedId={selected} onSelect={(id) => openCase(id)} />
          </div>
        </section>

        <section ref={mapBoxRef} className="relative min-w-0 flex-1 overflow-hidden rounded-card border border-line max-[999px]:h-[75vh] max-[999px]:min-h-[460px] max-[999px]:flex-none" aria-label="Mapa">
          <MapView
            center={districts[0].center}
            zoom={13}
            fitPoints={fitPoints}
            fitKey={area}
            fitPadding={{ top: 80, bottom: 40, left: 40, right: 40 }}
            markers={markers}
            onMarkerClick={(id) => setPopupId(id)}
            popup={popup}
            flyTo={selectedCase?.location ?? null}
            occludeRight={selectedCase ? detailPx : 0}
            showControls
            ariaLabel="Mapa Torunia ze zgłoszeniami i dokumentami miasta"
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-2" role="group" aria-label="Warstwy mapy">
            {LAYER_LABELS.map((l) => (
              <label
                key={l.key}
                className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3 text-[14px] font-bold shadow-sm ${layers[l.key] ? 'text-ink' : 'text-ink-2 opacity-70'}`}
              >
                <input type="checkbox" className="sr-only" checked={layers[l.key]} onChange={(e) => setLayers((x) => ({ ...x, [l.key]: e.target.checked }))} />
                <span className={l.swatch} aria-hidden="true" />
                {l.label}
                {!layers[l.key] && <span className="sr-only">(ukryte)</span>}
              </label>
            ))}
          </div>

          {selectedCase && (
            <div className="absolute inset-y-0 right-0 z-10 border-l border-line shadow-2xl animate-[push-in_260ms_ease-out]" style={{ width: detailPx }}>
              <CaseDetail s={s} caseId={selectedCase.id} reports={reports} onClose={() => setSelected(null)} onDraft={() => setDrafting(true)} />
            </div>
          )}
        </section>
      </div>

      {drafting && selectedCase && <InterpellationModal s={s} caseId={selectedCase.id} onClose={() => setDrafting(false)} />}
      {showAi && <AiArchitectureModal onClose={() => setShowAi(false)} />}
    </div>
  )
}

function Stat({ value, label, accent = false }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className={`rounded-btn border px-3 py-2 ${accent && value ? 'border-[#f0d9ad] bg-st-wait-bg' : 'border-line bg-surface'}`}>
      <div className={`text-[24px] font-bold leading-7 ${accent && value ? 'text-st-wait' : ''}`}>{value}</div>
      <div className={`text-[13px] leading-4 ${accent && value ? 'text-st-wait' : 'text-ink-2'}`}>{label}</div>
    </div>
  )
}
