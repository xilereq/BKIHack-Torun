import { useEffect, useMemo, useState } from 'react'
import { setVerified } from '../lib/store'
import { toVerification, verificationProvider } from '../lib/verification'
import { Button, Spinner, VerifiedBadge } from '../components/ui'
import { IconCheckCircle, IconShield, IconX } from '../components/icons'

/** Symulowany kod QR: deterministyczny wzór z ciągu znaków */
function FakeQr({ payload }: { payload: string }) {
  const N = 25
  const cells = useMemo(() => {
    let seed = 0
    for (const ch of payload) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 2 ** 32
    }
    const out: boolean[] = []
    for (let i = 0; i < N * N; i++) out.push(rnd() > 0.52)
    return out
  }, [payload])
  const finder = (x: number, y: number) => {
    const inF = (fx: number, fy: number) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7
    for (const [fx, fy] of [
      [0, 0],
      [N - 7, 0],
      [0, N - 7],
    ]) {
      if (inF(fx, fy)) {
        const dx = x - fx
        const dy = y - fy
        return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0
      }
    }
    return -1
  }
  return (
    <svg viewBox={`-2 -2 ${N + 4} ${N + 4}`} className="size-52" role="img" aria-label="Kod QR do zeskanowania w aplikacji mObywatel">
      <rect x="-2" y="-2" width={N + 4} height={N + 4} fill="#fff" />
      {cells.map((on, i) => {
        const x = i % N
        const y = Math.floor(i / N)
        const f = finder(x, y)
        const fill = f === -1 ? on : f === 1
        return fill ? <rect key={i} x={x} y={y} width="1.02" height="1.02" fill="#16191d" /> : null
      })}
    </svg>
  )
}

type Step = 'intro' | 'qr' | 'done'

export function VerifyModal({ onClose, reason }: { onClose: () => void; reason?: string }) {
  const [step, setStep] = useState<Step>('intro')
  const payload = useMemo(() => verificationProvider.qrPayload(), [])

  useEffect(() => {
    if (step !== 'qr') return
    let cancelled = false
    verificationProvider.verify().then(async (res) => {
      const v = await toVerification(res) // tylko pseudonim i flagi, dane osobowe od razu odrzucone
      if (cancelled) return
      setVerified(v)
      setStep('done')
    })
    return () => {
      cancelled = true
    }
  }, [step])

  return (
    <div className="absolute inset-0 z-40 flex items-end bg-ink/45 " role="dialog" aria-modal="true" aria-labelledby="verify-title">
      <div className="w-full rounded-t-[28px] bg-surface px-5 pt-2.5 pb-7 animate-slide-up">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line-strong" aria-hidden="true" />
        <div className="mb-3 flex items-center justify-between">
          <h2 id="verify-title" className="flex items-center gap-2 text-h2 font-bold">
            <IconShield size={26} className="text-st-done" strokeWidth={2.2} />
            Weryfikacja mObywatel
          </h2>
          <button type="button" onClick={onClose} aria-label="Zamknij" className="flex size-12 items-center justify-center rounded-btn hover:bg-canvas">
            <IconX size={22} />
          </button>
        </div>

        {step === 'intro' && (
          <div className="flex flex-col gap-4">
            {reason && <p className="rounded-btn bg-st-planned-bg px-3.5 py-2.5 text-[16px] font-bold leading-6 text-st-planned">{reason}</p>}
            <p className="text-body">Potwierdź raz, że mieszkasz w Toruniu. Twoje zgłoszenia dostaną znaczek, a radni będą wiedzieć, że piszą prawdziwi mieszkańcy.</p>
            <ul className="flex flex-col gap-2 text-[16px] leading-6 text-ink-2">
              <li>• Zapisujemy tylko: „zweryfikowany” i „mieszka w Toruniu”.</li>
              <li>• Imię, nazwisko, PESEL i adres usuwamy od razu.</li>
              <li>• Zgłaszać możesz dalej bez weryfikacji.</li>
            </ul>
            <Button variant="primary" size="lg" onClick={() => setStep('qr')}>
              Pokaż kod QR
            </Button>
          </div>
        )}

        {step === 'qr' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-card border border-line p-3">
              <FakeQr payload={payload} />
            </div>
            <p className="text-body">Zeskanuj kod w aplikacji mObywatel i potwierdź udostępnienie danych.</p>
            <div className="flex items-center gap-2.5 text-[16px] text-ink-2" role="status">
              <Spinner size={18} /> Czekam na potwierdzenie…
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-4 text-center animate-pop">
            <IconCheckCircle size={56} className="text-st-done" strokeWidth={2} />
            <div className="text-h2 font-bold">Zweryfikowano</div>
            <VerifiedBadge />
            <p className="text-[16px] leading-6 text-ink-2">Znaczek pojawi się przy wszystkich Twoich zgłoszeniach w panelu radnych.</p>
            <Button variant="primary" size="lg" className="w-full" onClick={onClose}>
              Gotowe
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
