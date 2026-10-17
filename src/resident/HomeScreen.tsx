import { useMemo, useState } from 'react'
import { useDemo } from '../lib/store'
import { MapView } from '../components/MapView'
import { Button, Logo, StatusBadge, TypeBadge, VerifiedBadge } from '../components/ui'
import { IconBell, IconCamera, IconChevron, IconX } from '../components/icons'
import { caseMarkers, cityKnowledge } from '../components/shared'
import { caseReports, caseStatus } from '../lib/domain'
import { countLabel, REPORT_FORMS } from '../lib/format'
import { RUBINKOWO_CENTER } from '../lib/geo'

export function HomeScreen({ onReport, onMyCases, onOpenCase }: { onReport: () => void; onMyCases: () => void; onOpenCase: (id: string) => void }) {
  const s = useDemo()
  const [selected, setSelected] = useState<string | null>(null)
  const markers = useMemo(() => caseMarkers(s, { selectedId: selected }), [s, selected])
  const unread = s.notifications.filter((n) => !n.read).length
  const myCount = new Set(s.reports.filter((r) => r.mine).map((r) => r.caseId)).size
  const openCount = s.cases.filter((c) => caseStatus(c, s.documents) !== 'resolved').length
  const sel = selected ? s.cases.find((c) => c.id === selected) : null

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <div className="text-[20px] font-bold leading-6">Głos Osiedla</div>
            <div className="text-small text-ink-2">Rubinkowo, Toruń</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onMyCases}
          aria-label={unread ? `Powiadomienia: ${unread} nowe` : 'Powiadomienia'}
          className="relative flex size-12 items-center justify-center rounded-btn border border-line bg-surface hover:bg-canvas"
        >
          <IconBell size={24} />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex min-w-6 items-center justify-center rounded-full border-2 border-white bg-brand px-1 text-[13px] font-bold leading-5 text-white animate-pop">
              {unread}
            </span>
          )}
        </button>
      </header>

      <div className="relative min-h-0 flex-1">
        <MapView
          center={RUBINKOWO_CENTER}
          zoom={14.6}
          fitPoints={s.cases.map((c) => c.location)}
          fitPadding={{ top: 64, bottom: 48, left: 28, right: 28 }}
          markers={markers}
          onMarkerClick={setSelected}
          ariaLabel="Mapa zgłoszeń na Rubinkowie"
        />
        <div className="pointer-events-none absolute top-3 left-3 flex flex-col items-start gap-2">
          <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[15px] font-bold shadow-sm">
            {openCount} {openCount === 1 ? 'otwarta sprawa' : 'otwartych spraw'} w okolicy
          </div>
          {s.verification && <VerifiedBadge small />}
        </div>
        {sel && (
          <div className="absolute inset-x-3 bottom-8 z-10 rounded-card border border-line bg-surface p-4 shadow-lg animate-fade-up">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                <TypeBadge type={sel.type} small />
                <StatusBadge status={caseStatus(sel, s.documents)} small />
              </div>
              <button type="button" aria-label="Zamknij podgląd" onClick={() => setSelected(null)} className="-mt-2 -mr-2 flex size-11 items-center justify-center rounded-btn hover:bg-canvas">
                <IconX size={20} />
              </button>
            </div>
            <div className="mt-1.5 text-[18px] font-bold leading-6">{sel.title}</div>
            <div className="text-small text-ink-2">
              {sel.place} · {countLabel(caseReports(sel, s.reports).length, REPORT_FORMS)}
            </div>
            <p className="mt-2 line-clamp-2 text-[16px] leading-6">{cityKnowledge(sel, s).text}</p>
            <button type="button" onClick={() => onOpenCase(sel.id)} className="mt-1 inline-flex min-h-11 items-center gap-1 font-bold text-brand hover:underline">
              Zobacz sprawę <IconChevron size={18} strokeWidth={2.4} />
            </button>
          </div>
        )}
      </div>

      <div className="relative z-10 -mt-6 flex shrink-0 flex-col gap-3 rounded-t-[24px] border-t border-line bg-surface px-5 pt-6 pb-6">
        <h2 className="text-[26px] font-bold leading-8 tracking-[-0.01em]">Coś jest nie tak albo czegoś brakuje?</h2>
        <p className="text-body text-ink-2">Zrób zdjęcie i powiedz jedno zdanie. Bez zakładania konta.</p>
        <Button variant="primary" size="lg" onClick={onReport} className="mt-1">
          <IconCamera size={26} strokeWidth={2.2} />
          Zgłoś
        </Button>
        <Button onClick={onMyCases} className="min-h-14 rounded-[16px] text-[19px]">
          Moje sprawy
          {myCount > 0 && (
            <span className={`inline-flex min-w-7 items-center justify-center rounded-full px-2 text-[15px] leading-7 ${unread ? 'bg-brand text-white' : 'bg-brand-tint text-st-overdue'}`}>
              {unread || myCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
