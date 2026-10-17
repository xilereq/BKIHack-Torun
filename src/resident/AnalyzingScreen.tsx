import { useEffect, useRef, useState } from 'react'
import { analyzeReport, type Analysis } from '../lib/ai'
import { getState } from '../lib/store'
import { IconCheck, IconSparkle } from '../components/icons'
import { Spinner } from '../components/ui'
import type { ReportDraft } from './ReportScreen'

const STEPS = ['Rozpoznaję zdjęcie', 'Rozumiem opis', 'Szukam podobnych zgłoszeń w okolicy', 'Sprawdzam dokumenty i plany miasta', 'Ustalam, kto za to odpowiada']
const STEP_MS = 620

export function AnalyzingScreen({ draft, onDone }: { draft: ReportDraft; onDone: (a: Analysis) => void }) {
  const [step, setStep] = useState(0)
  const analysisRef = useRef<Analysis | null>(null)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    analysisRef.current = analyzeReport(draft.description, draft.location, getState())
    const timers: number[] = []
    STEPS.forEach((_, i) => timers.push(window.setTimeout(() => setStep(i + 1), STEP_MS * (i + 1))))
    timers.push(window.setTimeout(() => analysisRef.current && doneRef.current(analysisRef.current), STEP_MS * STEPS.length + 450))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [draft])

  return (
    <div className="flex h-full flex-col bg-surface" role="status" aria-live="polite">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
        <div className="relative">
          <img src={draft.photo} alt="" className="size-36 rounded-[24px] border border-line object-cover" />
          <span className="absolute -right-3 -bottom-3 flex size-14 items-center justify-center rounded-full border-4 border-white bg-brand text-white">
            <IconSparkle size={26} strokeWidth={2} className="animate-pulse" />
          </span>
        </div>
        <div className="text-center">
          <h1 className="text-h1 font-bold">AI analizuje Twoje zgłoszenie…</h1>
          <p className="mt-1 text-body text-ink-2">To potrwa tylko chwilę.</p>
        </div>
        <ol className="flex w-full flex-col gap-3">
          {STEPS.map((label, i) => {
            const done = step > i
            const active = step === i
            return (
              <li key={label} className={`flex items-center gap-3 text-[18px] transition-opacity ${done || active ? 'opacity-100' : 'opacity-45'}`}>
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${done ? 'bg-st-done-bg text-st-done' : 'bg-canvas'}`}>
                  {done ? <IconCheck size={18} strokeWidth={2.8} className="animate-pop" /> : active ? <Spinner size={18} /> : null}
                </span>
                <span className={done ? 'font-bold' : ''}>{label}</span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
