import type { DemoState } from '../lib/store'
import type { Report } from '../lib/types'
import { caseStatus, caseUrgency, DOC_KIND_LABEL, unitById } from '../lib/domain'
import { countLabel, formatDate, REPORT_FORMS } from '../lib/format'
import { Carousel } from '../components/Carousel'
import { StatusBadge, Tag, TypeBadge } from '../components/ui'
import { IconChevron, IconExternal, IconX } from '../components/icons'
import { caseSlides, CommitmentBadge } from '../components/shared'

function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Zamknij dymek"
      onClick={onClose}
      className="absolute top-2 right-2 z-10 flex size-9 items-center justify-center rounded-full bg-surface/95 text-ink shadow hover:bg-surface"
    >
      <IconX size={18} strokeWidth={2.4} />
    </button>
  )
}

export function CasePopup({ s, caseId, reports, onOpen, onClose }: { s: DemoState; caseId: string; reports: Report[]; onOpen: () => void; onClose: () => void }) {
  const c = s.cases.find((x) => x.id === caseId)
  if (!c) return null
  const st = caseStatus(c, s.documents)
  const u = caseUrgency(c, reports, s.documents)
  const n = reports.filter((r) => r.caseId === c.id).length
  return (
    <div className="relative w-[320px] bg-surface">
      <CloseBtn onClose={onClose} />
      <Carousel slides={caseSlides(c, s)} height={150} />
      <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
        <div className="flex flex-wrap gap-1.5">
          <TypeBadge type={c.type} small />
          <StatusBadge status={st} small />
        </div>
        <div>
          <div className="text-[18px] font-bold leading-6 text-ink">{c.title}</div>
          <div className="text-[14px] leading-5 text-ink-2">
            {c.place} · {unitById(c.unitId).short} · {countLabel(n, REPORT_FORMS)}
          </div>
        </div>
        {u.tags[0] && (
          <div className="flex flex-wrap gap-1.5">
            <Tag tag={u.tags[0]} />
          </div>
        )}
        <button
          type="button"
          onClick={onOpen}
          className="mt-1 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-btn bg-ink px-4 text-[16px] font-bold text-white hover:bg-[#2b3036]"
        >
          Historia miejsca <IconChevron size={18} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  )
}

export function DocPopup({ s, docId, onOpenCase, onClose }: { s: DemoState; docId: string; onOpenCase: (id: string) => void; onClose: () => void }) {
  const d = s.documents.find((x) => x.id === docId)
  if (!d) return null
  const c = s.cases.find((x) => x.documentIds.includes(d.id))
  return (
    <div className="relative w-[320px] bg-surface px-4 pt-3 pb-4">
      <button type="button" aria-label="Zamknij dymek" onClick={onClose} className="absolute top-2 right-2 flex size-9 items-center justify-center rounded-full hover:bg-canvas">
        <IconX size={18} strokeWidth={2.4} />
      </button>
      <div className="pr-8 text-[13px] font-bold text-ink-2">
        {DOC_KIND_LABEL[d.kind]} · {formatDate(d.date)}
      </div>
      <div className="mt-0.5 text-[16px] font-bold leading-[22px] text-ink">{d.title}</div>
      <p className="mt-1 text-[14px] leading-5 text-ink-2">{d.summary}</p>
      {d.commitment && (
        <div className="mt-2">
          <CommitmentBadge d={d} s={s} />
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-4">
        <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 text-[15px] font-bold text-brand hover:underline">
          Źródło: BIP <IconExternal size={15} strokeWidth={2.2} />
        </a>
        {c && (
          <button type="button" onClick={() => onOpenCase(c.id)} className="min-h-10 text-left text-[15px] font-bold text-ink underline-offset-4 hover:underline">
            Sprawa: {c.title}
          </button>
        )}
      </div>
    </div>
  )
}
