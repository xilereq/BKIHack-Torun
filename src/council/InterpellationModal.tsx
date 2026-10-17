import { useEffect, useMemo, useRef, useState } from 'react'
import type { DemoState } from '../lib/store'
import { addCaseEvent } from '../lib/store'
import { draftInterpellation } from '../lib/interpelacja'
import { useTypewriter } from '../lib/hooks'
import { Button, Spinner } from '../components/ui'
import { IconCheckCircle, IconCopy, IconExternal, IconSend, IconSparkle, IconX } from '../components/icons'
import { caseReports } from '../lib/domain'
import { countLabel, REPORT_FORMS, plural } from '../lib/format'

export function InterpellationModal({ s, caseId, onClose }: { s: DemoState; caseId: string; onClose: () => void }) {
  const c = s.cases.find((x) => x.id === caseId)!
  // szkic liczony raz przy otwarciu (nie zmienia się, gdy w tle przyjdą nowe zdarzenia)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const draft = useMemo(() => draftInterpellation(c, s.reports, s.documents), [caseId])
  const [preparing, setPreparing] = useState(true)
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)
  const typed = useTypewriter(preparing ? null : draft.text, { cps: 260, onDone: () => setText(draft.text) })

  useEffect(() => {
    const t = window.setTimeout(() => setPreparing(false), 1100)
    return () => window.clearTimeout(t)
  }, [])

  const writing = !preparing && !typed.done
  const value = typed.done ? text : typed.out
  const areaRef = useRef<HTMLTextAreaElement>(null)

  // podczas pisania przewijamy pole za tekstem
  useEffect(() => {
    if (writing && areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight
  }, [value, writing])
  // liczby z chwili otwarcia okna (po wysłaniu dochodzi nowy dokument)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const [nReports, nDocs] = useMemo(() => [caseReports(c, s.reports).length, c.documentIds.length], [caseId])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      /* schowek niedostępny: pokazujemy tylko potwierdzenie */
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const send = () => {
    addCaseEvent('interpellation', caseId, value)
    setSent(true)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/45 p-6 animate-[fade-up_180ms_ease-out_both]" role="dialog" aria-modal="true" aria-labelledby="interp-title">
      <div className="flex max-h-full w-full max-w-[920px] flex-col overflow-hidden rounded-[20px] bg-surface shadow-2xl animate-fade-up">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-7 pt-6 pb-4">
          <div>
            <h2 id="interp-title" className="flex items-center gap-2 text-h1 font-bold">
              <IconSparkle size={26} className="text-brand" /> Szkic interpelacji
            </h2>
            <p className="mt-1 text-[16px] text-ink-2">
              Przygotowany na podstawie {countLabel(nReports, REPORT_FORMS)} i {nDocs} {plural(nDocs, ['dokumentu', 'dokumentów', 'dokumentów'])} miasta. Sprawdź, popraw i wyślij sam.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[13px] text-ink-2">
              {draft.sources.length} źródeł z przypisami · tylko fakty z dokumentów i zgłoszeń
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Zamknij" className="flex size-12 shrink-0 items-center justify-center rounded-btn hover:bg-canvas">
            <IconX size={22} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-7 py-5">
          {preparing ? (
            <div className="flex h-[360px] flex-col items-center justify-center gap-3 rounded-card border border-line bg-canvas text-ink-2" role="status">
              <Spinner size={28} />
              <div className="text-body">Model zbiera zgłoszenia, zdjęcia i odpowiedzi urzędu (RAG)…</div>
            </div>
          ) : (
            <>
              <label htmlFor="interp-text" className="sr-only">
                Treść interpelacji
              </label>
              <textarea
                id="interp-text"
                ref={areaRef}
                value={value}
                readOnly={writing || sent}
                onChange={(e) => setText(e.target.value)}
                className={`h-[400px] w-full resize-y rounded-card border-2 border-line-strong bg-surface px-5 py-4 font-sans text-[17px] leading-[27px] outline-none focus:border-ink ${writing ? 'typing-caret' : ''}`}
              />
              <div>
                <div className="mb-1.5 text-[15px] font-bold text-ink-2">Źródła</div>
                <ol className="flex flex-col gap-1">
                  {draft.sources.map((src) => (
                    <li key={src.n} className="text-[15px] leading-[22px]">
                      <span className="font-bold">[{src.n}]</span> {src.label}
                      {src.url && (
                        <a href={src.url} target="_blank" rel="noreferrer" className="ml-1.5 inline-flex items-center gap-1 font-bold text-brand hover:underline">
                          otwórz <IconExternal size={14} strokeWidth={2.2} />
                        </a>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line px-7 py-4">
          {sent ? (
            <div className="flex items-center gap-2.5 text-[17px] font-bold text-st-done" role="status">
              <IconCheckCircle size={24} strokeWidth={2.2} /> Wysłano do Biura Rady Miasta (symulacja). Mieszkańcy dostali powiadomienie.
            </div>
          ) : (
            <div className="text-[15px] text-ink-2">AI nie wysyła niczego samo. Decyzja należy do radnego.</div>
          )}
          <div className="flex gap-2.5">
            {sent ? (
              <Button onClick={onClose}>Zamknij</Button>
            ) : (
              <>
                <Button onClick={copy} disabled={preparing || writing}>
                  <IconCopy size={20} /> {copied ? 'Skopiowano' : 'Kopiuj'}
                </Button>
                <Button variant="primary" onClick={send} disabled={preparing || writing}>
                  <IconSend size={20} strokeWidth={2.2} /> Wyślij
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
