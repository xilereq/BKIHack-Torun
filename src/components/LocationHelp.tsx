import { Button } from './ui'
import { IconLocate } from './icons'

export type LocationProblem = 'denied' | 'unavailable' | 'outside'

/** Krótki komunikat, gdy lokalizacja nie działa. „Spróbuj ponownie” od razu pyta o lokalizację jeszcze raz. */
export function LocationHelp({ problem, onRetry, onClose }: { problem: LocationProblem; onRetry: () => void; onClose: () => void }) {
  const outside = problem === 'outside'
  return (
    <div className="absolute inset-0 z-40 flex items-end" role="dialog" aria-modal="true" aria-labelledby="loc-help-title">
      <button type="button" aria-label="Zamknij" onClick={onClose} className="absolute inset-0 cursor-default bg-ink/40" />
      <div className="relative flex w-full flex-col items-center gap-3 rounded-t-[28px] bg-surface px-5 pt-2.5 pb-[calc(var(--safe-bottom)+20px)] text-center shadow-2xl animate-slide-up">
        <div className="mb-1 h-1.5 w-10 rounded-full bg-line-strong" aria-hidden="true" />
        <span className="flex size-14 items-center justify-center rounded-full bg-st-planned-bg text-st-planned">
          <IconLocate size={28} />
        </span>
        <h2 id="loc-help-title" className="text-h2 font-bold">
          {outside ? 'Jesteś poza Toruniem' : 'Włącz lokalizację w telefonie'}
        </h2>
        <p className="text-body text-ink-2">
          {outside ? 'Przesuń mapę na swoją okolicę w Toruniu.' : 'Włącz lokalizację w ustawieniach telefonu i spróbuj ponownie.'}
        </p>
        <div className="mt-1 flex w-full flex-col gap-2.5">
          {!outside && (
            <Button variant="primary" size="lg" className="w-full rounded-full" onClick={onRetry}>
              Spróbuj ponownie
            </Button>
          )}
          <Button className="w-full rounded-full" onClick={onClose}>
            {outside ? 'Rozumiem' : 'Nie teraz'}
          </Button>
        </div>
      </div>
    </div>
  )
}
