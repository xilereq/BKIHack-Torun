import type { Report } from '../lib/types'
import type { DemoState } from '../lib/store'
import { caseDocuments, caseStatus, caseUrgency, DOC_KIND_LABEL, unitById } from '../lib/domain'
import { formatDate, plural } from '../lib/format'
import { Button, StatusBadge, Tag, TypeBadge, VerifiedBadge } from '../components/ui'
import { IconExternal, IconFile, IconSparkle, IconX } from '../components/icons'
import { caseSummary, urgencyBreakdown } from '../lib/aiTrace'
import { CommitmentBadge, Photo, Timeline } from '../components/shared'

export function CaseDetail({
  s,
  caseId,
  reports,
  onClose,
  onDraft,
}: {
  s: DemoState
  caseId: string
  reports: Report[]
  onClose: () => void
  onDraft: () => void
}) {
  const c = s.cases.find((x) => x.id === caseId)
  if (!c) return null
  const st = caseStatus(c, s.documents)
  const u = caseUrgency(c, reports, s.documents)
  const rs = reports.filter((r) => r.caseId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const docs = caseDocuments(c, s.documents).slice().reverse()
  const unit = unitById(c.unitId)
  const verifiedCount = rs.filter((r) => r.verified).length
  const summary = caseSummary(c, s)
  const breakdown = urgencyBreakdown(c, s)

  return (
    <aside className="flex h-full flex-col bg-surface" aria-label={`Historia miejsca: ${c.title}`}>
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-6 pt-5 pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            <TypeBadge type={c.type} small />
            <StatusBadge status={st} small />
          </div>
          <h2 className="mt-1.5 text-h2 font-bold">{c.title}</h2>
          <div className="text-small text-ink-2">
            {c.place} · {c.category} · {unit.name}
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Zamknij historię miejsca" className="-mr-2 flex size-12 shrink-0 items-center justify-center rounded-btn hover:bg-canvas">
          <IconX size={22} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6 px-6 py-5">
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              {u.tags.map((t) => (
                <Tag key={t.label} tag={t} />
              ))}
            </div>
            <Button variant="primary" onClick={onDraft} className="self-start">
              <IconFile size={22} strokeWidth={2.2} /> Przygotuj interpelację
            </Button>
          </section>

          <section aria-labelledby="sec-ai" className="min-w-0 rounded-card border border-line bg-[#fafbfc] p-4">
            <h3 id="sec-ai" className="mb-2 flex items-center gap-2 text-[17px] font-bold">
              <IconSparkle size={18} className="text-brand" /> Analiza AI
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-ink-2">
                  Podsumowanie zgłoszeń
                </div>
                <p className="text-[15px] leading-[22px]">{summary.text}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[14px]">
                <span className="flex flex-wrap items-center gap-1.5 text-ink-2">
                  Połączone podobne zgłoszenia
                </span>
                <span className="font-bold tabular-nums">
                  {rs.length} w promieniu 150 m · podobieństwo {Math.round(summary.similarity * 100)}%
                </span>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-[13px] font-bold text-ink-2">
                  <span className="flex flex-wrap items-center gap-1.5">
                    Skąd ta pilność
                  </span>
                  <span className="text-[15px] text-ink">{u.score}/99</span>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {breakdown.map((f) => (
                    <li key={f.label} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-[14px]">
                      <span className="min-w-0">{f.label}</span>
                      <span className="font-bold tabular-nums">{f.points >= 0 ? `+${f.points}` : `−${-f.points}`}</span>
                      <span className="col-span-2 block h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                        <span className="block h-full rounded-full bg-ink" style={{ width: `${Math.max(0, Math.min(100, (f.points / 40) * 100))}%` }} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section aria-labelledby="sec-reports">
            <h3 id="sec-reports" className="mb-2.5 text-[18px] font-bold">
              Zgłoszenia mieszkańców ({rs.length}
              {verifiedCount ? `, w tym ${verifiedCount} ${plural(verifiedCount, ['zweryfikowane', 'zweryfikowane', 'zweryfikowanych'])}` : ''})
            </h3>
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {rs.slice(0, 6).map((r) => (
                <Photo key={r.id} src={r.photo} alt={`Zdjęcie zgłoszenia z ${formatDate(r.createdAt)}`} className="h-20 w-28 shrink-0 rounded-[10px] border border-line" />
              ))}
            </div>
            <ul className="flex flex-col divide-y divide-[#eef0f3] rounded-card border border-line">
              {rs.slice(0, 6).map((r) => (
                <li key={r.id} className="flex flex-col gap-1 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2 text-[14px] text-ink-2">
                    {formatDate(r.createdAt)}
                    {r.verified && <VerifiedBadge small />}
                    {Date.now() - new Date(r.createdAt).getTime() < 30 * 60000 && (
                      <span className="rounded-full bg-brand px-2 text-[13px] font-bold leading-5 text-white">Nowe</span>
                    )}
                  </div>
                  <div className="text-[16px] leading-6">„{r.description}”</div>
                </li>
              ))}
              {rs.length > 6 && <li className="px-4 py-2.5 text-[15px] text-ink-2">i {rs.length - 6} więcej</li>}
            </ul>
          </section>

          <section aria-labelledby="sec-docs">
            <h3 id="sec-docs" className="mb-2.5 text-[18px] font-bold">
              Dokumenty i zobowiązania miasta
            </h3>
            {docs.length === 0 ? (
              <p className="rounded-card border border-line px-4 py-3 text-ink-2">Brak dokumentów miasta dla tego miejsca.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {docs.map((d) => {
                  return (
                    <li key={d.id} className="rounded-card border border-line px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2 text-[14px] font-bold text-ink-2">
                        {DOC_KIND_LABEL[d.kind]} · {formatDate(d.date)}
                      </div>
                      <div className="mt-0.5 text-[16px] font-bold leading-6">{d.title}</div>
                      <div className="mt-0.5 text-[15px] leading-[22px] text-ink-2">{d.summary}</div>
                      {d.commitment && (
                        <div className="mt-2">
                          <CommitmentBadge d={d} s={s} />
                          
                        </div>
                      )}
                      <div>
                        <a href={d.url} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex min-h-9 items-center gap-1.5 text-[15px] font-bold text-brand hover:underline">
                          Źródło: BIP Toruń <IconExternal size={15} strokeWidth={2.2} />
                        </a>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="sec-history">
            <h3 id="sec-history" className="mb-3 text-[18px] font-bold">
              Historia sprawy
            </h3>
            <Timeline events={c.events} documents={s.documents} />
          </section>
        </div>
      </div>
    </aside>
  )
}
