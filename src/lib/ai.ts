/**
 * Symulowane AI zgłoszeń (wersja demonstracyjna).
 * Docelowo: model LLM z obsługą obrazu + osadzenia do łączenia duplikatów (PROJEKT.md, sekcja 7).
 * Tu: reguły słów kluczowych + wyszukiwanie spraw i dokumentów w promieniu. Zawsze zwraca sensowny wynik.
 */
import type { CaseType, LngLat } from './types'
import type { DemoState } from './store'
import { caseReports, caseStatus, latestCommitment, unitById, caseDocuments, isOverdue, visibleDocs } from './domain'
import { distanceM } from './geo'
import { plural, romanMonth, lowerFirst, shortMonth } from './format'

export interface Analysis {
  spam: boolean
  type: CaseType
  category: string
  title: string
  unitId: string
  unitShort: string
  unitName: string
  unitReason: string
  severity: number
  bigIdea: boolean
  targetCaseId: string | null
  /** Ile wcześniejszych zgłoszeń ma sprawa, do której dołączamy */
  similarCount: number
  answer: {
    tone: 'overdue' | 'planned' | 'interpellation' | 'idea' | 'none' | 'done'
    text: string
    docId?: string
  }
}

interface Rule {
  rx: RegExp
  type?: CaseType
  category: string
  title: string
  ideaTitle?: string
  unitId: string
  reason: string
  severity: number
  bigIdea?: boolean
}

const IDEA_RX = /(przydał|brakuje|chciał|chcemy|warto by|można by|prośb|proszę o|propon|fajnie by|postawić|zamontować|potrzebn)/i
const SPAM_RX = /(https?:\/\/|www\.|promocj|kup teraz|zarabiaj|kasyno|bitcoin|kredyt)/i

const RULES: Rule[] = [
  { rx: /(plac zabaw|siłowni|boisk|skatepark|tężni|wybieg dla ps)/i, type: 'idea', category: 'Rekreacja', title: 'Pomysł na rekreację', ideaTitle: 'Nowe miejsce rekreacji', unitId: 'wgk', reason: 'Większe inwestycje osiedlowe realizuje Wydział Gospodarki Komunalnej, także z budżetu obywatelskiego.', severity: 6, bigIdea: true },
  { rx: /ławk/i, category: 'Mała architektura', title: 'Zniszczona ławka', ideaTitle: 'Nowa ławka', unitId: 'wgk', reason: 'Ławki przy miejskich chodnikach i placach należą do Wydziału Gospodarki Komunalnej Urzędu Miasta.', severity: 14 },
  { rx: /(stojak|rower)/i, category: 'Infrastruktura rowerowa', title: 'Problem z infrastrukturą rowerową', ideaTitle: 'Stojak na rowery', unitId: 'mzd', reason: 'Stojaki i drogi rowerowe w pasie drogowym utrzymuje Miejski Zarząd Dróg.', severity: 8 },
  { rx: /(parkuj|zastawi|hałas|pijan|zakłóca|awantur)/i, type: 'problem', category: 'Porządek publiczny', title: 'Naruszenie porządku', unitId: 'sm', reason: 'Sprawy porządku publicznego przyjmuje Straż Miejska.', severity: 14 },
  { rx: /(chodnik|płyt|krawężnik|schod)/i, category: 'Chodnik', title: 'Uszkodzony chodnik', unitId: 'mzd', reason: 'Chodnik leży w pasie drogi miejskiej, więc odpowiada Miejski Zarząd Dróg.', severity: 20 },
  { rx: /(dziur|wyrw|ubyt|asfalt|jezdni|nawierzchn|kolein)/i, category: 'Nawierzchnia jezdni', title: 'Dziura w jezdni', unitId: 'mzd', reason: 'To droga miejska, więc za nawierzchnię odpowiada Miejski Zarząd Dróg.', severity: 32 },
  { rx: /(latarni|lamp|oświetl|ciemno|nie świeci)/i, category: 'Oświetlenie', title: 'Nie działa oświetlenie', ideaTitle: 'Dodatkowe oświetlenie', unitId: 'mzd', reason: 'Oświetlenie ulic i przejść należy do Miejskiego Zarządu Dróg.', severity: 26 },
  { rx: /(graffiti|pomalow|spray|bazgr|dewast|zniszcz|wybit)/i, type: 'problem', category: 'Graffiti i dewastacja', title: 'Dewastacja', unitId: 'sm', reason: 'Akty wandalizmu przyjmuje Straż Miejska, a usunięcie szkód zleca właściciel obiektu.', severity: 10 },
  { rx: /(kosz|śmie|odpad|brud|butelk|zaśmiec)/i, category: 'Czystość', title: 'Śmieci i przepełnione kosze', ideaTitle: 'Nowy kosz na śmieci', unitId: 'mpo', reason: 'Opróżnianie i ustawianie miejskich koszy zleca się Miejskiemu Przedsiębiorstwu Oczyszczania.', severity: 12 },
  { rx: /(studzien|kanaliz|zalan|kałuż|wylewa|woda)/i, category: 'Kanalizacja', title: 'Problem z kanalizacją', unitId: 'wod', reason: 'Studzienki i kanalizacja należą do Toruńskich Wodociągów.', severity: 24 },
  { rx: /(drzew|gałę|gałąź|trawa|krzew|trawnik|zieleń)/i, category: 'Zieleń', title: 'Problem z zielenią', ideaTitle: 'Więcej zieleni', unitId: 'wsie', reason: 'Zieleń miejską utrzymuje Wydział Środowiska i Ekologii Urzędu Miasta.', severity: 12 },
]

const FALLBACK: Rule = {
  rx: /.*/,
  category: 'Inne',
  title: 'Zgłoszenie mieszkańca',
  ideaTitle: 'Pomysł mieszkańca',
  unitId: 'wgk',
  reason: 'Zgłoszenie trafi do Wydziału Gospodarki Komunalnej, który przekaże je właściwej jednostce.',
  severity: 10,
}

const MERGE_RADIUS_M = 150
const NEARBY_DOC_RADIUS_M = 150

export function analyzeReport(description: string, location: LngLat, s: DemoState, now = new Date()): Analysis {
  const text = description.trim()
  const rule = RULES.find((r) => r.rx.test(text)) ?? FALLBACK
  const type: CaseType = rule.type ?? (IDEA_RX.test(text) ? 'idea' : 'problem')
  const unit = unitById(rule.unitId)
  const spam = SPAM_RX.test(text) || text.length < 4
  const title = type === 'idea' ? (rule.ideaTitle ?? 'Pomysł mieszkańca') : rule.title

  // szukamy otwartej sprawy tej samej kategorii w promieniu
  let target: (typeof s.cases)[number] | null = null
  let bestD = Infinity
  for (const c of s.cases) {
    if (c.category !== rule.category || c.type !== type) continue
    const st = caseStatus(c, s.documents, now)
    if (st === 'resolved') continue
    const d = distanceM(location, c.location)
    if (d < MERGE_RADIUS_M && d < bestD) {
      bestD = d
      target = c
    }
  }

  // przy dołączaniu do sprawy adresat jest ten sam co w sprawie
  const finalUnit = target ? unitById(target.unitId) : unit
  const base = {
    spam,
    type,
    category: rule.category,
    title,
    unitId: finalUnit.id,
    unitShort: finalUnit.short,
    unitName: finalUnit.name,
    unitReason: target?.unitReason ?? rule.reason,
    severity: rule.severity,
    bigIdea: !!(rule.bigIdea || target?.bigIdea),
    targetCaseId: target?.id ?? null,
    similarCount: target ? caseReports(target, s.reports).length : 0,
  }

  return { ...base, answer: composeAnswer(base, target, location, s, now) }
}

function composeAnswer(
  a: Omit<Analysis, 'answer'>,
  target: DemoState['cases'][number] | null,
  location: LngLat,
  s: DemoState,
  now: Date,
): Analysis['answer'] {
  const forward = `Adresat: ${a.unitName}. Sprawę widzą też radni okręgu.`

  if (a.type === 'idea') {
    const n = a.similarCount + 1
    const people = `${n} ${plural(n, ['osoba prosi', 'osoby proszą', 'osób prosi'])} o to samo.`
    const prior = target ? caseDocuments(target, s.documents).find((d) => d.kind === 'interpelacja') : undefined
    const priorText = prior ? ` Radny okręgu pytał o to już w ${shortMonth(prior.date)}, ale urząd nie podał terminu.` : ''
    const bo = a.bigIdea
      ? ' To większa inwestycja, więc możesz ją też zgłosić do budżetu obywatelskiego 2027 (nabór do 30 listopada 2026 r.).'
      : ''
    const head = n > 1 ? people : 'To pierwszy taki pomysł w tym miejscu.'
    return {
      tone: 'idea',
      text: `${head}${priorText} Adresat prośby: ${a.unitName}.${bo}`,
      docId: prior?.id ?? (a.bigIdea ? 'd-bo-2027' : undefined),
    }
  }

  if (target) {
    const st = caseStatus(target, s.documents, now)
    const lc = latestCommitment(target, s.documents)
    if (lc && st === 'overdue') {
      return {
        tone: 'overdue',
        text: `Miasto planowało tu: ${lowerFirst(lc.commitment.text)} do ${romanMonth(lc.commitment.deadline)}. Prace jeszcze się nie odbyły, więc przekazujemy sprawę radnym okręgu, którzy zapytają o aktualny termin.`,
        docId: lc.doc.id,
      }
    }
    if (lc && st === 'planned') {
      return {
        tone: 'planned',
        text: `Naprawa jest już w planach miasta: ${lowerFirst(lc.commitment.text)}, termin ${romanMonth(lc.commitment.deadline)}. Powiadomimy Cię o postępach.`,
        docId: lc.doc.id,
      }
    }
    if (st === 'done') {
      return { tone: 'done', text: `W tym miejscu niedawno zakończono remont. Twoje zgłoszenie trafia do urzędu jako możliwa usterka gwarancyjna.` }
    }
    const interp = caseDocuments(target, s.documents).find((d) => d.kind === 'interpelacja')
    if (interp) {
      return { tone: 'interpellation', text: `Radny okręgu złożył już w tej sprawie interpelację (${shortMonth(interp.date)}). ${forward}`, docId: interp.id }
    }
  }

  // dokumenty z terminem w pobliżu, nawet spoza sprawy — tylko na ten sam temat
  const docCategory = (d: DemoState['documents'][number]) =>
    s.cases.find((c) => c.documentIds.includes(d.id))?.category ?? RULES.find((r) => r.rx.test(`${d.title} ${d.summary}`))?.category
  const near = visibleDocs(s.documents)
    .filter((d) => d.commitment && distanceM(location, d.location) < NEARBY_DOC_RADIUS_M && docCategory(d) === a.category)
    .sort((x, y) => distanceM(location, x.location) - distanceM(location, y.location))[0]
  if (near?.commitment) {
    const over = isOverdue(near.commitment, now)
    return {
      tone: over ? 'overdue' : 'planned',
      text: over
        ? `Niedaleko miasto planowało: ${lowerFirst(near.commitment.text)} do ${romanMonth(near.commitment.deadline)}. Zapytamy o aktualny termin. ${forward}`
        : `Niedaleko trwają przygotowania: ${lowerFirst(near.commitment.text)}, termin ${romanMonth(near.commitment.deadline)}. ${forward}`,
      docId: near.id,
    }
  }

  return { tone: 'none', text: `Nie znaleźliśmy planów miasta dla tego miejsca. ${forward}` }
}
