import type { ReactNode } from 'react'
import { IconBack } from '../components/icons'

export function ScreenHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="flex shrink-0 items-center gap-2 border-b border-line bg-surface px-3 py-3">
      {onBack && (
        <button type="button" onClick={onBack} aria-label="Wróć" className="flex size-12 items-center justify-center rounded-btn hover:bg-canvas">
          <IconBack size={24} strokeWidth={2.2} />
        </button>
      )}
      <h1 className={`min-w-0 flex-1 truncate text-[20px] font-bold leading-7 ${onBack ? '' : 'pl-2'}`}>{title}</h1>
      {right}
    </header>
  )
}
