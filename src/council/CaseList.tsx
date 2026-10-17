import type { Case, Report } from '../lib/types'
import type { DemoState } from '../lib/store'
import { caseStatus, caseUrgency, unitById } from '../lib/domain'
import { StatusBadge, Tag } from '../components/ui'
import { IconBulb } from '../components/icons'
import { plural } from '../lib/format'
import { districtName } from '../lib/geo'

export interface ListItem {
  c: Case
  score: number
  count: number
  fresh: boolean
  last: string
}

export type StatusFilter = 'all' | 'attention' | 'planned' | 'done'
export type SortKey = 'urgency' | 'newest' | 'oldest' | 'reports' | 'supporters'
export interface Filters {
  /** id osiedli w obszarze; null = całe miasto */
  districts: string[] | null
  status: StatusFilter
  /** zgłoszenia od–do (RRRR-MM-DD), null = bez ograniczenia */
  from: string | null
  to: string | null
  sort: SortKey
  verifiedOnly: boolean
}

export function matchesStatus(c: Case, s: DemoState, f: StatusFilter): boolean {
  if (f === 'all') return true
  const st = caseStatus(c, s.documents)
  if (f === 'attention') return st === 'new' || st === 'overdue'
  if (f === 'planned') return st === 'planned'
  return st === 'done' || st === 'resolved'
}

/** Lista spraw po filtrach (obszar, status, okres zgłoszeń, zweryfikowani) i sortowaniu */
export function buildList(s: DemoState, reports: Report[], type: 'problem' | 'idea', f: Filters): ListItem[] {
  const now = Date.now()
  const inRange = (iso: string) => (!f.from || iso.slice(0, 10) >= f.from) && (!f.to || iso.slice(0, 10) <= f.to)
  const items = s.cases
    .filter((c) => c.type === type)
    .filter((c) => !f.districts || f.districts.includes(c.district))
    .filter((c) => matchesStatus(c, s, f.status))
    .map((c) => {
      const rs = reports.filter((r) => r.caseId === c.id)
      const u = caseUrgency(c, reports, s.documents)
      const fresh = rs.some((r) => now - new Date(r.createdAt).getTime() < 30 * 60000)
      const last = rs.reduce((m, r) => (r.createdAt > m ? r.createdAt : m), c.createdAt)
      return { c, score: u.score, count: rs.length, fresh, last, rs }
    })
    .filter((it) => !f.verifiedOnly || it.count > 0)
    .filter((it) => (!f.from && !f.to) || it.rs.some((r) => inRange(r.createdAt)))
  const by: Record<SortKey, (a: (typeof items)[number], b: (typeof items)[number]) => number> = {
    urgency: (a, b) => (type === 'idea' ? b.count - a.count : b.score - a.score),
    newest: (a, b) => b.last.localeCompare(a.last),
    oldest: (a, b) => a.c.createdAt.localeCompare(b.c.createdAt),
    reports: (a, b) => b.count - a.count,
    supporters: (a, b) => (b.c.supporters ?? 0) - (a.c.supporters ?? 0),
  }
  return items
    .sort((a, b) => {
      // rozwiązane na końcu, chyba że filtrujemy właśnie wykonane
      const ra = f.status !== 'done' && caseStatus(a.c, s.documents) === 'resolved' ? 1 : 0
      const rb = f.status !== 'done' && caseStatus(b.c, s.documents) === 'resolved' ? 1 : 0
      return ra - rb || by[f.sort](a, b)
    })
    .map(({ c, score, count, fresh, last }) => ({ c, score, count, fresh, last }))
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 80 ? 'bg-ink text-white' : score >= 55 ? 'bg-st-new-bg text-ink' : 'bg-canvas text-st-new'
  return (
    <div className={`flex w-14 shrink-0 flex-col items-center rounded-[10px] px-2 py-1.5 ${cls}`} aria-label={`Pilność ${score} na 99`}>
      <span className="text-[20px] font-bold leading-[22px]">{score}</span>
      <span className="text-[12px] leading-[14px]">pilność</span>
    </div>
  )
}

export function CaseList({
  items,
  s,
  reports,
  selectedId,
  onSelect,
}: {
  items: ListItem[]
  s: DemoState
  reports: Report[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  if (items.length === 0) {
    return <div className="rounded-card border border-line bg-surface p-5 text-ink-2">Brak spraw spełniających filtr. Wyłącz „Tylko zweryfikowani mieszkańcy”, aby zobaczyć wszystkie.</div>
  }
  return (
    <ul className="flex flex-col gap-2.5" aria-label="Lista spraw">
      {items.map(({ c, score, count, fresh }) => {
        const st = caseStatus(c, s.documents)
        const u = caseUrgency(c, reports, s.documents)
        const selected = selectedId === c.id
        const isIdea = c.type === 'idea'
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              aria-pressed={selected}
              className={`flex w-full flex-col gap-2.5 rounded-card bg-surface px-4 py-3.5 text-left transition-colors hover:bg-[#fafbfc] ${selected ? 'border-2 border-brand' : 'border border-line'} ${st === 'resolved' ? 'opacity-70' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {fresh && <span className="rounded-full bg-brand px-2 text-[13px] font-bold leading-5 text-white animate-pop">Nowe zgłoszenie</span>}
                    {st !== 'new' && !isIdea && <StatusBadge status={st} small />}
                  </div>
                  <div className="mt-1 text-[18px] font-bold leading-6">
                    {isIdea ? (
                      <span className="inline-flex items-start gap-1.5">
                        <IconBulb size={20} className="mt-0.5 shrink-0 text-st-idea" strokeWidth={2.2} />
                        {count} {plural(count, ['osoba prosi', 'osoby proszą', 'osób prosi'])}: {c.title.charAt(0).toLowerCase() + c.title.slice(1)}
                      </span>
                    ) : (
                      c.title
                    )}
                  </div>
                  <div className="text-small text-ink-2">
                    {c.place} · {districtName(c.district)} · {unitById(c.unitId).short}
                  </div>
                </div>
                {!isIdea && <ScoreBadge score={score} />}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {u.tags.slice(0, isIdea ? 3 : 4).map((t) => (
                  <Tag key={t.label} tag={t} />
                ))}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
