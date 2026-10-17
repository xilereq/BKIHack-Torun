import { useDemo } from '../lib/store'
import { caseStatus } from '../lib/domain'
import { relativeDate } from '../lib/format'
import { Button, StatusBadge, VerifiedBadge } from '../components/ui'
import { IconChevron, IconShield } from '../components/icons'
import { Photo } from '../components/shared'

export function MyCasesScreen({ onOpen, onVerify, onReport }: { onOpen: (id: string) => void; onVerify: () => void; onReport: () => void }) {
  const s = useDemo()
  const myCaseIds = [...new Set(s.reports.filter((r) => r.mine).map((r) => r.caseId))]
  const cases = myCaseIds
    .map((id) => s.cases.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .sort((a, b) => (b.events[b.events.length - 1]?.date ?? '').localeCompare(a.events[a.events.length - 1]?.date ?? ''))

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 px-4 pt-4 pb-6">
          <h1 className="px-1 pt-2 text-[32px] font-bold leading-10 tracking-[-0.01em]">Moje sprawy</h1>
          {s.verification ? (
            <div className="flex flex-wrap items-center gap-2">
              <VerifiedBadge />
              <span className="text-small text-ink-2">Radni widzą znaczek przy Twoich zgłoszeniach.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4">
              <div className="flex items-center gap-2 text-[17px] font-bold">
                <IconShield size={22} className="text-st-done" strokeWidth={2.2} />
                Wzmocnij swoje zgłoszenia
              </div>
              <p className="text-[16px] leading-6 text-ink-2">Potwierdź raz przez mObywatel, że mieszkasz w Toruniu. Nie zapisujemy imienia, nazwiska ani PESEL.</p>
              <Button onClick={onVerify} size="sm" className="self-start">
                Zweryfikuj przez mObywatel
              </Button>
            </div>
          )}

          {cases.length === 0 && (
            <div className="rounded-card border border-line bg-surface p-5 text-center">
              <div className="text-[18px] font-bold">Zgłoś pierwszą sprawę</div>
              <p className="mt-1 text-ink-2">Tutaj zobaczysz, co dzieje się z Twoimi zgłoszeniami.</p>
              <Button variant="primary" className="mt-3" onClick={onReport}>
                Zgłoś
              </Button>
            </div>
          )}

          {cases.map((c) => {
            const last = c.events[c.events.length - 1]
            const unread = s.notifications.filter((n) => n.caseId === c.id && !n.read).length
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onOpen(c.id)}
                className={`flex items-center gap-3 rounded-[20px] bg-surface p-3 text-left hover:bg-canvas ${unread ? 'border-2 border-brand' : 'border border-line'}`}
              >
                <Photo src={c.photo} alt="" className="size-16 shrink-0 rounded-[12px]" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={caseStatus(c, s.documents)} small />
                    {unread > 0 && <span className="rounded-full bg-brand px-2 text-[13px] font-bold leading-5 text-white">Nowe</span>}
                  </div>
                  <div className="truncate text-[17px] font-bold leading-6">{c.title}</div>
                  <div className="truncate text-[15px] leading-5 text-ink-2">
                    {last?.title} · {relativeDate(last?.date ?? c.createdAt)}
                  </div>
                </div>
                <IconChevron size={20} className="shrink-0 text-ink-2" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
