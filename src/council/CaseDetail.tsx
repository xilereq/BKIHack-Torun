import type { Report } from '../lib/types'
import type { DemoState } from '../lib/store'
import { caseDocuments, caseStatus, caseUrgency, DOC_KIND_LABEL, monthsOverdue, unitById } from '../lib/domain'
import { formatDate, plural } from '../lib/format'
import { Button, StatusBadge, Tag, TypeBadge, VerifiedBadge } from '../components/ui'
import { IconExternal, IconFile, IconX } from '../components/icons'
import { CommitmentBadge, commitmentState, Photo, Timeline } from '../components/shared'

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
                  const over = commitmentState(d, s) === 'overdue'
                  return (
                    <li key={d.id} className={`rounded-card px-4 py-3 ${over ? 'border-2 border-brand' : 'border border-line'}`}>
                      <div className="flex flex-wrap items-center gap-2 text-[14px] font-bold text-ink-2">
                        {DOC_KIND_LABEL[d.kind]} · {formatDate(d.date)}
                      </div>
                      <div className="mt-0.5 text-[16px] font-bold leading-6">{d.title}</div>
                      <div className="mt-0.5 text-[15px] leading-[22px] text-ink-2">{d.summary}</div>
                      {d.commitment && (
                        <div className="mt-2">
                          <CommitmentBadge d={d} s={s} />
                          {over && <span className="ml-2 text-[14px] text-st-overdue">{monthsOverdue(d.commitment.deadline)} mies. temu</span>}
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
