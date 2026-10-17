import type { Analysis } from '../lib/ai'
import { useState } from 'react'
import { useDemo } from '../lib/store'
import type { TraceStep } from '../lib/aiTrace'
import { TechChip, TraceList } from '../components/AiTrace'
import { Button, StatusBadge, TypeBadge } from '../components/ui'
import { IconClock, IconChevron, IconSparkle, IconBuilding, IconCalendar, IconCheckCircle, IconShield, IconUsers } from '../components/icons'
import { DocLink, Photo } from '../components/shared'
import { caseReports } from '../lib/domain'
import { plural } from '../lib/format'
import { ScreenHeader } from './ScreenHeader'
import type { ReportDraft } from './ReportScreen'

const TONE_BADGE: Record<Analysis['answer']['tone'], { label: string; cls: string; Icon: typeof IconClock } | null> = {
  overdue: { label: 'Czeka na nowy termin', cls: 'bg-st-wait-bg text-st-wait', Icon: IconClock },
  planned: { label: 'Zaplanowane', cls: 'bg-st-planned-bg text-st-planned', Icon: IconCalendar },
  interpellation: { label: 'Radny już pyta', cls: 'bg-st-new-bg text-st-new', Icon: IconUsers },
  idea: null,
  done: { label: 'Po remoncie', cls: 'bg-st-planned-bg text-st-planned', Icon: IconCalendar },
  none: null,
}

export function ResultScreen({
  draft,
  analysis,
  trace,
  caseId,
  onFollow,
  onVerify,
  onHome,
  onFix,
}: {
  draft: ReportDraft
  analysis: Analysis
  trace: TraceStep[]
  caseId: string | null
  onFollow: () => void
  onVerify: () => void
  onHome: () => void
  onFix: () => void
}) {
  const s = useDemo()
  const [showAi, setShowAi] = useState(false)

  if (analysis.spam || !caseId) {
    return (
      <div className="flex h-full flex-col">
        <ScreenHeader title="Twoje zgłoszenie" onBack={onFix} />
        <div className="flex flex-1 flex-col justify-center gap-4 px-6">
          <h1 className="text-h1 font-bold">To zgłoszenie nie wygląda na sprawę miasta</h1>
          <p className="text-body text-ink-2">AI odsiewa reklamy i treści niezwiązane z okolicą. Opisz, co jest nie tak albo czego brakuje w tym miejscu.</p>
          <Button variant="primary" size="lg" onClick={onFix}>
            Popraw zgłoszenie
          </Button>
          <Button onClick={onHome}>Wróć do mapy</Button>
        </div>
      </div>
    )
  }

  const c = s.cases.find((x) => x.id === caseId)
  const total = c ? caseReports(c, s.reports).length : 1
  const others = total - 1
  const badge = TONE_BADGE[analysis.answer.tone]
  const doc = analysis.answer.docId ? s.documents.find((d) => d.id === analysis.answer.docId) : undefined
  const isIdea = analysis.type === 'idea'

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Twoje zgłoszenie" onBack={onHome} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 px-4 py-4">
          <div className="flex items-center gap-3 rounded-card bg-st-done-bg px-4 py-3.5 text-st-done animate-fade-up">
            <IconCheckCircle size={28} strokeWidth={2.2} className="shrink-0" />
            <div>
              <div className="text-[18px] font-bold leading-6">{isIdea ? 'Pomysł przyjęty' : 'Zgłoszenie przyjęte'}</div>
              <div className="text-small">Będziemy Cię informować aż do rozwiązania.</div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 rounded-card border-2 border-brand bg-surface p-4 animate-fade-up [animation-delay:80ms]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[15px] font-bold text-ink-2">Co miasto wie o tym miejscu</span>
              {badge && (
                <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[14px] font-bold leading-5 ${badge.cls}`}>
                  <badge.Icon size={14} strokeWidth={2.6} />
                  {badge.label}
                </span>
              )}
            </div>
            <p className="text-[18px] leading-[27px]">{analysis.answer.text}</p>
            {doc && <DocLink doc={doc} />}
          </div>

          <div className="flex items-center gap-3.5 rounded-card border border-line bg-surface p-3.5 animate-fade-up [animation-delay:160ms]">
            <Photo src={draft.photo} alt={draft.photoLabel} className="size-[84px] shrink-0 rounded-[12px]" />
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap gap-1.5">
                <TypeBadge type={analysis.type} small />
                {c?.bigIdea && <StatusBadge status="planned" small label="Budżet obywatelski" />}
              </div>
              <div className="text-[18px] font-bold leading-6">{c?.title ?? analysis.title}</div>
              <div className="text-small text-ink-2">
                {analysis.category} · {c?.place ?? draft.place}
              </div>
            </div>
          </div>

          <div className="rounded-card border border-line bg-surface px-4 py-1 animate-fade-up [animation-delay:240ms]">
            <div className="flex gap-3 border-b border-[#eef0f3] py-3">
              <IconBuilding size={22} className="mt-0.5 shrink-0" />
              <div>
                <div className="text-[17px] font-bold leading-6">Odpowiada: {analysis.unitName}</div>
                <div className="text-small text-ink-2">{analysis.unitReason}</div>
              </div>
            </div>
            <div className="flex gap-3 py-3">
              <IconUsers size={22} className="mt-0.5 shrink-0" />
              <div>
                {isIdea ? (
                  <div className="text-[17px] font-bold leading-6">
                    {total} {plural(total, ['osoba prosi', 'osoby proszą', 'osób prosi'])} o to samo
                  </div>
                ) : others > 0 ? (
                  <div className="text-[17px] font-bold leading-6">
                    Połączono z {others} {plural(others, ['podobnym zgłoszeniem', 'podobnymi zgłoszeniami', 'podobnymi zgłoszeniami'])}
                  </div>
                ) : (
                  <div className="text-[17px] font-bold leading-6">Pierwsze zgłoszenie w tym miejscu</div>
                )}
                <div className="text-small text-ink-2">
                  {others > 0 ? 'Jedna sprawa zamiast wielu zgłoszeń. Twój głos ją wzmacnia.' : 'Sąsiedzi zgłaszający to samo dołączą do Twojej sprawy.'}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-line bg-surface px-4 animate-fade-up [animation-delay:320ms]">
            <button type="button" onClick={() => setShowAi((v) => !v)} aria-expanded={showAi} className="flex w-full items-center gap-3 py-3.5 text-left">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
                <IconSparkle size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-bold leading-6">Jak AI to oceniło</span>
                <span className="mt-0.5 flex flex-wrap gap-1">
                  {[...new Set(trace.flatMap((st) => st.tech))].map((id) => (
                    <TechChip key={id} id={id} small />
                  ))}
                </span>
              </span>
              <IconChevron size={20} className={`shrink-0 text-ink-2 transition-transform ${showAi ? 'rotate-90' : ''}`} />
            </button>
            {showAi && (
              <div className="pb-3">
                <TraceList steps={trace} dense />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2.5 bg-canvas px-4 pt-3 pb-[calc(var(--safe-bottom)+12px)]">
        <Button variant="primary" size="lg" className="rounded-full" onClick={onFollow}>
          Śledź sprawę
        </Button>
        {!s.verification && (
          <Button onClick={onVerify} className="rounded-full">
            <IconShield size={20} className="text-st-done" strokeWidth={2.2} /> Zweryfikuj przez mObywatel
          </Button>
        )}
      </div>
    </div>
  )
}
