import type { Case, CaseStatus, CityDocument, Commitment, Report, Unit } from './types'
import unitsData from '../data/demo/units.json'
import { countLabel, plural, REPORT_FORMS, romanMonth } from './format'

export const units = unitsData as Unit[]

export function unitById(id: string): Unit {
  return units.find((u) => u.id === id) ?? units[0]
}

/** Ile pełnych miesięcy minęło od końca miesiąca terminu (ujemne = termin jeszcze nie minął) */
export function monthsOverdue(deadline: string, now = new Date()): number {
  const [y, m] = deadline.split('-').map(Number)
  const nowIdx = now.getFullYear() * 12 + now.getMonth() // miesiące od 0
  const deadlineIdx = y * 12 + (m - 1)
  return nowIdx - deadlineIdx
}

export function isOverdue(c: Commitment, now = new Date()): boolean {
  return monthsOverdue(c.deadline, now) > 0
}

export function visibleDocs(docs: CityDocument[]): CityDocument[] {
  return docs.filter((d) => !d.hidden)
}

export function caseDocuments(c: Case, docs: CityDocument[]): CityDocument[] {
  return visibleDocs(docs)
    .filter((d) => c.documentIds.includes(d.id))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Najnowsze zobowiązanie miasta w sprawie (z dokumentu o najpóźniejszej dacie) */
export function latestCommitment(c: Case, docs: CityDocument[]): { doc: CityDocument; commitment: Commitment } | null {
  const withC = caseDocuments(c, docs).filter((d) => d.commitment)
  const last = withC[withC.length - 1]
  return last && last.commitment ? { doc: last, commitment: last.commitment } : null
}

export function caseReports(c: Case, reports: Report[]): Report[] {
  return reports.filter((r) => r.caseId === c.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function caseStatus(c: Case, docs: CityDocument[], now = new Date()): CaseStatus {
  if (c.statusOverride) return c.statusOverride
  const keyEvents = c.events.filter((e) => e.type === 'done' || e.type === 'resolved' || e.type === 'reopened')
  const lastKey = keyEvents[keyEvents.length - 1]
  if (lastKey?.type === 'resolved') return 'resolved'
  // „reopened”: remont wykonany, ale problem wrócił — śledzimy go w nowej, powiązanej sprawie
  if (lastKey?.type === 'done' || lastKey?.type === 'reopened') return 'done'
  const lc = latestCommitment(c, docs)
  if (lc) return isOverdue(lc.commitment, now) ? 'overdue' : 'planned'
  return 'new'
}

export const STATUS_LABEL: Record<CaseStatus, string> = {
  new: 'Nowe',
  planned: 'Zaplanowane',
  overdue: 'Czeka na nowy termin',
  done: 'Remont wykonany',
  resolved: 'Rozwiązane',
}

export interface UrgencyTag {
  label: string
  tone: 'neutral' | 'wait' | 'info' | 'success'
}

export interface Urgency {
  score: number
  tags: UrgencyTag[]
  /** składniki wyniku — sumują się do score (przed przycięciem do 1–99) */
  factors: { label: string; points: number }[]
}

/** Pilność z uzasadnieniem. Skala 0–99. */
export function caseUrgency(c: Case, reports: Report[], docs: CityDocument[], now = new Date()): Urgency {
  const rs = caseReports(c, reports)
  const n = rs.length
  const status = caseStatus(c, docs, now)
  const tags: UrgencyTag[] = []
  const factors: { label: string; points: number }[] = [{ label: 'Waga problemu (zdjęcie, kategoria)', points: c.factors.severity }]
  const finish = () => {
    let score = factors.reduce((s, f) => s + f.points, 0)
    if (c.type === 'problem' && (status === 'resolved' || status === 'done')) {
      const cap = Math.min(score, 20)
      if (cap < score) factors.push({ label: 'Sprawa wykonana — niższy priorytet', points: cap - score })
      score = cap
    }
    return { score: Math.max(1, Math.min(99, score)), tags, factors }
  }

  if (c.type === 'idea') {
    tags.push({ label: `${n} ${plural(n, ['osoba prosi', 'osoby proszą', 'osób prosi'])} o to samo`, tone: 'neutral' })
    factors.push({ label: `Liczba próśb (${n})`, points: n * 4 })
    const v = rs.filter((r) => r.verified).length
    if (v) tags.push({ label: `${v} ${plural(v, ['zweryfikowana', 'zweryfikowane', 'zweryfikowanych'])}`, tone: 'success' })
    if (c.supporters) {
      tags.push({ label: boostLabel(c.supporters), tone: 'success' })
      factors.push({ label: `Podbicia zweryfikowanych (${c.supporters})`, points: c.supporters * 2 })
    }
    if (c.bigIdea) tags.push({ label: 'pasuje do budżetu obywatelskiego', tone: 'info' })
    return finish()
  }

  tags.push({ label: countLabel(n, REPORT_FORMS), tone: 'neutral' })
  factors.push({ label: `Liczba zgłoszeń (${n})`, points: Math.min(20, n * 3) })
  if (c.supporters) {
    tags.push({ label: boostLabel(c.supporters), tone: 'success' })
    factors.push({ label: `Podbicia zweryfikowanych (${c.supporters})`, points: Math.min(10, c.supporters) })
  }

  const lc = latestCommitment(c, docs)
  if (lc && status === 'overdue') {
    const m = monthsOverdue(lc.commitment.deadline, now)
    tags.unshift({ label: `plan był na ${romanMonth(lc.commitment.deadline)}`, tone: 'wait' })
    factors.push({ label: `Plan miasta czeka na aktualny termin (${romanMonth(lc.commitment.deadline)})`, points: Math.min(18, 6 + m * 2) })
  } else if (lc && status === 'planned') {
    tags.push({ label: `zaplanowane na ${romanMonth(lc.commitment.deadline)}`, tone: 'info' })
    factors.push({ label: `Naprawa już zaplanowana (${romanMonth(lc.commitment.deadline)})`, points: -6 })
  }
  if (c.factors.transit) {
    tags.push({ label: `${c.factors.transit.trips} kursów ${c.factors.transit.mode} dziennie`, tone: 'neutral' })
    factors.push({ label: `Ruch: ${c.factors.transit.trips} kursów dziennie (GTFS)`, points: Math.min(12, Math.round(c.factors.transit.trips / 20)) })
  }
  if (c.factors.nearby) {
    tags.push({ label: `w pobliżu: ${c.factors.nearby}`, tone: 'neutral' })
    factors.push({ label: `W pobliżu: ${c.factors.nearby}`, points: 8 })
  }
  const first = rs[0]?.createdAt ?? c.createdAt
  const ageMonths = Math.max(0, Math.round((now.getTime() - new Date(first).getTime()) / (30.4 * 86400000)))
  if (ageMonths >= 3) {
    tags.push({ label: `czeka od ${ageMonths} mies.`, tone: 'neutral' })
    factors.push({ label: `Czas oczekiwania (${ageMonths} mies.)`, points: Math.min(8, Math.round(ageMonths / 2)) })
  }
  return finish()
}

/** „9 podbić od zweryfikowanych” */
export function boostLabel(n: number): string {
  return `${n} ${plural(n, ['podbicie', 'podbicia', 'podbić'])} od zweryfikowanych`
}

export const DOC_KIND_LABEL: Record<CityDocument['kind'], string> = {
  interpelacja: 'Interpelacja',
  odpowiedz: 'Odpowiedź urzędu',
  plan: 'Plan remontów',
  komunikat: 'Komunikat',
  protokol: 'Protokół odbioru',
  budzet: 'Budżet obywatelski',
}
