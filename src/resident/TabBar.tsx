import { IconCamera, IconList, IconPin } from '../components/icons'

/** Dolny pasek aplikacji: Mapa · [aparat] · Moje sprawy */
export function TabBar({
  active,
  unread,
  onMap,
  onCases,
  onCapture,
}: {
  active: 'map' | 'cases'
  unread: number
  onMap: () => void
  onCases: () => void
  onCapture: () => void
}) {
  const tab = (on: boolean) => `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[13px] font-bold ${on ? 'text-brand' : 'text-ink-2'}`
  return (
    <nav className="relative z-20 flex shrink-0 items-end border-t border-line/70 bg-surface/95 px-4 pb-1 backdrop-blur" aria-label="Nawigacja">
      <button type="button" onClick={onMap} className={tab(active === 'map')} aria-current={active === 'map' ? 'page' : undefined}>
        <IconPin size={26} strokeWidth={active === 'map' ? 2.4 : 2} />
        Mapa
      </button>
      <div className="flex w-24 justify-center">
        <button
          type="button"
          onClick={onCapture}
          aria-label="Zgłoś: zrób zdjęcie"
          className="-mt-7 mb-1 flex size-[68px] items-center justify-center rounded-full border-4 border-surface bg-brand text-white shadow-[0_6px_16px_rgba(200,16,46,0.35)] transition-transform hover:bg-brand-dark active:scale-95"
        >
          <IconCamera size={30} strokeWidth={2.2} />
        </button>
      </div>
      <button type="button" onClick={onCases} className={tab(active === 'cases')} aria-current={active === 'cases' ? 'page' : undefined}>
        <span className="relative">
          <IconList size={26} strokeWidth={active === 'cases' ? 2.4 : 2} />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-3 flex min-w-5 items-center justify-center rounded-full border-2 border-surface bg-brand px-1 text-[12px] leading-4 text-white">
              {unread}
            </span>
          )}
        </span>
        Moje sprawy
      </button>
    </nav>
  )
}
