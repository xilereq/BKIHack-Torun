export interface LngLat {
  lat: number
  lng: number
}

export type CaseType = 'problem' | 'idea'

/** Status widoczny dla mieszkańca i radnego. `done` = remont wykonany, czekamy na potwierdzenie mieszkańca. */
export type CaseStatus = 'new' | 'planned' | 'overdue' | 'done' | 'resolved'

export type EventType =
  | 'reported'
  | 'merged'
  | 'forwarded'
  | 'interpellation'
  | 'response'
  | 'planned'
  | 'done'
  | 'resolved'
  | 'reopened'

export interface CaseEvent {
  id: string
  type: EventType
  date: string
  title: string
  text?: string
  docId?: string
}

export interface Unit {
  id: string
  name: string
  short: string
}

export interface CaseFactors {
  /** 0–40: jak poważna jest szkoda (ocena ze zdjęcia i kategorii) */
  severity: number
  transit?: { trips: number; mode: string }
  nearby?: string
}

export interface Case {
  id: string
  type: CaseType
  title: string
  category: string
  unitId: string
  unitReason: string
  place: string
  /** Osiedle (id z districts.json) */
  district: string
  location: LngLat
  photo: string
  createdAt: string
  documentIds: string[]
  events: CaseEvent[]
  factors: CaseFactors
  /** Status ustawiony ręcznie (np. rozwiązane). Bez niego status liczy się z dokumentów i zdarzeń. */
  statusOverride?: CaseStatus
  /** Większy pomysł: podpowiadamy ścieżkę budżetu obywatelskiego */
  bigIdea?: boolean
  /** Sprawa powiązana (np. ponowne zgłoszenie po remoncie) */
  linkedCaseId?: string
  /** Ile razy zweryfikowani mieszkańcy podbili sprawę („mnie też to dotyczy”) */
  supporters?: number
}

export interface Report {
  id: string
  caseId: string
  description: string
  photo: string
  createdAt: string
  location: LngLat
  verified: boolean
  mine?: boolean
}

export type DocKind = 'interpelacja' | 'odpowiedz' | 'plan' | 'komunikat' | 'protokol' | 'budzet'

export interface Commitment {
  text: string
  /** Termin w formacie RRRR-MM */
  deadline: string
}

export interface CityDocument {
  id: string
  kind: DocKind
  title: string
  date: string
  author: string
  summary: string
  place: string
  location: LngLat
  url: string
  commitment?: Commitment
  /** Dokument pojawia się dopiero po akcji w panelu demo */
  hidden?: boolean
}

export interface Place {
  name: string
  location: LngLat
}

export interface Notification {
  id: string
  caseId: string
  title: string
  text: string
  date: string
  read: boolean
}

export interface Verification {
  pseudonym: string
  torun: boolean
  verifiedAt: string
}

export interface District {
  id: string
  name: string
  center: LngLat
}
