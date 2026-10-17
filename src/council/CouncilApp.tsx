import { useMemo, useState } from 'react'
import { useDemo } from '../lib/store'
import { MapView, type MapMarker } from '../components/MapView'
import { Logo } from '../components/ui'
import { caseMarkers, commitmentState, documentMarkers } from '../components/shared'
import { CasePopup, DocPopup } from './MapPopups'
import { RUBINKOWO_CENTER } from '../lib/geo'
import { COUNCILLOR } from '../lib/interpelacja'
import { buildList, CaseList } from './CaseList'
import { CaseDetail } from './CaseDetail'
import { InterpellationModal } from './InterpellationModal'

type Tab = 'problem' | 'idea'
type Layers = { problems: boolean; ideas: boolean; docs: boolean; commitments: boolean }

const LAYER_LABELS: { key: keyof Layers; label: string; swatch: string }[] = [
  { key: 'problems', label: 'Problemy', swatch: 'size-3.5 rounded-full bg-brand' },
  { key: 'ideas', label: 'Pomysły', swatch: 'size-3.5 rounded-full bg-idea-pin' },
  { key: 'docs', label: 'Dokumenty miasta', swatch: 'size-3.5 rounded-full border-[1.5px] border-line-strong bg-surface' },
  { key: 'commitments', label: 'Zobowiązania', swatch: 'size-3.5 rounded-full border-[2.5px] border-brand bg-surface' },
]

export function CouncilApp() {
  const s = useDemo()
  const [tab, setTab] = useState<Tab>('problem')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [docId, setDocId] = useState<string | null>(null)
  const [drafting, setDrafting] = useState(false)
  const [layers, setLayers] = useState<Layers>({ problems: true, ideas: true, docs: true, commitments: true })

  const reports = useMemo(() => (verifiedOnly ? s.reports.filter((r) => r.verified) : s.reports), [s.reports, verifiedOnly])
  const problems = useMemo(() => buildList(s, reports, 'problem', verifiedOnly), [s, reports, verifiedOnly])
  const ideas = useMemo(() => buildList(s, reports, 'idea', verifiedOnly), [s, reports, verifiedOnly])
  const items = tab === 'problem' ? problems : ideas
  const overdueCount = problems.filter((it) => it.c.documentIds.some((id) => {
    const d = s.documents.find((x) => x.id === id && !x.hidden)
    return !!d && commitmentState(d, s) === 'overdue'
  })).length

  const markers: MapMarker[] = useMemo(() => {
    const visibleCaseIds = new Set([...problems, ...ideas].map((it) => it.c.id))
    const cm = caseMarkers({ ...s, reports }, { selectedId: docId ?? selected, problems: layers.problems, ideas: layers.ideas }).filter((m) => visibleCaseIds.has(m.id))
    return [...documentMarkers(s, { docs: layers.docs, commitments: layers.commitments, selectedId: docId }), ...cm]
  }, [s, reports, problems, ideas, selected, layers, docId])

  const selectedCase = selected ? s.cases.find((c) => c.id === selected) : null
  const popupCase = docId ? s.cases.find((c) => c.id === docId) : null
  const popupDoc = docId && !popupCase ? s.documents.find((d) => d.id === docId) : null

  // klik w punkt: dymek ze zdjęciami; „Historia miejsca” otwiera panel szczegółów
  const onMarker = (id: string) => setDocId(id)
  const openCase = (id: string) => {
    const c = s.cases.find((x) => x.id === id)
    if (!c) return
    setTab(c.type)
    setSelected(id)
    setDocId(null)
  }
  const popup = popupCase
    ? {
        key: popupCase.id,
        location: popupCase.location,
        onClose: () => setDocId(null),
        content: <CasePopup s={s} caseId={popupCase.id} reports={reports} onOpen={() => openCase(popupCase.id)} onClose={() => setDocId(null)} />,
      }
    : popupDoc
      ? {
          key: popupDoc.id,
          location: popupDoc.location,
          onClose: () => setDocId(null),
          content: <DocPopup s={s} docId={popupDoc.id} onOpenCase={openCase} onClose={() => setDocId(null)} />,
        }
      : null

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-line bg-surface px-7 py-3.5">
        <div className="flex items-center gap-3.5">
          <Logo />
          <div className="text-[20px] font-bold">Głos Osiedla</div>
          <div className="h-7 w-px bg-line" />
          <div className="text-[17px] text-ink-2">Panel radnego · Okręg Rubinkowo</div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex h-12 cursor-pointer items-center gap-2.5 rounded-btn border border-line bg-surface px-4 text-[16px] hover:bg-canvas">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="size-5 accent-brand" />
            Tylko zweryfikowani mieszkańcy
          </label>
          <div className="flex items-center gap-2.5" title={COUNCILLOR.note}>
            <div className="flex size-11 items-center justify-center rounded-full bg-st-new-bg text-[16px] font-bold text-st-new">{COUNCILLOR.initials}</div>
            <div className="hidden text-[15px] leading-5 xl:block">
              <div className="font-bold">{COUNCILLOR.name}</div>
              <div className="text-ink-2">radna (postać fikcyjna)</div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-5 px-7 py-5">
        <section className="flex w-[440px] shrink-0 flex-col gap-3" aria-label="Sprawy">
          <div className="grid grid-cols-3 gap-2.5">
            <Stat value={problems.length} label="sprawy" />
            <Stat value={overdueCount} label="przeterminowane" danger />
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
                className={`min-h-11 rounded-[10px] px-3 text-[16px] font-bold ${tab === key ? 'bg-ink text-white' : 'text-ink hover:bg-canvas'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <CaseList
              items={items}
              s={s}
              reports={reports}
              selectedId={selected}
              onSelect={(id) => {
                setSelected(id)
                setDocId(null)
              }}
            />
          </div>
        </section>

        <section className="relative min-w-0 flex-1 overflow-hidden rounded-card border border-line" aria-label="Mapa okręgu">
          <MapView
            center={RUBINKOWO_CENTER}
            zoom={15}
            fitPoints={s.cases.map((c) => c.location)}
            fitPadding={{ top: 90, bottom: 40, left: 40, right: 40 }}
            markers={markers}
            onMarkerClick={onMarker}
            popup={popup}
            flyTo={selectedCase?.location ?? null}
            flyPadRight={540}
            showControls
            ariaLabel="Mapa okręgu Rubinkowo ze zgłoszeniami i dokumentami miasta"
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-2" role="group" aria-label="Warstwy mapy">
            {LAYER_LABELS.map((l) => (
              <label
                key={l.key}
                className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border bg-surface px-3.5 text-[15px] font-bold shadow-sm ${layers[l.key] ? 'border-line text-ink' : 'border-line text-ink-2 opacity-70'}`}
              >
                <input type="checkbox" className="sr-only" checked={layers[l.key]} onChange={(e) => setLayers((x) => ({ ...x, [l.key]: e.target.checked }))} />
                <span className={l.swatch} aria-hidden="true" />
                {l.label}
                {!layers[l.key] && <span className="sr-only">(ukryte)</span>}
              </label>
            ))}
          </div>

          {selectedCase && (
            <div className="absolute inset-y-0 right-0 z-10 w-[540px] max-w-full border-l border-line shadow-2xl animate-[fade-up_240ms_ease-out_both]">
              <CaseDetail s={s} caseId={selectedCase.id} reports={reports} onClose={() => setSelected(null)} onDraft={() => setDrafting(true)} />
            </div>
          )}
        </section>
      </div>

      {drafting && selectedCase && <InterpellationModal s={s} caseId={selectedCase.id} onClose={() => setDrafting(false)} />}
    </div>
  )
}

function Stat({ value, label, danger = false }: { value: number; label: string; danger?: boolean }) {
  return (
    <div className={`rounded-btn border px-3 py-2.5 ${danger && value ? 'border-brand bg-brand-tint' : 'border-line bg-surface'}`}>
      <div className={`text-[26px] font-bold leading-8 ${danger && value ? 'text-st-overdue' : ''}`}>{value}</div>
      <div className={`text-[14px] leading-5 ${danger && value ? 'text-st-overdue' : 'text-ink-2'}`}>{label}</div>
    </div>
  )
}
