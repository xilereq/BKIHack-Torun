import { useEffect, useRef, useState } from 'react'

/** Efekt pisania: zwraca kolejne fragmenty tekstu. `onDone` po zakończeniu. */
export function useTypewriter(text: string | null, opts: { cps?: number; onDone?: () => void } = {}) {
  const { cps = 40 } = opts
  const [out, setOut] = useState('')
  const [done, setDone] = useState(false)
  const doneRef = useRef(opts.onDone)
  doneRef.current = opts.onDone

  useEffect(() => {
    if (text === null) {
      setOut('')
      setDone(false)
      return
    }
    setOut('')
    setDone(false)
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setOut(text)
      setDone(true)
      doneRef.current?.()
      return
    }
    let i = 0
    const step = Math.max(1, Math.round(cps / 30))
    const id = window.setInterval(() => {
      i = Math.min(text.length, i + step)
      setOut(text.slice(0, i))
      if (i >= text.length) {
        window.clearInterval(id)
        setDone(true)
        doneRef.current?.()
      }
    }, 1000 / 30)
    return () => window.clearInterval(id)
  }, [text, cps])

  return { out, done }
}

/** Zdarzenia z panelu demo do widoków (wypełnienie scenariusza, nawigacja) */
export type DemoCommand =
  | { type: 'prefill'; scenario: 'pothole' | 'bench' }
  | { type: 'home' }
  | { type: 'open-case'; caseId: string }

const EVENT = 'glos-osiedla:demo'

export function sendDemoCommand(cmd: DemoCommand) {
  window.dispatchEvent(new CustomEvent<DemoCommand>(EVENT, { detail: cmd }))
}

export function useDemoCommand(handler: (cmd: DemoCommand) => void) {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    const fn = (e: Event) => ref.current((e as CustomEvent<DemoCommand>).detail)
    window.addEventListener(EVENT, fn)
    return () => window.removeEventListener(EVENT, fn)
  }, [])
}
