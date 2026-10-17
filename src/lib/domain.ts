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
  overdue: 'Przeterminowane',
  done: 'Remont wykonany',
  resolved: 'Rozwiązane',
}

export interface UrgencyTag {
  label: string
  tone: 'neutral' | 'danger' | 'info' | 'success'
}

export interface Urgency {
  score: number
  tags: UrgencyTag[]
}

/** Pilność z uzasadnieniem. Skala 0–99. */
export function caseUrgency(c: Case, reports: Report[], docs: CityDocument[], now = new Date()): Urgency {
  const rs = caseReports(c, reports)
  const n = rs.length
  const status = caseStatus(c, docs, now)
  const tags: UrgencyTag[] = []
  let score = c.factors.severity

  if (c.type === 'idea') {
    tags.push({ label: `${n} ${plural(n, ['osoba prosi', 'osoby proszą', 'osób prosi'])} o to samo`, tone: 'neutral' })
    const v = rs.filter((r) => r.verified).length
    if (v) tags.push({ label: `${v} ${plural(v, ['zweryfikowana', 'zweryfikowane', 'zweryfikowanych'])}`, tone: 'success' })
    if (c.bigIdea) tags.push({ label: 'pasuje do budżetu obywatelskiego', tone: 'info' })
    return { score: Math.min(99, score + n * 4), tags }
  }

  tags.push({ label: countLabel(n, REPORT_FORMS), tone: 'neutral' })
  score += Math.min(20, n * 3)

  const lc = latestCommitment(c, docs)
  if (lc && status === 'overdue') {
    const m = monthsOverdue(lc.commitment.deadline, now)
    tags.unshift({ label: `obietnica przeterminowana o ${m} mies.`, tone: 'danger' })
    score += Math.min(18, 6 + m * 2)
  } else if (lc && status === 'planned') {
    tags.push({ label: `zaplanowane na ${romanMonth(lc.commitment.deadline)}`, tone: 'info' })
    score -= 6
  }
  if (c.factors.transit) {
    tags.push({ label: `${c.factors.transit.trips} kursów ${c.factors.transit.mode} dziennie`, tone: 'neutral' })
    score += Math.min(12, Math.round(c.factors.transit.trips / 20))
  }
  if (c.factors.nearby) {
    tags.push({ label: `w pobliżu: ${c.factors.nearby}`, tone: 'neutral' })
    score += 8
  }
  const first = rs[0]?.createdAt ?? c.createdAt
  const ageMonths = Math.max(0, Math.round((now.getTime() - new Date(first).getTime()) / (30.4 * 86400000)))
  if (ageMonths >= 3) {
    tags.push({ label: `czeka od ${ageMonths} mies.`, tone: 'neutral' })
    score += Math.min(8, Math.round(ageMonths / 2))
  }
  if (status === 'resolved' || status === 'done') score = Math.min(score, 20)
  return { score: Math.max(1, Math.min(99, score)), tags }
}

export const DOC_KIND_LABEL: Record<CityDocument['kind'], string> = {
  interpelacja: 'Interpelacja',
  odpowiedz: 'Odpowiedź urzędu',
  plan: 'Plan remontów',
  komunikat: 'Komunikat',
  protokol: 'Protokół odbioru',
  budzet: 'Budżet obywatelski',
}
