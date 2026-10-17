import { TECH, type TechId, type TraceStep } from '../lib/aiTrace'
import { IconCheck } from './icons'

export function TechChip({ id, small = false }: { id: TechId; small?: boolean }) {
  return (
    <span
      title={TECH[id].detail}
      className={`inline-flex items-center whitespace-nowrap rounded-[6px] border border-[#d9dde3] bg-[#f3f5f8] font-bold text-[#3f4652] ${small ? 'px-1.5 text-[12px] leading-[18px]' : 'px-2 text-[13px] leading-5'}`}
    >
      {TECH[id].label}
    </span>
  )
}

/**
 * Ślad analizy dla mieszkańca: każdy etap prostym zdaniem.
 * Bez procentów, zapytań i punktów — szczegóły techniczne są w panelu radnego i w oknie „Jak działa AI”.
 */
export function TraceList({ steps }: { steps: TraceStep[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((st, i) => (
        <li key={st.id} className={`flex items-start gap-3 py-3 ${i ? 'border-t border-[#eef0f3]' : ''}`}>
          <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${st.skipped ? 'bg-canvas text-ink-2' : 'bg-st-done-bg text-st-done'}`}>
            {st.skipped ? <span className="text-[12px] font-bold">–</span> : <IconCheck size={14} strokeWidth={3} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <span className="text-[16px] font-bold leading-6">{st.title}</span>
              {st.tech.map((t) => (
                <TechChip key={t} id={t} small />
              ))}
            </div>
            <p className="mt-0.5 text-[15px] leading-[22px] text-ink [overflow-wrap:anywhere]">{st.short}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
