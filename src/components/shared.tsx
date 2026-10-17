import type { Case, CaseEvent, CityDocument, EventType } from '../lib/types'
import type { DemoState } from '../lib/store'
import type { MapMarker } from './MapView'
import { caseReports, caseStatus, DOC_KIND_LABEL, isOverdue, latestCommitment, visibleDocs } from '../lib/domain'
import { countLabel, formatDate, lowerFirst, REPORT_FORMS, romanMonth } from '../lib/format'
import {
  IconAlert,
  IconBuilding,
  IconCalendar,
  IconCheck,
  IconCircle,
  IconExternal,
  IconFile,
  IconLink,
  IconMegaphone,
  IconRefresh,
  IconSend,
  IconUsers,
  IconWrench,
} from './icons'

export function caseMarkers(s: DemoState, opts: { selectedId?: string | null; problems?: boolean; ideas?: boolean } = {}): MapMarker[] {
  const { problems = true, ideas = true } = opts
  return s.cases
    .filter((c) => (c.type === 'idea' ? ideas : problems))
    .map((c) => {
      const st = caseStatus(c, s.documents)
      const n = caseReports(c, s.reports).length
      return {
        id: c.id,
        location: c.location,
        kind: st === 'resolved' ? 'resolved' : c.type === 'idea' ? 'idea' : 'problem',
        label: st === 'resolved' || n < 2 ? undefined : n,
        title: `${c.title}, ${c.place}: ${countLabel(n, REPORT_FORMS)}`,
        selected: opts.selectedId === c.id,
      } satisfies MapMarker
    })
}

export function documentMarkers(s: DemoState, opts: { docs?: boolean; commitments?: boolean; selectedId?: string | null } = {}): MapMarker[] {
  const { docs = true, commitments = true } = opts
  const out: MapMarker[] = []
  for (const d of visibleDocs(s.documents)) {
    const cs = commitmentState(d, s)
    if (cs === 'overdue' || cs === 'pending') {
      if (!commitments) continue
      const over = cs === 'overdue'
      out.push({
        id: d.id,
        location: d.location,
        kind: over ? 'overdue' : 'planned',
        title: `${over ? 'Obietnica przeterminowana' : 'Zobowiązanie miasta'}: ${d.commitment!.text}, termin ${romanMonth(d.commitment!.deadline)}`,
        selected: opts.selectedId === d.id,
      })
    } else if (docs) {
      out.push({ id: d.id, location: d.location, kind: 'doc', title: `${DOC_KIND_LABEL[d.kind]}: ${d.title}`, selected: opts.selectedId === d.id })
    }
  }
  return out
}

/** Zobowiązanie spełnione, jeśli sprawa, do której należy, ma remont wykonany albo jest rozwiązana, albo zastąpiło je nowsze */
export function isCommitmentFulfilled(d: CityDocument, s: DemoState): boolean {
  const c = s.cases.find((x) => x.documentIds.includes(d.id))
  if (!c) return false
  const st = caseStatus(c, s.documents)
  if (st === 'done' || st === 'resolved') return true
  const lc = latestCommitment(c, s.documents)
  return !!lc && lc.doc.id !== d.id
}

/** Zdjęcia sprawy do karuzeli: najnowsze najpierw, bez powtórzeń tego samego pliku */
export function caseSlides(c: Case, s: DemoState): { src: string; alt: string; caption?: string }[] {
  const seen = new Set<string>()
  const out: { src: string; alt: string; caption?: string }[] = []
  for (const r of caseReports(c, s.reports).slice().reverse()) {
    if (seen.has(r.photo)) continue
    seen.add(r.photo)
    out.push({ src: r.photo, alt: `Zdjęcie mieszkańca: ${r.description}`, caption: shortDate(r.createdAt) })
  }
  if (out.length === 0) out.push({ src: c.photo, alt: `Zdjęcie: ${c.title}` })
  return out
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export type CommitmentState = 'overdue' | 'pending' | 'rescheduled' | 'fulfilled' | 'none'

/** Stan zobowiązania z dokumentu. Po wykonaniu remontu nie straszymy „terminem”, tylko piszemy łagodnie. */
export function commitmentState(d: CityDocument, s: DemoState): CommitmentState {
  if (!d.commitment) return 'none'
  const c = s.cases.find((x) => x.documentIds.includes(d.id))
  if (c) {
    const st = caseStatus(c, s.documents)
    if (st === 'done' || st === 'resolved') return 'fulfilled'
    const lc = latestCommitment(c, s.documents)
    if (lc && lc.doc.id !== d.id) return 'rescheduled'
  }
  return isOverdue(d.commitment) ? 'overdue' : 'pending'
}

export const COMMITMENT_LABEL: Record<Exclude<CommitmentState, 'none'>, { label: (deadline: string) => string; tone: 'danger' | 'info' | 'neutral' | 'success' }> = {
  overdue: { label: (dl) => `Termin ${romanMonth(dl)} minął`, tone: 'danger' },
  pending: { label: (dl) => `Termin ${romanMonth(dl)}`, tone: 'info' },
  rescheduled: { label: (dl) => `Pierwotny termin ${romanMonth(dl)}, zmieniony`, tone: 'neutral' },
  fulfilled: { label: () => 'Zrealizowano', tone: 'success' },
}

export function CommitmentBadge({ d, s }: { d: CityDocument; s: DemoState }) {
  const cs = commitmentState(d, s)
  if (cs === 'none' || !d.commitment) return null
  const { label, tone } = COMMITMENT_LABEL[cs]
  const cls = {
    danger: 'bg-st-overdue-bg text-st-overdue',
    info: 'bg-st-planned-bg text-st-planned',
    neutral: 'bg-st-new-bg text-st-new',
    success: 'bg-st-done-bg text-st-done',
  }[tone]
  const Icon = tone === 'danger' ? IconAlert : tone === 'success' ? IconCheck : IconCalendar
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[14px] font-bold leading-5 ${cls}`}>
      <Icon size={14} strokeWidth={2.4} />
      {label(d.commitment.deadline)}
    </span>
  )
}

const EVENT_STYLE: Record<EventType, { cls: string; Icon: typeof IconCheck }> = {
  reported: { cls: 'bg-brand text-white', Icon: IconSend },
  merged: { cls: 'bg-st-new-bg text-st-new', Icon: IconUsers },
  forwarded: { cls: 'bg-st-new-bg text-st-new', Icon: IconBuilding },
  interpellation: { cls: 'bg-ink text-white', Icon: IconMegaphone },
  response: { cls: 'bg-ink text-white', Icon: IconFile },
  planned: { cls: 'bg-st-planned-bg text-st-planned', Icon: IconCalendar },
  done: { cls: 'bg-st-planned-bg text-st-planned', Icon: IconWrench },
  resolved: { cls: 'bg-st-done-bg text-st-done', Icon: IconCheck },
  reopened: { cls: 'bg-brand-tint text-st-overdue', Icon: IconRefresh },
}

export function Timeline({ events, documents, newestFirst = true, highlightId }: { events: CaseEvent[]; documents: CityDocument[]; newestFirst?: boolean; highlightId?: string }) {
  const list = newestFirst ? [...events].reverse() : events
  return (
    <ol className="relative flex flex-col" aria-label="Oś zdarzeń sprawy">
      {list.map((e, i) => {
        const { cls, Icon } = EVENT_STYLE[e.type] ?? { cls: 'bg-st-new-bg text-st-new', Icon: IconCircle }
        const doc = e.docId ? documents.find((d) => d.id === e.docId) : undefined
        const last = i === list.length - 1
        const fresh = highlightId === e.id
        return (
          <li key={e.id} className="relative flex gap-3.5 pb-5 animate-fade-up">
            {!last && <span className="absolute top-10 bottom-0 left-[19px] w-0.5 bg-line" aria-hidden="true" />}
            <span className={`relative z-[1] flex size-10 shrink-0 items-center justify-center rounded-full ${cls} ${fresh ? 'ring-4 ring-brand/25' : ''}`}>
              <Icon size={20} strokeWidth={2.2} />
            </span>
            <div className="min-w-0 pt-1.5">
              <div className="text-[17px] font-bold leading-6">{e.title}</div>
              <div className="text-small text-ink-2">{formatDate(e.date)}</div>
              {e.text && <div className="mt-1 text-[16px] leading-6 text-ink">{e.text}</div>}
              {doc && <DocLink doc={doc} compact />}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function DocLink({ doc, compact = false }: { doc: CityDocument; compact?: boolean }) {
  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noreferrer"
      className={`mt-1 inline-flex items-center gap-1.5 font-bold text-brand hover:underline ${compact ? 'min-h-8 text-[15px]' : 'min-h-10 text-[16px]'}`}
    >
      {compact ? <IconLink size={16} strokeWidth={2.2} /> : null}
      {compact ? `${DOC_KIND_LABEL[doc.kind]} w BIP` : 'Zobacz dokument w BIP'}
      {!compact && <IconExternal size={16} strokeWidth={2.2} />}
    </a>
  )
}

/** Krótka informacja „co miasto wie o tym miejscu” dla sprawy */
export function cityKnowledge(c: Case, s: DemoState): { status: ReturnType<typeof caseStatus>; text: string; doc?: CityDocument } {
  const st = caseStatus(c, s.documents)
  const lc = latestCommitment(c, s.documents)
  const docs = visibleDocs(s.documents).filter((d) => c.documentIds.includes(d.id))
  const lastDoc = docs.sort((a, b) => a.date.localeCompare(b.date))[docs.length - 1]
  if (st === 'resolved') return { status: st, text: 'Sprawa rozwiązana i potwierdzona przez mieszkańców.', doc: lastDoc }
  if (st === 'done' && c.events[c.events.length - 1]?.type === 'reopened')
    return { status: st, text: 'Remont wykonano, ale mieszkaniec zgłosił, że problem wrócił. Utworzono powiązane zgłoszenie z sygnałem o gwarancji.', doc: lastDoc }
  if (st === 'done') return { status: st, text: 'Remont został wykonany. Czekamy na potwierdzenie mieszkańców, że problem zniknął.', doc: lastDoc }
  if (lc && st === 'overdue')
    return { status: st, text: `Miasto zapowiedziało: ${lowerFirst(lc.commitment.text)} do ${romanMonth(lc.commitment.deadline)}. Termin minął.`, doc: lc.doc }
  if (lc) return { status: st, text: `Zaplanowano: ${lowerFirst(lc.commitment.text)}, termin ${romanMonth(lc.commitment.deadline)}.`, doc: lc.doc }
  if (lastDoc) return { status: st, text: `${DOC_KIND_LABEL[lastDoc.kind]} z ${formatDate(lastDoc.date)}: ${lastDoc.summary}`, doc: lastDoc }
  return { status: st, text: 'Nie znaleźliśmy planów miasta dla tego miejsca. Sprawa trafiła do właściwej jednostki i radnych okręgu.' }
}

export function OverdueNote({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-[15px] font-bold leading-[22px] text-st-overdue">
      <IconAlert size={18} className="mt-0.5 shrink-0" strokeWidth={2.4} />
      {text}
    </div>
  )
}

/**
 * Zdjęcie zgłoszenia. Prawdziwe zdjęcia leżą w public/zdjecia/<nazwa>[-n].jpg.
 * Gdy pliku brak: ilustracja public/demo/<nazwa>.svg, a na końcu neutralny zastępnik.
 */
export function Photo({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  return (
    <img
      src={src || '/demo/zastepcze.svg'}
      alt={alt}
      className={`bg-[#e6e8eb] object-cover ${className}`}
      onError={(e) => {
        const img = e.currentTarget
        const real = img.src.match(/\/zdjecia\/([a-z0-9]+?)(?:-\d+)?\.(?:jpe?g|png|webp)$/i)
        if (real) img.src = `/demo/${real[1]}.svg`
        else if (!img.src.endsWith('/demo/zastepcze.svg')) img.src = '/demo/zastepcze.svg'
      }}
    />
  )
}
