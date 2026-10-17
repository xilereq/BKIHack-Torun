import { useEffect, useState } from 'react'
import { ResidentApp } from './resident/ResidentApp'
import { CouncilApp } from './council/CouncilApp'
import { DemoPanel } from './demo/DemoPanel'
import { ErrorBoundary } from './components/ErrorBoundary'

export type View = 'resident' | 'council'

function viewFromHash(): View {
  return window.location.hash.startsWith('#/radny') ? 'council' : 'resident'
}

export default function App() {
  const [view, setView] = useState<View>(viewFromHash)
  const [panelOpen, setPanelOpen] = useState(() => new URLSearchParams(window.location.search).has('demo'))

  useEffect(() => {
    const onHash = () => setView(viewFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // ukryty panel demo: Ctrl+Shift+D, zapasowo Alt+Shift+D (Chrome może przechwycić Ctrl+Shift+D)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.altKey) && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault()
        setPanelOpen((o) => !o)
      }
      if (e.key === 'Escape') setPanelOpen(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  // zapasowo: 3 szybkie kliknięcia w lewy dolny róg ekranu (40×40 px)
  useEffect(() => {
    let clicks: number[] = []
    const onDown = (e: PointerEvent) => {
      if (e.clientX > 40 || e.clientY < window.innerHeight - 40) return
      const now = Date.now()
      clicks = [...clicks.filter((t) => now - t < 800), now]
      if (clicks.length >= 3) {
        clicks = []
        setPanelOpen((o) => !o)
      }
    }
    window.addEventListener('pointerdown', onDown, true)
    return () => window.removeEventListener('pointerdown', onDown, true)
  }, [])

  const switchView = (v: View) => {
    window.location.hash = v === 'council' ? '#/radny' : '#/mieszkaniec'
    setView(v)
  }

  useEffect(() => {
    document.title = view === 'council' ? 'Głos Osiedla · panel radnego' : 'Głos Osiedla'
  }, [view])

  return (
    <>
      <ErrorBoundary key={view}>{view === 'resident' ? <ResidentApp /> : <CouncilApp />}</ErrorBoundary>
      {panelOpen && <DemoPanel view={view} onSwitchView={switchView} onClose={() => setPanelOpen(false)} />}
    </>
  )
}
