/**
 * Ślad działania AI — pokazuje, co robi każdy etap potoku, jaką technologią i z jakim wynikiem.
 * W wersji demonstracyjnej wartości (pewność, podobieństwo, trafność) są symulowane deterministycznie,
 * ale struktura odpowiada docelowemu potokowi (PROJEKT.md, sekcja 7) i można ją 1:1 zasilić prawdziwym backendem.
 */
import type { Case, CityDocument } from './types'
import type { DemoState } from './store'
import type { Analysis } from './ai'
import { caseDocuments, caseReports, caseUrgency, unitById } from './domain'
import { districtName } from './geo'
import { countLabel, REPORT_FORMS } from './format'

export type TechId = 'stt' | 'vlm' | 'llm' | 'emb' | 'postgis' | 'rag' | 'score' | 'gtfs'

export const TECH: Record<TechId, { label: string; detail: string }> = {
  stt: { label: 'Mowa → tekst', detail: 'model rozpoznawania mowy (np. Whisper)' },
  vlm: { label: 'Model wizyjny', detail: 'LLM z obsługą obrazu' },
  llm: { label: 'LLM', detail: 'ekstrakcja do JSON, odpowiedzi, szkice' },
  emb: { label: 'Embeddingi', detail: 'osadzenia tekstu i obrazu w pgvector' },
  postgis: { label: 'PostGIS', detail: 'zapytania przestrzenne (ST_DWithin)' },
  rag: { label: 'RAG · BIP', detail: 'wyszukiwanie w dokumentach miasta' },
  score: { label: 'Scoring', detail: 'model punktowy pilności' },
  gtfs: { label: 'GTFS · OSM', detail: 'rozkład jazdy i mapa jako dane' },
}

export interface TraceStep {
  id: string
  title: string
  tech: TechId[]
  /** wynik etapu prostym językiem — to widzi mieszkaniec (bez procentów i szczegółów technicznych) */
  short: string
  ms: number
  skipped?: boolean
}

/** Deterministyczna „losowość” z tekstu: te same dane → te same liczby */
function seeded(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return (min: number, max: number) => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    const x = ((h ^= h >>> 16) >>> 0) / 4294967296
    return min + x * (max - min)
  }
}

/** Co widać na zdjęciu — opis zrozumiały dla mieszkańca */
const VISION: Record<string, string> = {
  'Nawierzchnia jezdni': 'ubytek w nawierzchni jezdni',
  Chodnik: 'uszkodzony chodnik',
  Oświetlenie: 'niedziałające oświetlenie',
  'Bezpieczeństwo ruchu': 'przejście dla pieszych',
  'Graffiti i dewastacja': 'pomalowaną powierzchnię',
  Czystość: 'przepełniony kosz i śmieci',
  Kanalizacja: 'zastoisko wody przy studzience',
  'Mała architektura': 'miejsce na ławkę',
  Rekreacja: 'wolny teren zielony',
  'Infrastruktura rowerowa': 'miejsce na stojak rowerowy',
  Zieleń: 'drzewa i zieleń',
}

export interface TraceInput {
  description: string
  photo: string
  usedMic: boolean
  place: string
}

const MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
const docShort = (d: CityDocument) => {
  const kind = { interpelacja: 'interpelacja radnego', odpowiedz: 'odpowiedź urzędu', plan: 'plan remontów', komunikat: 'komunikat', protokol: 'protokół odbioru', budzet: 'budżet obywatelski' }[d.kind]
  const dt = new Date(d.date)
  return `${kind} (${MONTHS[dt.getMonth()]} ${dt.getFullYear()})`
}

/** Ślad analizy pojedynczego zgłoszenia (widok mieszkańca) — prosty język, bez liczb technicznych */
export function reportTrace(input: TraceInput, a: Analysis, s: DemoState): TraceStep[] {
  const rnd = seeded(input.description + a.category)
  const hasPhoto = !input.photo.endsWith('zastepcze.svg')
  const steps: TraceStep[] = []

  if (input.usedMic) {
    steps.push({ id: 'stt', title: 'Zamiana mowy na tekst', tech: ['stt'], short: 'Twoje nagranie zamieniliśmy na tekst.', ms: Math.round(rnd(380, 620)) })
  }

  steps.push(
    hasPhoto
      ? { id: 'vlm', title: 'Rozpoznanie zdjęcia', tech: ['vlm'], short: `Na zdjęciu widać ${VISION[a.category] ?? 'przestrzeń publiczną'}.`, ms: Math.round(rnd(700, 1100)) }
      : { id: 'vlm', title: 'Rozpoznanie zdjęcia', tech: ['vlm'], short: 'Bez zdjęcia — oceniliśmy sam opis.', ms: 0, skipped: true },
  )

  steps.push({
    id: 'llm',
    title: 'Zrozumienie opisu',
    tech: ['llm'],
    short: a.type === 'idea' ? `To pomysł na okolicę: ${a.category.toLowerCase()}.` : `To problem: ${a.category.toLowerCase()}.`,
    ms: Math.round(rnd(600, 900)),
  })

  const v = a.moderation.violations
  steps.push({
    id: 'mod',
    title: 'Sprawdzenie treści',
    tech: ['llm'],
    short: v.length ? `Do poprawy: ${v.map((x) => x.title.toLowerCase()).join(', ')}.` : 'Bez uwag: nie ma danych osobowych ani obraźliwych słów.',
    ms: Math.round(rnd(300, 500)),
  })

  const target = a.targetCaseId ? s.cases.find((c) => c.id === a.targetCaseId) : null
  steps.push({
    id: 'dup',
    title: 'Podobne zgłoszenia w okolicy',
    tech: ['emb', 'postgis'],
    short:
      target && a.similarCount > 0
        ? `To miejsce zgłaszano już ${countLabel(a.similarCount, ['raz', 'razy', 'razy']).replace(/^1 raz$/, 'raz')}. Połączyliśmy wszystko w jedną sprawę.`
        : 'To pierwsze takie zgłoszenie w tym miejscu.',
    ms: Math.round(rnd(150, 300)),
  })

  const docs: CityDocument[] = target ? caseDocuments(target, s.documents) : []
  steps.push({
    id: 'rag',
    title: 'Dokumenty i plany miasta',
    tech: ['rag'],
    short: docs.length
      ? `Znaleźliśmy: ${docs.slice(-3).reverse().map(docShort).join(', ')}${docs.length > 3 ? ` oraz ${docs.length - 3} ${docs.length - 3 === 1 ? 'inny dokument' : 'inne dokumenty'}` : ''}.`
      : 'Nie znaleźliśmy planów miasta dla tego miejsca.',
    ms: Math.round(rnd(400, 700)),
  })

  steps.push({ id: 'route', title: 'Kto się tym zajmie', tech: ['llm'], short: `Sprawa trafia do: ${a.unitName}.`, ms: Math.round(rnd(500, 800)) })

  if (target) {
    const u = caseUrgency(target, s.reports, s.documents)
    const level = u.score >= 75 ? 'wysoka' : u.score >= 45 ? 'średnia' : 'niska'
    const reasons = plainReasons(u.factors)
    const finished = u.factors.some((f) => f.label.startsWith('Sprawa wykonana'))
    steps.push({
      id: 'score',
      title: 'Jak pilna jest sprawa',
      tech: ['score', 'gtfs'],
      short: finished
        ? 'Pilność niska: prace w tym miejscu zostały już wykonane.'
        : reasons.length
          ? `Pilność ${level}: ${reasons.join(', ')}.`
          : `Pilność ${level}.`,
      ms: Math.round(rnd(60, 120)),
    })
  }
  return steps
}

/** Najważniejsze powody pilności, opisane po ludzku (bez punktów) */
function plainReasons(factors: { label: string; points: number }[]): string[] {
  const map: [RegExp, (l: string) => string][] = [
    [/^Liczba zgłoszeń|^Liczba próśb/, () => 'wielu mieszkańców to zgłasza'],
    [/^Podbicia/, () => 'inni mieszkańcy popierają sprawę'],
    [/^Plan miasta czeka/, () => 'miasto planowało tu prace'],
    [/^Ruch:/, () => 'ruchliwe miejsce'],
    [/^W pobliżu: (.+?)( \(|$)/, (l) => `blisko: ${l.match(/^W pobliżu: (.+?)( \(|$)/)?.[1] ?? ''}`],
    [/^Czas oczekiwania/, () => 'sprawa czeka od dawna'],
  ]
  return factors
    .filter((f) => f.points > 0)
    .map((f) => ({ f, m: map.find(([rx]) => rx.test(f.label)) }))
    .filter((x) => x.m)
    .sort((x, y) => y.f.points - x.f.points)
    .slice(0, 3)
    .map((x) => x.m![1](x.f.label))
}

/** Rozbicie pilności na czynniki (do wykresu) — te same składniki, z których liczony jest wynik */
export function urgencyBreakdown(c: Case, s: DemoState): { label: string; points: number }[] {
  return caseUrgency(c, s.reports, s.documents).factors
}

/** Podsumowanie sprawy „napisane przez AI” z treści zgłoszeń (widok radnego) */
export function caseSummary(c: Case, s: DemoState): { text: string; similarity: number; keywords: string[] } {
  const rs = caseReports(c, s.reports)
  const rnd = seeded(c.id)
  const words = rs
    .flatMap((r) => r.description.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/))
    .filter((w) => w.length > 5)
  const freq = new Map<string, number>()
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1)
  const keywords = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([w]) => w)
  const verified = rs.filter((r) => r.verified).length
  const unit = unitById(c.unitId)
  const text =
    c.type === 'idea'
      ? `Mieszkańcy osiedla ${districtName(c.district)} proszą o to samo: ${c.title.toLowerCase()} (${c.place}). Próśb: ${rs.length}, w tym ${verified} od zweryfikowanych mieszkańców. Właściwa jednostka: ${unit.name}.`
      : `Mieszkańcy opisują ten sam problem: ${c.title.toLowerCase()} (${c.place}). ${countLabel(rs.length, REPORT_FORMS)}, w tym ${verified} od zweryfikowanych mieszkańców. Najczęstsze słowa w opisach: ${keywords.slice(0, 3).join(', ') || 'brak'}. Właściwa jednostka: ${unit.name}.`
  return { text, similarity: rnd(0.84, 0.94), keywords }
}
