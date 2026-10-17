import { useEffect, useState } from 'react'
import { ResidentApp } from './resident/ResidentApp'
import { CouncilApp } from './council/CouncilApp'
import { DemoPanel } from './demo/DemoPanel'

export type View = 'resident' | 'council'

function viewFromHash(): View {
  return window.location.hash.startsWith('#/radny') ? 'council' : 'resident'
}

export default function App() {
  const [view, setView] = useState<View>(viewFromHash)
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    const onHash = () => setView(viewFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // ukryty panel demo: Ctrl+Shift+D
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        setPanelOpen((o) => !o)
      }
      if (e.key === 'Escape') setPanelOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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
      {view === 'resident' ? <ResidentApp /> : <CouncilApp />}
      {panelOpen && <DemoPanel view={view} onSwitchView={switchView} onClose={() => setPanelOpen(false)} />}
    </>
  )
}
