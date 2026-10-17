import { useEffect, useRef, useState } from 'react'
import type { Analysis } from '../lib/ai'
import { submitReport, useDemo } from '../lib/store'
import { useDemoCommand } from '../lib/hooks'
import type { Notification } from '../lib/types'
import { IconBell, IconX } from '../components/icons'
import { Logo } from '../components/ui'
import { HomeScreen } from './HomeScreen'
import { ReportScreen, type ReportDraft } from './ReportScreen'
import { AnalyzingScreen } from './AnalyzingScreen'
import { ResultScreen } from './ResultScreen'
import { MyCasesScreen } from './MyCasesScreen'
import { CaseScreen } from './CaseScreen'
import { VerifyModal } from './VerifyModal'

type Screen =
  | { name: 'home' }
  | { name: 'report'; preset?: 'pothole' | 'bench'; key: number }
  | { name: 'analyzing'; draft: ReportDraft }
  | { name: 'result'; draft: ReportDraft; analysis: Analysis; caseId: string | null }
  | { name: 'cases' }
  | { name: 'case'; caseId: string }

function useNotificationToast() {
  const s = useDemo()
  // świeże, nieprzeczytane powiadomienia (np. interpelacja wysłana w panelu radnego) pokażemy po wejściu
  const seen = useRef(new Set(s.notifications.filter((n) => n.read || Date.now() - new Date(n.date).getTime() > 120000).map((n) => n.id)))
  const [toast, setToast] = useState<Notification | null>(null)
  useEffect(() => {
    const fresh = s.notifications.find((n) => !seen.current.has(n.id))
    s.notifications.forEach((n) => seen.current.add(n.id))
    if (fresh) setToast(fresh)
  }, [s.notifications])
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 7000)
    return () => window.clearTimeout(t)
  }, [toast])
  return [toast, setToast] as const
}

export function ResidentApp() {
  const [stack, setStack] = useState<Screen[]>([{ name: 'home' }])
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [toast, setToast] = useNotificationToast()
  const screen = stack[stack.length - 1]

  const push = (sc: Screen) => setStack((st) => [...st, sc])
  const replace = (sc: Screen) => setStack((st) => [...st.slice(0, -1), sc])
  const back = () => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st))
  const home = () => setStack([{ name: 'home' }])

  useDemoCommand((cmd) => {
    if (cmd.type === 'home') home()
    if (cmd.type === 'prefill') setStack([{ name: 'home' }, { name: 'report', preset: cmd.scenario, key: Date.now() }])
    if (cmd.type === 'open-case') setStack([{ name: 'home' }, { name: 'cases' }, { name: 'case', caseId: cmd.caseId }])
  })

  const openCase = (caseId: string) => push({ name: 'case', caseId })

  let content
  switch (screen.name) {
    case 'home':
      content = <HomeScreen onReport={() => push({ name: 'report', key: Date.now() })} onMyCases={() => push({ name: 'cases' })} onOpenCase={openCase} />
      break
    case 'report':
      content = <ReportScreen key={screen.key} preset={screen.preset} onBack={back} onSubmit={(draft) => replace({ name: 'analyzing', draft })} />
      break
    case 'analyzing':
      content = (
        <AnalyzingScreen
          draft={screen.draft}
          onDone={(analysis) => {
            const caseId = analysis.spam
              ? null
              : submitReport({ description: screen.draft.description, photo: screen.draft.photo, location: screen.draft.location, place: screen.draft.place, analysis })
            replace({ name: 'result', draft: screen.draft, analysis, caseId })
          }}
        />
      )
      break
    case 'result':
      content = (
        <ResultScreen
          draft={screen.draft}
          analysis={screen.analysis}
          caseId={screen.caseId}
          onFollow={() => screen.caseId && setStack([{ name: 'home' }, { name: 'cases' }, { name: 'case', caseId: screen.caseId }])}
          onVerify={() => setVerifyOpen(true)}
          onHome={home}
          onFix={() => replace({ name: 'report', key: Date.now() })}
        />
      )
      break
    case 'cases':
      content = <MyCasesScreen onBack={back} onOpen={openCase} onVerify={() => setVerifyOpen(true)} onReport={() => push({ name: 'report', key: Date.now() })} />
      break
    case 'case':
      content = <CaseScreen key={screen.caseId} caseId={screen.caseId} onBack={back} onOpenCase={openCase} />
      break
  }

  return (
    <PhoneFrame>
      <div key={stack.length + screen.name} className="h-full animate-screen-in">
        {content}
      </div>
      {toast && (
        <div className="absolute inset-x-3 top-3 z-50 animate-slide-down" role="status" aria-live="polite">
          <div className="flex items-start gap-3 rounded-card border border-line bg-surface p-3.5 shadow-xl">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white">
              <IconBell size={20} strokeWidth={2.2} />
            </span>
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => {
                setStack([{ name: 'home' }, { name: 'cases' }, { name: 'case', caseId: toast.caseId }])
                setToast(null)
              }}
            >
              <div className="text-[13px] font-bold tracking-wide text-ink-2 uppercase">Głos Osiedla · teraz</div>
              <div className="text-[17px] font-bold leading-6">{toast.title}</div>
              <div className="line-clamp-2 text-[15px] leading-[21px] text-ink-2">{toast.text}</div>
            </button>
            <button type="button" aria-label="Zamknij powiadomienie" onClick={() => setToast(null)} className="-mt-1 -mr-1 flex size-10 items-center justify-center rounded-btn hover:bg-canvas">
              <IconX size={18} />
            </button>
          </div>
        </div>
      )}
      {verifyOpen && <VerifyModal onClose={() => setVerifyOpen(false)} />}
    </PhoneFrame>
  )
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center gap-16 md:p-6">
      <aside className="hidden max-w-sm flex-col gap-4 lg:flex" aria-hidden="true">
        <Logo size={64} />
        <div className="text-display font-bold tracking-[-0.01em]">Głos Osiedla</div>
        <div className="text-h2 text-ink-2">Zgłoszenia, które nie giną.</div>
        <div className="mt-2 text-body text-ink-2">Rubinkowo · Toruń</div>
      </aside>
      <div className="relative h-full w-full overflow-hidden bg-canvas md:h-[min(844px,calc(100dvh-48px))] md:w-[390px] md:rounded-[48px] md:border-[10px] md:border-ink md:shadow-2xl">
        {children}
      </div>
    </div>
  )
}
