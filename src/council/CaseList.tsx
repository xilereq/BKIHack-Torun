import type { Case, Report } from '../lib/types'
import type { DemoState } from '../lib/store'
import { caseStatus, caseUrgency, unitById } from '../lib/domain'
import { StatusBadge, Tag } from '../components/ui'
import { IconBulb } from '../components/icons'
import { plural } from '../lib/format'

export interface ListItem {
  c: Case
  score: number
  count: number
  fresh: boolean
}

export function buildList(s: DemoState, reports: Report[], type: 'problem' | 'idea', verifiedOnly: boolean): ListItem[] {
  const now = Date.now()
  return s.cases
    .filter((c) => c.type === type)
    .map((c) => {
      const rs = reports.filter((r) => r.caseId === c.id)
      const u = caseUrgency(c, reports, s.documents)
      const fresh = rs.some((r) => now - new Date(r.createdAt).getTime() < 30 * 60000)
      return { c, score: u.score, count: rs.length, fresh }
    })
    .filter((it) => !verifiedOnly || it.count > 0)
    .sort((a, b) => {
      const ra = caseStatus(a.c, s.documents) === 'resolved' ? 1 : 0
      const rb = caseStatus(b.c, s.documents) === 'resolved' ? 1 : 0
      if (ra !== rb) return ra - rb
      return type === 'idea' ? b.count - a.count : b.score - a.score
    })
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 80 ? 'bg-brand text-white' : score >= 55 ? 'bg-brand-tint text-st-overdue' : 'bg-st-new-bg text-st-new'
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
                    {c.place} · {unitById(c.unitId).short}
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
