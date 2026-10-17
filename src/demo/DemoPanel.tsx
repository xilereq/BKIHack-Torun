import { useState } from 'react'
import type { View } from '../App'
import { addCaseEvent, demoTargetCaseId, resetDemo, setVerified, useDemo, type DemoEventKind } from '../lib/store'
import { caseStatus, STATUS_LABEL } from '../lib/domain'
import { sendDemoCommand } from '../lib/hooks'
import { IconX } from '../components/icons'

const EVENTS: { kind: DemoEventKind; label: string }[] = [
  { kind: 'interpellation', label: 'Radny złożył interpelację' },
  { kind: 'response', label: 'Odpowiedź urzędu' },
  { kind: 'planned', label: 'Remont zaplanowany' },
  { kind: 'done', label: 'Remont wykonany' },
]

/** Ukryty panel dla zespołu (Ctrl+Shift+D). Widz go nie widzi. */
export function DemoPanel({ view, onSwitchView, onClose }: { view: View; onSwitchView: (v: View) => void; onClose: () => void }) {
  const s = useDemo()
  const [confirmReset, setConfirmReset] = useState(false)
  const [flash, setFlash] = useState('')
  const targetId = demoTargetCaseId(s)
  const target = s.cases.find((c) => c.id === targetId)

  const say = (msg: string) => {
    setFlash(msg)
    window.setTimeout(() => setFlash(''), 1800)
  }

  const btn = 'min-h-10 rounded-[10px] border border-white/25 px-3 text-left text-[15px] font-bold text-white hover:bg-white/10'
  const btnOn = 'min-h-10 rounded-[10px] bg-white px-3 text-[15px] font-bold text-ink'

  return (
    <div className="fixed bottom-4 left-4 z-[100] w-[340px] rounded-[16px] bg-ink p-4 text-white shadow-2xl animate-fade-up" role="dialog" aria-label="Panel demo">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[16px] font-bold">Panel demo</div>
          <div className="text-[13px] text-white/60">Ctrl+Shift+D lub Esc zamyka</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Zamknij panel demo" className="flex size-10 items-center justify-center rounded-[10px] hover:bg-white/10">
          <IconX size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={view === 'resident' ? btnOn : btn} onClick={() => onSwitchView('resident')}>
            Mieszkaniec
          </button>
          <button type="button" className={view === 'council' ? btnOn : btn} onClick={() => onSwitchView('council')}>
            Radny
          </button>
        </div>

        <div>
          <div className="mb-1.5 text-[13px] font-bold tracking-wide text-white/60 uppercase">Szybki start zgłoszenia</div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              className={btn}
              onClick={() => {
                onSwitchView('resident')
                window.setTimeout(() => sendDemoCommand({ type: 'prefill', scenario: 'pothole' }), 50)
              }}
            >
              Dziura
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => {
                onSwitchView('resident')
                window.setTimeout(() => sendDemoCommand({ type: 'prefill', scenario: 'bench' }), 50)
              }}
            >
              Ławka
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => {
                onSwitchView('resident')
                window.setTimeout(() => sendDemoCommand({ type: 'prefill', scenario: 'violation' }), 50)
              }}
            >
              Z błędem
            </button>
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-[13px] font-bold tracking-wide text-white/60 uppercase">Zdarzenia w sprawie</div>
          <div className="mb-2 rounded-[10px] bg-white/10 px-3 py-2 text-[14px] leading-5">
            <b>{target?.title}</b>
            <div className="text-white/70">
              {target?.place} · {target ? STATUS_LABEL[caseStatus(target, s.documents)] : ''}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {EVENTS.map((e, i) => (
              <button
                key={e.kind}
                type="button"
                className={btn}
                onClick={() => {
                  addCaseEvent(e.kind, targetId)
                  say(`Dodano: ${e.label}`)
                }}
              >
                {i + 1}. {e.label}
              </button>
            ))}
            <button
              type="button"
              className={btn}
              onClick={() => {
                onSwitchView('resident')
                window.setTimeout(() => sendDemoCommand({ type: 'open-case', caseId: targetId }), 50)
              }}
            >
              Pokaż tę sprawę u mieszkańca
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={btn}
            disabled={!!s.verification}
            onClick={() => {
              setVerified({ pseudonym: 'demo', torun: true, verifiedAt: new Date().toISOString() })
              say('Mieszkaniec zweryfikowany')
            }}
          >
            {s.verification ? 'Zweryfikowany ✓' : 'Zweryfikuj od razu'}
          </button>
          <button
            type="button"
            className={confirmReset ? 'min-h-10 rounded-[10px] bg-brand px-3 text-[15px] font-bold text-white' : btn}
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true)
                window.setTimeout(() => setConfirmReset(false), 3000)
                return
              }
              resetDemo()
              setConfirmReset(false)
              sendDemoCommand({ type: 'home' })
              say('Demo zresetowane')
            }}
          >
            {confirmReset ? 'Na pewno? Kliknij' : 'Reset demo'}
          </button>
        </div>
        {flash && (
          <div className="rounded-[10px] bg-white/15 px-3 py-2 text-[14px] font-bold" role="status">
            {flash}
          </div>
        )}
      </div>
    </div>
  )
}
