import { useEffect, useRef, useState } from 'react'
import { answerResolved, boostCase, markNotificationsRead, useDemo, type ResolveResult } from '../lib/store'
import { caseReports, unitById } from '../lib/domain'
import { countLabel, plural, REPORT_FORMS } from '../lib/format'
import { Button, StatusBadge, TypeBadge } from '../components/ui'
import { IconArrowUp, IconBuilding, IconCheck, IconCheckCircle, IconRefresh, IconShield, IconUsers, IconWrench } from '../components/icons'
import { Carousel } from '../components/Carousel'
import { caseSlides, cityKnowledge, DocLink, Timeline } from '../components/shared'
import { ScreenHeader } from './ScreenHeader'

export function CaseScreen({
  caseId,
  onBack,
  onOpenCase,
  onRequestVerify,
}: {
  caseId: string
  onBack: () => void
  onOpenCase: (id: string) => void
  onRequestVerify: () => void
}) {
  const s = useDemo()
  const c = s.cases.find((x) => x.id === caseId)
  const [answer, setAnswer] = useState<{ solved: boolean; result: ResolveResult } | null>(null)
  const hasUnread = s.notifications.some((n) => n.caseId === caseId && !n.read)

  useEffect(() => {
    if (hasUnread) {
      const t = window.setTimeout(() => markNotificationsRead(caseId), 1500)
      return () => window.clearTimeout(t)
    }
  }, [hasUnread, caseId])

  // nowe zdarzenie w otwartej sprawie: pokaż je (po remoncie — pytanie na górze, inaczej oś zdarzeń)
  const scrollRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLHeadingElement>(null)
  const eventCount = c?.events.length ?? 0
  const lastType = c?.events[eventCount - 1]?.type
  const prevCount = useRef(eventCount)
  useEffect(() => {
    if (eventCount > prevCount.current) {
      if (lastType === 'done' || lastType === 'reopened' || lastType === 'resolved') scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      else timelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    prevCount.current = eventCount
  }, [eventCount, lastType])

  if (!c) {
    return (
      <div className="flex h-full flex-col">
        <ScreenHeader title="Sprawa" onBack={onBack} />
        <div className="p-6 text-ink-2">Ta sprawa została zamknięta lub połączona z inną.</div>
      </div>
    )
  }

  const knowledge = cityKnowledge(c, s)
  const n = caseReports(c, s.reports).length
  const mine = s.reports.some((r) => r.caseId === c.id && r.mine)
  const unit = unitById(c.unitId)
  const lastEvent = c.events[c.events.length - 1]
  const lastKeyType = [...c.events].reverse().find((e) => e.type === 'done' || e.type === 'resolved' || e.type === 'reopened')?.type
  const askResolved = mine && lastKeyType === 'done' && !answer
  const linked = c.linkedCaseId ? s.cases.find((x) => x.id === c.linkedCaseId) : null

  const supporters = c.supporters ?? 0
  const boosted = s.boosts.includes(c.id)
  const respond = (solved: boolean) => setAnswer({ solved, result: answerResolved(c.id, solved) })

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={mine ? 'Twoja sprawa' : 'Sprawa w okolicy'} onBack={onBack} />
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <Carousel slides={caseSlides(c, s)} height={180} />
        <div className="flex flex-col gap-3 px-4 py-4">
          <div className="flex flex-wrap gap-1.5">
            <TypeBadge type={c.type} small />
            <StatusBadge status={knowledge.status} small />
          </div>
          <div>
            <h1 className="text-h2 font-bold">{c.title}</h1>
            <div className="text-small text-ink-2">{c.place}</div>
          </div>

          {askResolved && (
            <div className="flex flex-col gap-3 rounded-card border-2 border-brand bg-surface p-4 animate-pop" role="alertdialog" aria-labelledby="ask-title">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 items-center justify-center rounded-full bg-st-planned-bg text-st-planned">
                  <IconWrench size={22} strokeWidth={2.2} />
                </span>
                <div id="ask-title" className="text-[19px] font-bold leading-6">
                  Remont wykonany. Czy Twój problem jest rozwiązany?
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Button variant="primary" onClick={() => respond(true)}>
                  Tak
                </Button>
                <Button onClick={() => respond(false)}>Nie</Button>
              </div>
            </div>
          )}

          {answer?.solved && (
            <div className="flex flex-col items-center gap-2 rounded-card bg-st-done-bg p-5 text-center text-st-done animate-pop">
              <IconCheckCircle size={44} strokeWidth={2} />
              <div className="text-[20px] font-bold">Dziękujemy! Sprawa zamknięta.</div>
              <p className="text-[16px] leading-6 text-ink">
                {n > 1 ? `Razem z ${n - 1} ${plural(n - 1, ['sąsiadem', 'sąsiadami', 'sąsiadami'])} zmieniliście okolicę.` : 'Twoje zgłoszenie zmieniło okolicę.'} Twój głos został zauważony.
              </p>
            </div>
          )}

          {answer && !answer.solved && (
            <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4 animate-pop">
              <div className="flex items-center gap-2 text-[18px] font-bold">
                <IconRefresh size={22} className="text-brand" strokeWidth={2.2} />
                Utworzyliśmy nowe zgłoszenie
              </div>
              <p className="text-[16px] leading-6">Jest powiązane z poprzednią sprawą, więc nic nie ginie.</p>
              {answer.result.warranty && (
                <p className="rounded-btn bg-st-planned-bg px-3 py-2.5 text-[16px] leading-6 text-st-planned">
                  Remont zakończono niedawno, więc urząd dostał sygnał, że usterka może podlegać <b>gwarancji wykonawcy</b>.
                </p>
              )}
              {answer.result.newCaseId && (
                <Button size="sm" className="self-start" onClick={() => onOpenCase(answer.result.newCaseId!)}>
                  Zobacz nowe zgłoszenie
                </Button>
              )}
            </div>
          )}

          {linked && (
            <button type="button" onClick={() => onOpenCase(linked.id)} className="rounded-btn border border-line bg-surface px-3 py-2.5 text-left text-[15px] hover:bg-canvas">
              Powiązane z wcześniejszą sprawą: <b>{linked.title}</b>
            </button>
          )}

          <div className={`flex flex-col gap-2 rounded-card bg-surface p-4 ${knowledge.status === 'overdue' ? 'border-2 border-brand' : 'border border-line'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[15px] font-bold text-ink-2">Co miasto wie o tym miejscu</span>
              {knowledge.status === 'overdue' && <StatusBadge status="overdue" small label="Termin minął" />}
            </div>
            <p className="text-[17px] leading-[26px]">{knowledge.text}</p>
            {knowledge.doc && <DocLink doc={knowledge.doc} />}
          </div>

          {!mine && knowledge.status !== 'resolved' && (
            <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-4">
              <div className="min-w-0 flex-1">
                <div className="text-[17px] font-bold leading-6">{boosted ? 'Twoje podbicie się liczy' : 'Ciebie też to dotyczy?'}</div>
                <div className="text-[14px] leading-5 text-ink-2">
                  {supporters > 0 ? `${supporters} ${plural(supporters, ['podbicie', 'podbicia', 'podbić'])} od zweryfikowanych mieszkańców` : 'Podbij, żeby radni widzieli, że to ważne.'}
                </div>
              </div>
              {boosted ? (
                <span className="inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-full bg-st-done-bg px-4 text-[16px] font-bold text-st-done">
                  <IconCheck size={18} strokeWidth={2.6} /> Podbite
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => (s.verification ? boostCase(c.id) : onRequestVerify())}
                  className="inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-full border-2 border-brand px-4 text-[16px] font-bold text-brand hover:bg-brand-tint active:scale-95"
                >
                  {s.verification ? <IconArrowUp size={20} strokeWidth={2.6} /> : <IconShield size={18} strokeWidth={2.4} />}
                  Podbij
                </button>
              )}
            </div>
          )}
          {!mine && !s.verification && knowledge.status !== 'resolved' && (
            <p className="-mt-1.5 px-1 text-[14px] leading-5 text-ink-2">Podbijać mogą mieszkańcy zweryfikowani przez mObywatel. Tak jeden głos liczy się raz.</p>
          )}

          <h2 ref={timelineRef} className="mt-2 scroll-mt-3 text-h2 font-bold">
            Co się dzieje
          </h2>
          <Timeline events={c.events} documents={s.documents} highlightId={lastEvent?.id} />

          <div className="rounded-card border border-line bg-surface px-4 py-1">
            <div className="flex gap-3 border-b border-[#eef0f3] py-3">
              <IconUsers size={22} className="mt-0.5 shrink-0" />
              <div className="text-[17px] leading-6">
                <b>{c.type === 'idea' ? `${n} ${plural(n, ['osoba prosi', 'osoby proszą', 'osób prosi'])}` : countLabel(n, REPORT_FORMS)}</b> w tej sprawie
              </div>
            </div>
            <div className="flex gap-3 py-3">
              <IconBuilding size={22} className="mt-0.5 shrink-0" />
              <div className="text-[17px] leading-6">
                Odpowiada: <b>{unit.name}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
