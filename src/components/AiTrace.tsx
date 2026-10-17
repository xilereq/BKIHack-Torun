import { useState } from 'react'
import { TECH, type TechId, type TraceStep } from '../lib/aiTrace'
import { IconCheck, IconChevron } from './icons'

export function TechChip({ id, small = false }: { id: TechId; small?: boolean }) {
  return (
    <span
      title={TECH[id].detail}
      className={`inline-flex items-center rounded-[6px] border border-[#d9dde3] bg-[#f3f5f8] font-bold text-[#3f4652] ${small ? 'px-1.5 text-[12px] leading-[18px]' : 'px-2 text-[13px] leading-5'}`}
    >
      {TECH[id].label}
    </span>
  )
}

function Bar({ value }: { value: number }) {
  return (
    <span className="relative block h-1.5 w-full overflow-hidden rounded-full bg-line" aria-hidden="true">
      <span className="absolute inset-y-0 left-0 rounded-full bg-ink" style={{ width: `${Math.max(4, Math.min(100, value * 100))}%` }} />
    </span>
  )
}

/** Pełny ślad analizy: etapy, technologie, wyniki z paskami i fragmenty kodu */
export function TraceList({ steps, dense = false }: { steps: TraceStep[]; dense?: boolean }) {
  const [open, setOpen] = useState<string | null>(null)
  const total = steps.reduce((n, s) => n + s.ms, 0)
  return (
    <div className="flex flex-col">
      <ol className="flex flex-col">
        {steps.map((st, i) => {
          const isOpen = open === st.id
          return (
            <li key={st.id} className={`${i ? 'border-t border-[#eef0f3]' : ''}`}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : st.id)}
                aria-expanded={isOpen}
                className={`flex w-full items-start gap-3 text-left ${dense ? 'py-2.5' : 'py-3'}`}
                disabled={st.skipped}
              >
                <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${st.skipped ? 'bg-canvas text-ink-2' : 'bg-st-done-bg text-st-done'}`}>
                  {st.skipped ? <span className="text-[12px] font-bold">–</span> : <IconCheck size={14} strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[16px] font-bold leading-6">{st.title}</span>
                    {st.tech.map((t) => (
                      <TechChip key={t} id={t} small />
                    ))}
                  </span>
                  <span className="block text-[14px] leading-5 text-ink-2">{st.short}</span>
                </span>
                {!st.skipped && <IconChevron size={18} className={`mt-1 shrink-0 text-ink-2 transition-transform ${isOpen ? 'rotate-90' : ''}`} />}
              </button>
              {isOpen && (
                <div className="mb-3 ml-9 flex flex-col gap-2 rounded-[12px] bg-canvas p-3">
                  {st.lines.map((l) => (
                    <div key={l.label} className="flex flex-col gap-1">
                      <div className="flex items-baseline justify-between gap-3 text-[14px] leading-5">
                        <span className="min-w-0 text-ink">{l.label}</span>
                        <span className="shrink-0 font-bold tabular-nums">{l.value}</span>
                      </div>
                      {l.bar !== undefined && <Bar value={l.bar} />}
                    </div>
                  ))}
                  {st.code && (
                    <pre className="mt-1 overflow-x-auto rounded-[8px] bg-ink px-3 py-2 font-mono text-[12px] leading-[18px] text-[#e6e8eb]">{st.code}</pre>
                  )}
                  <div className="text-[12px] text-ink-2">Czas etapu: {st.ms} ms</div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <div className="mt-1 flex items-center justify-between border-t border-[#eef0f3] pt-2.5 text-[13px] text-ink-2">
        <span>Łączny czas analizy</span>
        <span className="font-bold tabular-nums text-ink">{(total / 1000).toFixed(1)} s</span>
      </div>
    </div>
  )
}
