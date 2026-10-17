import { useEffect, useRef, useState } from 'react'
import { analyzeReport, type Analysis } from '../lib/ai'
import { reportTrace, type TraceStep } from '../lib/aiTrace'
import { getState } from '../lib/store'
import { IconCheck, IconSparkle } from '../components/icons'
import { Spinner } from '../components/ui'
import { TechChip } from '../components/AiTrace'
import type { ReportDraft } from './ReportScreen'

const STEP_MS = 640

export function AnalyzingScreen({ draft, onDone }: { draft: ReportDraft; onDone: (a: Analysis, trace: TraceStep[]) => void }) {
  const [step, setStep] = useState(0)
  const [steps, setSteps] = useState<TraceStep[]>([])
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const s = getState()
    const analysis = analyzeReport(draft.description, draft.location, s)
    const trace = reportTrace({ description: draft.description, photo: draft.photo, usedMic: draft.usedMic, place: draft.place }, analysis, s)
    setSteps(trace)
    const timers: number[] = []
    trace.forEach((_, i) => timers.push(window.setTimeout(() => setStep(i + 1), STEP_MS * (i + 1))))
    timers.push(window.setTimeout(() => doneRef.current(analysis, trace), STEP_MS * trace.length + 500))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [draft])

  const hasPhoto = !draft.photo.endsWith('zastepcze.svg')

  return (
    <div className="flex h-full flex-col bg-surface pt-[var(--safe-top)]" role="status" aria-live="polite">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-6 pb-6">
        <div className="flex items-center gap-4">
          {hasPhoto ? (
            <div className="relative shrink-0">
              <img src={draft.photo} alt="" className="size-20 rounded-[18px] border border-line object-cover" />
              <span className="absolute -right-2 -bottom-2 flex size-9 items-center justify-center rounded-full border-[3px] border-white bg-brand text-white">
                <IconSparkle size={18} strokeWidth={2} className="animate-pulse" />
              </span>
            </div>
          ) : (
            <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
              <IconSparkle size={36} strokeWidth={1.8} className="animate-pulse" />
            </span>
          )}
          <div>
            <h1 className="text-[24px] font-bold leading-[30px]">AI analizuje zgłoszenie…</h1>
            <p className="text-[15px] leading-[22px] text-ink-2">Każdy krok możesz potem sprawdzić.</p>
          </div>
        </div>

        <ol className="flex flex-col gap-2">
          {steps.map((st, i) => {
            const done = step > i
            const active = step === i
            return (
              <li
                key={st.id}
                className={`flex gap-3 rounded-[16px] border px-3.5 py-3 transition-colors ${active ? 'border-ink bg-surface' : done ? 'border-line bg-surface' : 'border-transparent bg-canvas opacity-60'}`}
              >
                <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${done ? 'bg-st-done-bg text-st-done' : 'bg-canvas'}`}>
                  {done ? <IconCheck size={16} strokeWidth={3} /> : active ? <Spinner size={16} /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[16px] font-bold leading-6">{st.title}</span>
                    {st.tech.map((t) => (
                      <TechChip key={t} id={t} small />
                    ))}
                  </div>
                  <div className={`text-[14px] leading-5 ${done ? 'text-ink' : 'text-ink-2'}`}>{done ? st.short : active ? 'Przetwarzanie…' : 'W kolejce'}</div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
