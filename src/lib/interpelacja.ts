/**
 * Szkic interpelacji (symulacja modelu LLM z szablonem).
 * Buduje tekst z przypisami [1], [2]… do zgłoszeń i dokumentów miasta z danego miejsca.
 */
import type { Case, CityDocument, Report } from './types'
import { caseDocuments, caseReports, caseStatus, latestCommitment, monthsOverdue, unitById, DOC_KIND_LABEL } from './domain'
import { countLabel, formatDate, lowerFirst, plural, REPORT_FORMS, romanMonth, shortMonth } from './format'

export interface Source {
  n: number
  label: string
  url?: string
}

export interface Draft {
  text: string
  sources: Source[]
}

export const COUNCILLOR = {
  name: 'Anna Przykładowa',
  role: 'Radna Miasta Torunia, okręg Rubinkowo',
  initials: 'AP',
  note: 'postać fikcyjna na potrzeby demo',
}

export function draftInterpellation(c: Case, reports: Report[], docs: CityDocument[], now = new Date()): Draft {
  const rs = caseReports(c, reports)
  const ds = caseDocuments(c, docs)
  const status = caseStatus(c, docs, now)
  const lc = latestCommitment(c, docs)
  const unit = unitById(c.unitId)
  const sources: Source[] = []
  const cite = (label: string, url?: string) => {
    sources.push({ n: sources.length + 1, label, url })
    return `[${sources.length}]`
  }

  const verified = rs.filter((r) => r.verified).length
  const first = rs[0]?.createdAt ?? c.createdAt
  const reportsRef = cite(
    `Głos Osiedla: ${countLabel(rs.length, REPORT_FORMS)} mieszkańców (${verified} od zweryfikowanych mieszkańców), ${shortMonth(first)}–${shortMonth(now.toISOString())}, ze zdjęciami`,
  )

  const lines: string[] = []
  const isIdea = c.type === 'idea'
  lines.push(`Interpelacja w sprawie: ${lowerFirst(c.title)} (${c.place}, osiedle Rubinkowo)`)
  lines.push('')
  lines.push('Szanowny Panie Prezydencie,')
  lines.push('')
  if (isIdea) {
    lines.push(
      `zwracam się w imieniu mieszkańców osiedla Rubinkowo z prośbą dotyczącą: ${lowerFirst(c.title)} (${c.place}). Od ${formatDate(first)} o to samo poprosiło ${rs.length} ${plural(rs.length, ['osoba', 'osoby', 'osób'])} ${reportsRef}.`,
    )
  } else {
    lines.push(
      `zwracam się w imieniu mieszkańców osiedla Rubinkowo w sprawie problemu: ${lowerFirst(c.title)} (${c.place}). Od ${formatDate(first)} mieszkańcy zgłosili go ${rs.length} ${plural(rs.length, ['raz', 'razy', 'razy'])} ${reportsRef}.`,
    )
  }

  const context: string[] = []
  if (c.factors.transit) {
    const ref = cite(`Rozkład jazdy komunikacji miejskiej w Toruniu (GTFS), przystanek w pobliżu: ${c.place}`, 'https://mkuran.pl/gtfs/torun.zip')
    context.push(`przez to miejsce przejeżdża ${c.factors.transit.trips} kursów ${c.factors.transit.mode} dziennie ${ref}`)
  }
  if (c.factors.nearby) context.push(`w pobliżu znajduje się ${c.factors.nearby}`)
  if (context.length) {
    lines.push('')
    lines.push(`Sprawa jest istotna dla bezpieczeństwa i codziennego życia mieszkańców: ${context.join(', a ')}.`)
  }

  const priorInterp = ds.find((d) => d.kind === 'interpelacja')
  if (lc) {
    const commitRef = cite(`${DOC_KIND_LABEL[lc.doc.kind]}: „${lc.doc.title}”, ${formatDate(lc.doc.date)}, BIP Toruń`, lc.doc.url)
    let sentence = ''
    if (priorInterp && priorInterp.id !== lc.doc.id) {
      const pRef = cite(`Interpelacja: „${priorInterp.title}”, ${formatDate(priorInterp.date)}, BIP Toruń`, priorInterp.url)
      sentence = `W odpowiedzi na interpelację z ${formatDate(priorInterp.date)} ${pRef} zapowiedziano: ${lowerFirst(lc.commitment.text)} do ${romanMonth(lc.commitment.deadline)} ${commitRef}.`
    } else {
      sentence = `Miasto zapowiedziało: ${lowerFirst(lc.commitment.text)} do ${romanMonth(lc.commitment.deadline)} ${commitRef}.`
    }
    if (status === 'overdue') {
      const m = monthsOverdue(lc.commitment.deadline, now)
      sentence += ` Termin minął ${m} ${plural(m, ['miesiąc', 'miesiące', 'miesięcy'])} temu, a prace nie zostały wykonane.`
    }
    lines.push('')
    lines.push(sentence)
  } else if (priorInterp) {
    const pRef = cite(`Interpelacja: „${priorInterp.title}”, ${formatDate(priorInterp.date)}, BIP Toruń`, priorInterp.url)
    const resp = ds.find((d) => d.kind === 'odpowiedz')
    const rRef = resp ? ` ${cite(`Odpowiedź urzędu: „${resp.title}”, ${formatDate(resp.date)}, BIP Toruń`, resp.url)}` : ''
    lines.push('')
    lines.push(`Sprawa była już przedmiotem interpelacji z ${formatDate(priorInterp.date)} ${pRef}. W odpowiedzi${rRef} nie wskazano terminu realizacji.`)
  }

  lines.push('')
  lines.push('W związku z powyższym proszę o odpowiedź na pytania:')
  if (status === 'overdue') {
    lines.push('1. Z jakiego powodu nie dotrzymano zapowiedzianego terminu?')
    lines.push('2. W jakim terminie prace zostaną wykonane i czy zabezpieczono na nie środki?')
    lines.push('3. Jakie działania doraźne zostaną podjęte do czasu naprawy?')
  } else if (isIdea) {
    lines.push(`1. Czy ${unit.name} może zrealizować tę prośbę i w jakim terminie?`)
    lines.push('2. Jaki byłby szacunkowy koszt realizacji?')
    lines.push(c.bigIdea ? '3. Czy miasto wesprze mieszkańców w zgłoszeniu projektu do budżetu obywatelskiego 2027?' : '3. Czy podobne rozwiązania są planowane w innych częściach osiedla?')
  } else {
    lines.push(`1. Kiedy ${unit.name} usunie zgłoszony problem?`)
    lines.push('2. Czy naprawa jest ujęta w planie prac na bieżący lub przyszły rok?')
    lines.push('3. Jakie działania doraźne zostaną podjęte do czasu naprawy?')
  }
  lines.push('')
  lines.push('Z poważaniem')
  lines.push(COUNCILLOR.name)
  lines.push(COUNCILLOR.role)
  lines.push('')
  lines.push('Przypisy:')
  for (const s of sources) lines.push(`[${s.n}] ${s.label}${s.url ? ` (${s.url})` : ''}`)

  return { text: lines.join('\n'), sources }
}
