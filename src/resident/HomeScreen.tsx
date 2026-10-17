import { useMemo, useState } from 'react'
import { useDemo } from '../lib/store'
import { MapView } from '../components/MapView'
import { Logo, StatusBadge, TypeBadge } from '../components/ui'
import { IconBell, IconChevron, IconShield, IconX } from '../components/icons'
import { Carousel } from '../components/Carousel'
import { caseMarkers, caseSlides, cityKnowledge } from '../components/shared'
import { caseReports, caseStatus } from '../lib/domain'
import { countLabel, plural, REPORT_FORMS } from '../lib/format'
import { RUBINKOWO_CENTER } from '../lib/geo'

export function HomeScreen({ onNotifications, onOpenCase }: { onNotifications: () => void; onOpenCase: (id: string) => void }) {
  const s = useDemo()
  const [selected, setSelected] = useState<string | null>(null)
  const markers = useMemo(() => caseMarkers(s, { selectedId: selected }), [s, selected])
  const unread = s.notifications.filter((n) => !n.read).length
  const openCount = s.cases.filter((c) => caseStatus(c, s.documents) !== 'resolved').length
  const sel = selected ? s.cases.find((c) => c.id === selected) : null

  return (
    <div className="relative h-full">
      <MapView
        center={RUBINKOWO_CENTER}
        zoom={14.6}
        fitPoints={s.cases.map((c) => c.location)}
        fitPadding={{ top: 130, bottom: 40, left: 30, right: 30 }}
        markers={markers}
        onMarkerClick={setSelected}
        ariaLabel="Mapa zgłoszeń na Rubinkowie"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2 px-3 pt-3">
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full bg-surface/95 py-1.5 pr-4 pl-1.5 shadow-[0_2px_12px_rgba(22,25,29,0.14)] backdrop-blur">
            <Logo size={36} />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[17px] font-bold">Głos Osiedla</div>
              <div className="truncate text-[13px] text-ink-2">Rubinkowo, Toruń</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onNotifications}
            aria-label={unread ? `Powiadomienia: ${unread} nowe` : 'Powiadomienia'}
            className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-surface/95 shadow-[0_2px_12px_rgba(22,25,29,0.14)] backdrop-blur"
          >
            <IconBell size={24} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex min-w-6 items-center justify-center rounded-full border-2 border-white bg-brand px-1 text-[13px] font-bold leading-5 text-white">
                {unread}
              </span>
            )}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full bg-surface/95 px-3.5 py-1.5 text-[14px] font-bold shadow-[0_2px_8px_rgba(22,25,29,0.12)]">
            {openCount} {plural(openCount, ['otwarta sprawa', 'otwarte sprawy', 'otwartych spraw'])} w okolicy
          </div>
          {s.verification && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-surface/95 px-3 py-1.5 text-[14px] font-bold shadow-[0_2px_8px_rgba(22,25,29,0.12)]">
              <IconShield size={16} className="text-st-done" strokeWidth={2.2} /> Zweryfikowany
            </div>
          )}
        </div>
      </div>

      {sel && (
        <div className="absolute inset-x-3 bottom-3 z-10 overflow-hidden rounded-[22px] bg-surface shadow-[0_8px_28px_rgba(22,25,29,0.22)] animate-slide-up">
          <div className="relative">
            <Carousel slides={caseSlides(sel, s)} height={120} />
            <button
              type="button"
              aria-label="Zamknij podgląd"
              onClick={() => setSelected(null)}
              className="absolute top-2 left-2 flex size-9 items-center justify-center rounded-full bg-surface/95 shadow"
            >
              <IconX size={18} strokeWidth={2.4} />
            </button>
          </div>
          <button type="button" onClick={() => onOpenCase(sel.id)} className="flex w-full items-center gap-2 px-4 pt-3 pb-3.5 text-left hover:bg-canvas">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1.5">
                <TypeBadge type={sel.type} small />
                <StatusBadge status={caseStatus(sel, s.documents)} small />
              </div>
              <div className="mt-1 text-[18px] font-bold leading-6">{sel.title}</div>
              <div className="truncate text-[14px] leading-5 text-ink-2">
                {sel.place} · {countLabel(caseReports(sel, s.reports).length, REPORT_FORMS)}
                {sel.supporters ? ` · ${sel.supporters} ${plural(sel.supporters, ['podbicie', 'podbicia', 'podbić'])}` : ''}
              </div>
              <p className="mt-1 line-clamp-2 text-[15px] leading-[22px] text-ink">{cityKnowledge(sel, s).text}</p>
            </div>
            <IconChevron size={22} className="shrink-0 text-ink-2" />
          </button>
        </div>
      )}
    </div>
  )
}
