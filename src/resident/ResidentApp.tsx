import { useEffect, useRef, useState, type ReactNode } from 'react'
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
import { TabBar } from './TabBar'
import { CaptureSheet } from './CaptureSheet'

type Screen =
  | { name: 'home' }
  | { name: 'cases' }
  | { name: 'report'; preset?: 'pothole' | 'bench'; photo?: string; key: number }
  | { name: 'analyzing'; draft: ReportDraft }
  | { name: 'result'; draft: ReportDraft; analysis: Analysis; caseId: string | null }
  | { name: 'case'; caseId: string }

type Nav = 'push' | 'back' | 'none'

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
  const s = useDemo()
  const [stack, setStack] = useState<Screen[]>([{ name: 'home' }])
  const [nav, setNav] = useState<Nav>('none')
  const [verify, setVerify] = useState<string | null>(null)
  const [capture, setCapture] = useState(false)
  const [toast, setToast] = useNotificationToast()
  const screen = stack[stack.length - 1]
  const unread = s.notifications.filter((n) => !n.read).length

  const go = (n: Nav, next: Screen[] | ((st: Screen[]) => Screen[])) => {
    setNav(n)
    setStack(next)
  }
  const push = (sc: Screen) => go('push', (st) => [...st, sc])
  const replace = (sc: Screen) => go('push', (st) => [...st.slice(0, -1), sc])
  const back = () => go('back', (st) => (st.length > 1 ? st.slice(0, -1) : st))
  const tab = (root: 'home' | 'cases') => go('none', [{ name: root }])
  const openCaseFresh = (caseId: string) => go('push', [{ name: 'cases' }, { name: 'case', caseId }])

  useDemoCommand((cmd) => {
    setCapture(false)
    if (cmd.type === 'home') go('none', [{ name: 'home' }])
    if (cmd.type === 'prefill') go('push', [{ name: 'home' }, { name: 'report', preset: cmd.scenario, key: Date.now() }])
    if (cmd.type === 'open-case') openCaseFresh(cmd.caseId)
  })

  const openCase = (caseId: string) => push({ name: 'case', caseId })
  const startReport = (photo?: string) => {
    setCapture(false)
    push({ name: 'report', photo, key: Date.now() })
  }

  let content: ReactNode
  switch (screen.name) {
    case 'home':
      content = <HomeScreen onNotifications={() => tab('cases')} onOpenCase={openCase} />
      break
    case 'cases':
      content = <MyCasesScreen onOpen={openCase} onVerify={() => setVerify('')} onReport={() => setCapture(true)} />
      break
    case 'report':
      content = <ReportScreen key={screen.key} preset={screen.preset} initialPhoto={screen.photo} onBack={back} onSubmit={(draft) => replace({ name: 'analyzing', draft })} />
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
          onFollow={() => screen.caseId && openCaseFresh(screen.caseId)}
          onVerify={() => setVerify('')}
          onHome={() => go('back', [{ name: 'home' }])}
          onFix={() => replace({ name: 'report', key: Date.now() })}
        />
      )
      break
    case 'case':
      content = (
        <CaseScreen
          key={screen.caseId}
          caseId={screen.caseId}
          onBack={back}
          onOpenCase={openCase}
          onRequestVerify={() => setVerify('Podbijać sprawy mogą zweryfikowani mieszkańcy. Dzięki temu jeden głos liczy się raz.')}
        />
      )
      break
  }

  const showTabs = screen.name === 'home' || screen.name === 'cases'
  const anim = nav === 'push' ? 'animate-push' : nav === 'back' ? 'animate-back' : ''

  return (
    <PhoneFrame>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div key={stack.length + screen.name + ('caseId' in screen ? screen.caseId : '')} className={`absolute inset-0 bg-canvas ${anim}`}>
          {content}
        </div>
      </div>
      {showTabs && <TabBar active={screen.name === 'cases' ? 'cases' : 'map'} unread={unread} onMap={() => tab('home')} onCases={() => tab('cases')} onCapture={() => setCapture(true)} />}

      {toast && (
        <div className="absolute inset-x-2.5 top-2 z-50 animate-slide-down md:top-12" role="status" aria-live="polite">
          <div className="flex items-start gap-3 rounded-[22px] bg-surface/95 p-3 shadow-[0_8px_30px_rgba(22,25,29,0.25)] backdrop-blur">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-brand text-white">
              <IconBell size={20} strokeWidth={2.2} />
            </span>
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => {
                openCaseFresh(toast.caseId)
                setToast(null)
              }}
            >
              <div className="flex items-baseline justify-between gap-2 text-[13px] text-ink-2">
                <span className="font-bold tracking-wide uppercase">Głos Osiedla</span>
                <span>teraz</span>
              </div>
              <div className="text-[16px] font-bold leading-[22px]">{toast.title}</div>
              <div className="line-clamp-2 text-[15px] leading-[21px] text-ink-2">{toast.text}</div>
            </button>
            <button type="button" aria-label="Zamknij powiadomienie" onClick={() => setToast(null)} className="-mt-1 -mr-1 flex size-9 items-center justify-center rounded-full hover:bg-canvas">
              <IconX size={18} />
            </button>
          </div>
        </div>
      )}
      {capture && <CaptureSheet onPhoto={(src) => startReport(src)} onNoPhoto={() => startReport()} onClose={() => setCapture(false)} />}
      {verify !== null && <VerifyModal reason={verify || undefined} onClose={() => setVerify(null)} />}
    </PhoneFrame>
  )
}

/** Pasek statusu telefonu — tylko w ramce na komputerze (na prawdziwym telefonie jest systemowy) */
function StatusBar() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setTime(new Date()), 30000)
    return () => window.clearInterval(id)
  }, [])
  return (
    <div className="relative hidden h-11 shrink-0 items-center justify-between bg-surface px-7 text-[15px] font-bold md:flex" aria-hidden="true">
      <span>{time.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
      <span className="absolute top-2 left-1/2 h-[26px] w-[104px] -translate-x-1/2 rounded-full bg-ink" />
      <span className="flex items-center gap-1.5">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M1.5 4.2a9.5 9.5 0 0 1 13 0M4 7a6 6 0 0 1 8 0" />
          <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" />
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="16" height="8" rx="1.8" fill="currentColor" />
          <rect x="23.5" y="4" width="2" height="4" rx="1" fill="currentColor" opacity="0.4" />
        </svg>
      </span>
    </div>
  )
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center gap-16 md:p-6">
      <aside className="hidden max-w-sm flex-col gap-4 lg:flex" aria-hidden="true">
        <Logo size={64} />
        <div className="text-display font-bold tracking-[-0.01em]">Głos Osiedla</div>
        <div className="text-h2 text-ink-2">Zgłoszenia, które nie giną.</div>
        <div className="mt-2 text-body text-ink-2">Rubinkowo · Toruń</div>
      </aside>
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-canvas md:h-[min(844px,calc(100dvh-48px))] md:w-[390px] md:rounded-[54px] md:border-[12px] md:border-ink md:shadow-[0_30px_80px_rgba(22,25,29,0.28)]">
        <StatusBar />
        {children}
        <div className="hidden h-6 shrink-0 items-center justify-center bg-surface md:flex" aria-hidden="true">
          <span className="h-[5px] w-32 rounded-full bg-ink" />
        </div>
      </div>
    </div>
  )
}
