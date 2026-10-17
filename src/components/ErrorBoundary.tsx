import { Component, type ReactNode } from 'react'

/**
 * Siatka bezpieczeństwa na scenę: gdy jakiś ekran rzuci błąd, zamiast pustej strony
 * pokazujemy spokojny komunikat i przycisk powrotu. Stan demo zostaje nienaruszony.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('Głos Osiedla: przechwycony błąd widoku', error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="flex h-full items-center justify-center bg-canvas p-6">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-card border border-line bg-surface p-8 text-center">
          <div className="text-h2 font-bold">Chwileczkę…</div>
          <p className="text-body text-ink-2">Odświeżamy widok. Twoje zgłoszenia są bezpieczne.</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ failed: false })
              window.location.hash = window.location.hash.startsWith('#/radny') ? '#/radny' : '#/mieszkaniec'
            }}
            className="min-h-13 rounded-btn bg-brand px-6 text-[18px] font-bold text-white hover:bg-brand-dark"
          >
            Wróć do startu
          </button>
        </div>
      </div>
    )
  }
}
