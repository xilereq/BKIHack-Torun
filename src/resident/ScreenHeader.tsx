import type { ReactNode } from 'react'
import { IconBack } from '../components/icons'

/** Pasek nawigacji jak w aplikacji mobilnej: wstecz po lewej, tytuł na środku */
export function ScreenHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="relative flex h-[calc(56px+var(--safe-top))] shrink-0 items-end justify-between border-b border-line/70 bg-surface/95 px-1.5 pb-1 backdrop-blur">
      <div className="z-[1] flex w-24 items-center">
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Wróć" className="flex h-12 items-center gap-0.5 rounded-btn pr-2 pl-1 text-brand hover:bg-canvas">
            <IconBack size={26} strokeWidth={2.4} />
            <span className="text-[17px] font-bold">Wróć</span>
          </button>
        )}
      </div>
      <h1 className="pointer-events-none absolute inset-x-24 bottom-0 flex h-[52px] items-center justify-center truncate text-center text-[18px] font-bold">{title}</h1>
      <div className="z-[1] flex w-24 justify-end">{right}</div>
    </header>
  )
}
