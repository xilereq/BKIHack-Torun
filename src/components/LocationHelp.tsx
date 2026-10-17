import { Button } from './ui'
import { IconLocate, IconX } from './icons'

export type LocationProblem = 'denied' | 'unavailable' | 'outside'

const TEXT: Record<LocationProblem, { title: string; body: string }> = {
  denied: {
    title: 'Lokalizacja jest wyłączona',
    body: 'Włącz ją, a mapa sama pokaże Twoją okolicę i ustawi miejsce zgłoszenia.',
  },
  unavailable: {
    title: 'Nie udało się ustalić lokalizacji',
    body: 'Sprawdź, czy lokalizacja w telefonie jest włączona, i spróbuj jeszcze raz. Możesz też wpisać adres przy zgłoszeniu.',
  },
  outside: {
    title: 'Jesteś poza Toruniem',
    body: 'Głos Osiedla działa w Toruniu. Przesuń mapę albo wpisz adres przy zgłoszeniu.',
  },
}

/** Arkusz z instrukcją włączenia lokalizacji (przeglądarka nie pozwala zapytać ponownie po odmowie) */
export function LocationHelp({ problem, onRetry, onClose }: { problem: LocationProblem; onRetry: () => void; onClose: () => void }) {
  const t = TEXT[problem]
  return (
    <div className="absolute inset-0 z-40 flex items-end" role="dialog" aria-modal="true" aria-labelledby="loc-help-title">
      <button type="button" aria-label="Zamknij" onClick={onClose} className="absolute inset-0 cursor-default bg-ink/40" />
      <div className="relative w-full rounded-t-[28px] bg-surface px-5 pt-2.5 pb-[calc(var(--safe-bottom)+20px)] shadow-2xl animate-slide-up">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line-strong" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3">
          <h2 id="loc-help-title" className="flex min-w-0 items-center gap-2 text-h2 font-bold">
            <IconLocate size={24} className="shrink-0 text-st-planned" /> {t.title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Zamknij" className="-mt-1 flex size-11 shrink-0 items-center justify-center rounded-btn hover:bg-canvas">
            <IconX size={20} />
          </button>
        </div>
        <p className="mt-2 text-body text-ink-2">{t.body}</p>
        {problem === 'denied' && (
          <ol className="mt-3 flex flex-col gap-2 rounded-card bg-canvas p-4 text-[16px] leading-6">
            <li>
              <b>1.</b> Kliknij ikonę kłódki (albo „i”) obok adresu strony.
            </li>
            <li>
              <b>2.</b> Przy „Lokalizacja” wybierz <b>Zezwalaj</b>.
            </li>
            <li>
              <b>3.</b> Na telefonie sprawdź też: Ustawienia → Lokalizacja → włączona dla przeglądarki.
            </li>
          </ol>
        )}
        <div className="mt-4 flex flex-col gap-2.5">
          <Button variant="primary" size="lg" className="w-full rounded-full" onClick={onRetry}>
            <IconLocate size={22} /> Spróbuj ponownie
          </Button>
          <Button className="w-full rounded-full" onClick={onClose}>
            Nie teraz
          </Button>
        </div>
      </div>
    </div>
  )
}
