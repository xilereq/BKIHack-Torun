import { useSyncExternalStore } from 'react'
import type { Case, CaseEvent, CityDocument, LngLat, Notification, Report, Verification } from './types'
import casesSeed from '../data/demo/cases.json'
import reportsSeed from '../data/demo/reports.json'
import documentsSeed from '../data/demo/documents.json'
import { lowerFirst, nowIso, plural, uid } from './format'
import { unitById } from './domain'
import type { Analysis } from './ai'

/**
 * Stan demo: dane startowe z plików JSON (src/data/demo) + zmiany zrobione w trakcie pokazu.
 * Trzymany w pamięci i w localStorage. Zmiana w jednej karcie przeglądarki od razu widać w drugiej.
 */
export interface DemoState {
  version: number
  cases: Case[]
  reports: Report[]
  documents: CityDocument[]
  notifications: Notification[]
  verification: Verification | null
  /** Sprawa, której dotyczą przyciski panelu demo (ostatnie zgłoszenie mieszkańca) */
  lastCaseId: string | null
  /** Sprawy podbite przez tego mieszkańca */
  boosts: string[]
}

const STORAGE_KEY = 'glos-osiedla-demo-v1'
const VERSION = 2
export const MAIN_CASE_ID = 'c-rubinkowo-centrum'

function seed(): DemoState {
  return {
    version: VERSION,
    cases: structuredClone(casesSeed) as Case[],
    reports: structuredClone(reportsSeed) as Report[],
    documents: structuredClone(documentsSeed) as CityDocument[],
    notifications: [],
    verification: null,
    lastCaseId: null,
    boosts: [],
  }
}

function load(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState
      if (parsed.version === VERSION && Array.isArray(parsed.cases)) return parsed
    }
  } catch {
    /* brak dostępu do localStorage: działamy w pamięci */
  }
  return seed()
}

let state: DemoState = load()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignorujemy: demo działa dalej w pamięci */
  }
}

function setState(updater: (s: DemoState) => DemoState) {
  state = updater(state)
  save()
  emit()
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return
    state = load()
    emit()
  })
}

export function useDemo(): DemoState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

export function getState(): DemoState {
  return state
}

// ---------- akcje ----------

function updateCase(s: DemoState, id: string, fn: (c: Case) => Case): Case[] {
  return s.cases.map((c) => (c.id === id ? fn(c) : c))
}

function isFollowed(s: DemoState, caseId: string): boolean {
  return s.reports.some((r) => r.caseId === caseId && r.mine)
}

function notify(s: DemoState, caseId: string, title: string, text: string): Notification[] {
  if (!isFollowed(s, caseId)) return s.notifications
  return [{ id: uid('n'), caseId, title, text, date: nowIso(), read: false }, ...s.notifications]
}

export interface SubmitInput {
  description: string
  photo: string
  location: LngLat
  place: string
  analysis: Analysis
}

/** Zapisuje zgłoszenie mieszkańca: dołącza do istniejącej sprawy albo tworzy nową. Zwraca id sprawy. */
export function submitReport(input: SubmitInput): string {
  const { analysis: a } = input
  const date = nowIso()
  let caseId = a.targetCaseId
  setState((s) => {
    const report: Report = {
      id: uid('r'),
      caseId: '',
      description: input.description,
      photo: input.photo,
      createdAt: date,
      location: input.location,
      verified: !!s.verification,
      mine: true,
    }
    let cases = s.cases
    if (caseId) {
      const total = s.reports.filter((r) => r.caseId === caseId).length + 1
      cases = updateCase(s, caseId, (c) => ({
        ...c,
        events: [
          ...c.events,
          {
            id: uid('e'),
            type: 'merged',
            date,
            title:
              c.type === 'idea'
                ? `Twoja prośba dołączona: ${total} ${plural(total, ['osoba prosi', 'osoby proszą', 'osób prosi'])} o to samo`
                : `Twoje zgłoszenie połączone z ${total - 1} innymi`,
          },
        ],
      }))
    } else {
      caseId = uid('c')
      const newCase: Case = {
        id: caseId,
        type: a.type,
        title: a.title,
        category: a.category,
        unitId: a.unitId,
        unitReason: a.unitReason,
        place: input.place,
        location: input.location,
        photo: input.photo,
        createdAt: date,
        documentIds: a.answer.docId ? [a.answer.docId] : [],
        factors: { severity: a.severity },
        bigIdea: a.bigIdea || undefined,
        events: [
          { id: uid('e'), type: 'reported', date, title: 'Twoje zgłoszenie' },
          { id: uid('e'), type: 'forwarded', date, title: `Przekazano do: ${a.unitShort} i radnych okręgu` },
        ],
      }
      cases = [...s.cases, newCase]
    }
    report.caseId = caseId
    return { ...s, cases, reports: [...s.reports, report], lastCaseId: caseId }
  })
  return caseId!
}

export type DemoEventKind = 'interpellation' | 'response' | 'planned' | 'done'

/** Id sprawy, której dotyczą przyciski panelu demo */
export function demoTargetCaseId(s: DemoState = state): string {
  return s.lastCaseId && s.cases.some((c) => c.id === s.lastCaseId) ? s.lastCaseId : MAIN_CASE_ID
}

function addMonths(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 7)
}

/** Dopisuje zdarzenie do sprawy (panel demo albo wysłanie interpelacji z panelu radnego) */
export function addCaseEvent(kind: DemoEventKind, caseId = demoTargetCaseId(), interpellationText?: string) {
  const date = nowIso()
  setState((s) => {
    const c = s.cases.find((x) => x.id === caseId)
    if (!c) return s
    // dla głównej sprawy demo odsłaniamy przygotowane dokumenty, dla innych tworzymy ogólne
    const isMain = caseId === MAIN_CASE_ID
    let documents = s.documents
    let doc: CityDocument | null = null
    const reveal = (id: string) => {
      const found = documents.find((d) => d.id === id)
      if (!found) return null
      const revealed = { ...found, hidden: false, date }
      documents = documents.map((d) => (d.id === id ? revealed : d))
      return revealed
    }
    const create = (partial: Pick<CityDocument, 'kind' | 'title' | 'summary' | 'author'> & { commitment?: CityDocument['commitment'] }) => {
      const created: CityDocument = {
        id: uid('d'),
        date,
        place: c.place,
        location: { lat: c.location.lat + 0.00012, lng: c.location.lng - 0.00018 },
        url: 'https://bip.torun.pl/interpelacje/29500',
        ...partial,
      }
      documents = [...documents, created]
      return created
    }

    let event: Omit<CaseEvent, 'id' | 'date'>
    let note: { title: string; text: string }
    switch (kind) {
      case 'interpellation': {
        doc = create({
          kind: 'interpelacja',
          title: `Interpelacja w sprawie: ${lowerFirst(c.title)} (${c.place})`,
          summary: interpellationText
            ? interpellationText.split('\n').find((l) => l.trim().length > 60)?.trim() ?? 'Interpelacja przygotowana na podstawie zgłoszeń mieszkańców.'
            : 'Radna okręgu pyta o przyczyny opóźnienia i nowy termin, powołując się na zgłoszenia mieszkańców z aplikacji.',
          author: 'Radna Anna Przykładowa (postać fikcyjna, dane demo)',
        })
        event = { type: 'interpellation', title: 'Radna okręgu złożyła interpelację', docId: doc.id }
        note = { title: 'Interpelacja w Twojej sprawie', text: 'Radna okręgu złożyła interpelację na podstawie zgłoszeń mieszkańców.' }
        break
      }
      case 'response': {
        doc = isMain
          ? reveal('d-demo-odp-2026')
          : create({ kind: 'odpowiedz', title: `Odpowiedź urzędu: ${lowerFirst(c.title)}`, summary: 'Urząd potwierdza problem i zapowiada przygotowanie naprawy.', author: 'Urząd Miasta Torunia (dane demo)' })
        event = { type: 'response', title: 'Odpowiedź urzędu', text: doc?.summary, docId: doc?.id }
        note = { title: 'Urząd odpowiedział', text: doc?.summary ?? 'Urząd odpowiedział w Twojej sprawie.' }
        break
      }
      case 'planned': {
        doc = isMain
          ? reveal('d-demo-plan-2027')
          : create({
              kind: 'plan',
              title: `Plan naprawy: ${lowerFirst(c.title)}`,
              summary: 'Naprawę ujęto w planie prac jednostki.',
              author: 'Miejski Zarząd Dróg w Toruniu (dane demo)',
              commitment: { text: `Naprawa: ${lowerFirst(c.title)}`, deadline: addMonths(6) },
            })
        const when = doc?.commitment ? ` na ${doc.commitment.deadline.slice(0, 4)} r.` : ''
        event = { type: 'planned', title: `Remont zaplanowany${when}`, text: doc?.summary, docId: doc?.id }
        note = { title: `Remont zaplanowany${when}`, text: doc?.summary ?? 'Naprawa trafiła do planu prac.' }
        break
      }
      case 'done': {
        doc = isMain
          ? reveal('d-demo-odbior')
          : create({ kind: 'protokol', title: `Protokół odbioru: ${lowerFirst(c.title)}`, summary: 'Prace zakończone i odebrane.', author: 'Miejski Zarząd Dróg w Toruniu (dane demo)' })
        event = { type: 'done', title: 'Remont wykonany', text: doc?.summary, docId: doc?.id }
        note = { title: 'Remont wykonany', text: 'Czy Twój problem jest rozwiązany? Daj znać jednym kliknięciem.' }
        break
      }
    }
    const cases = updateCase({ ...s, documents }, caseId, (x) => ({
      ...x,
      statusOverride: undefined,
      documentIds: doc && !x.documentIds.includes(doc.id) ? [...x.documentIds, doc.id] : x.documentIds,
      events: [...x.events, { id: uid('e'), date, ...event }],
    }))
    return { ...s, documents, cases, notifications: notify(s, caseId, note.title, note.text) }
  })
}

export interface ResolveResult {
  newCaseId?: string
  warranty: boolean
}

/** Odpowiedź mieszkańca na „Czy problem rozwiązany?” */
export function answerResolved(caseId: string, solved: boolean): ResolveResult {
  const date = nowIso()
  let result: ResolveResult = { warranty: false }
  setState((s) => {
    const c = s.cases.find((x) => x.id === caseId)
    if (!c) return s
    if (solved) {
      return {
        ...s,
        cases: updateCase(s, caseId, (x) => ({
          ...x,
          events: [...x.events, { id: uid('e'), type: 'resolved', date, title: 'Mieszkaniec potwierdził: problem rozwiązany' }],
        })),
      }
    }
    const doneEvent = [...c.events].reverse().find((e) => e.type === 'done')
    const daysSinceDone = doneEvent ? (Date.now() - new Date(doneEvent.date).getTime()) / 86400000 : Infinity
    const warranty = daysSinceDone < 365 * 2
    const newId = uid('c')
    const newCase: Case = {
      ...c,
      id: newId,
      title: `Usterka wróciła po remoncie: ${lowerFirst(c.title)}`,
      createdAt: date,
      documentIds: doneEvent?.docId ? [doneEvent.docId] : [],
      linkedCaseId: c.id,
      statusOverride: undefined,
      events: [
        { id: uid('e'), type: 'reported', date, title: 'Twoje ponowne zgłoszenie', text: 'Powiązane z poprzednią sprawą.' },
        warranty
          ? { id: uid('e'), type: 'forwarded', date, title: 'Sygnał do urzędu: możliwa gwarancja wykonawcy', text: 'Usterka pojawiła się wkrótce po remoncie, więc urząd może wezwać wykonawcę do naprawy w ramach gwarancji.' }
          : { id: uid('e'), type: 'forwarded', date, title: `Przekazano do: ${unitById(c.unitId).short}` },
      ],
    }
    const report: Report = {
      id: uid('r'),
      caseId: newId,
      description: 'Problem nie został rozwiązany po remoncie.',
      photo: c.photo,
      createdAt: date,
      location: c.location,
      verified: !!s.verification,
      mine: true,
    }
    result = { newCaseId: newId, warranty }
    return {
      ...s,
      cases: [
        ...updateCase(s, caseId, (x) => ({
          ...x,
          events: [...x.events, { id: uid('e'), type: 'reopened', date, title: 'Mieszkaniec zgłosił, że problem wrócił' }],
        })),
        newCase,
      ],
      reports: [...s.reports, report],
      lastCaseId: newId,
    }
  })
  return result
}

export function setVerified(v: Verification) {
  setState((s) => ({
    ...s,
    verification: v,
    reports: s.reports.map((r) => (r.mine ? { ...r, verified: true } : r)),
  }))
}

/** Podbicie sprawy przez zweryfikowanego mieszkańca (raz na sprawę). Zwraca false, gdy brak weryfikacji. */
export function boostCase(caseId: string): boolean {
  if (!state.verification || state.boosts.includes(caseId)) return false
  setState((s) => ({
    ...s,
    boosts: [...s.boosts, caseId],
    cases: updateCase(s, caseId, (c) => ({ ...c, supporters: (c.supporters ?? 0) + 1 })),
  }))
  return true
}

export function markNotificationsRead(caseId?: string) {
  setState((s) => ({
    ...s,
    notifications: s.notifications.map((n) => (!caseId || n.caseId === caseId ? { ...n, read: true } : n)),
  }))
}

export function resetDemo() {
  state = seed()
  save()
  emit()
}
