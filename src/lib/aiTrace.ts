/**
 * Ślad działania AI — pokazuje, co robi każdy etap potoku, jaką technologią i z jakim wynikiem.
 * W wersji demonstracyjnej wartości (pewność, podobieństwo, trafność) są symulowane deterministycznie,
 * ale struktura odpowiada docelowemu potokowi (PROJEKT.md, sekcja 7) i można ją 1:1 zasilić prawdziwym backendem.
 */
import type { Case, CityDocument } from './types'
import type { DemoState } from './store'
import type { Analysis } from './ai'
import { caseDocuments, caseReports, caseUrgency, unitById } from './domain'
import { distanceM, districtName } from './geo'
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
  /** krótki wynik do animacji „AI analizuje” */
  short: string
  /** szczegóły do rozwinięcia */
  lines: { label: string; value: string; bar?: number }[]
  code?: string
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

const pct = (x: number) => `${Math.round(x * 100)}%`

const VISION: Record<string, string[]> = {
  'Nawierzchnia jezdni': ['ubytek w nawierzchni', 'jezdnia asfaltowa', 'zatoka autobusowa'],
  Chodnik: ['pęknięte płyty chodnikowe', 'ciąg pieszy', 'krawężnik'],
  Oświetlenie: ['latarnia uliczna', 'przejście dla pieszych', 'słabe oświetlenie'],
  'Bezpieczeństwo ruchu': ['przejście dla pieszych', 'oznakowanie poziome', 'słaba widoczność'],
  'Graffiti i dewastacja': ['graffiti', 'wiata przystankowa', 'powierzchnia malowana'],
  Czystość: ['przepełniony kosz', 'odpady', 'teren zielony'],
  Kanalizacja: ['studzienka kanalizacyjna', 'zastoisko wody', 'jezdnia'],
  'Mała architektura': ['trawnik przed budynkiem', 'chodnik', 'brak ławki'],
  Rekreacja: ['wolny teren zielony', 'zabudowa mieszkaniowa', 'chodnik'],
  'Infrastruktura rowerowa': ['rower', 'wejście do sklepu', 'brak stojaka'],
  Zieleń: ['drzewo', 'gałęzie', 'chodnik'],
}

export interface TraceInput {
  description: string
  photo: string
  usedMic: boolean
  place: string
}

/** Ślad analizy pojedynczego zgłoszenia (widok mieszkańca) */
export function reportTrace(input: TraceInput, a: Analysis, s: DemoState): TraceStep[] {
  const rnd = seeded(input.description + a.category)
  const hasPhoto = !input.photo.endsWith('zastepcze.svg')
  const steps: TraceStep[] = []

  if (input.usedMic) {
    steps.push({
      id: 'stt',
      title: 'Zamiana mowy na tekst',
      tech: ['stt'],
      short: `Rozpoznano ${input.description.split(/\s+/).length} słów · pewność ${pct(rnd(0.93, 0.98))}`,
      lines: [
        { label: 'Język', value: 'polski' },
        { label: 'Pewność transkrypcji', value: pct(rnd(0.93, 0.98)), bar: rnd(0.93, 0.98) },
      ],
      ms: Math.round(rnd(380, 620)),
    })
  }

  const labels = VISION[a.category] ?? ['przestrzeń publiczna', 'ulica', 'zabudowa']
  const confs = [rnd(0.88, 0.97), rnd(0.74, 0.9), rnd(0.6, 0.8)]
  steps.push(
    hasPhoto
      ? {
          id: 'vlm',
          title: 'Rozpoznanie zdjęcia',
          tech: ['vlm'],
          short: `Wykryto: ${labels[0]} · ${pct(confs[0])}`,
          lines: [
            ...labels.map((l, i) => ({ label: l, value: pct(confs[i]), bar: confs[i] })),
            { label: 'Twarze / tablice rejestracyjne', value: 'nie wykryto' },
          ],
          ms: Math.round(rnd(700, 1100)),
        }
      : { id: 'vlm', title: 'Rozpoznanie zdjęcia', tech: ['vlm'], short: 'Brak zdjęcia — analiza samego opisu', lines: [], ms: 0, skipped: true },
  )

  const json = {
    typ: a.type === 'idea' ? 'pomysł' : 'problem',
    kategoria: a.category,
    miejsce: input.place,
    adresat: a.unitShort,
    spam: a.spam,
  }
  steps.push({
    id: 'llm',
    title: 'Zrozumienie opisu',
    tech: ['llm'],
    short: `${json.typ === 'pomysł' ? 'Pomysł' : 'Problem'} · ${a.category}`,
    lines: [
      { label: 'Rodzaj', value: json.typ },
      { label: 'Kategoria', value: a.category },
      { label: 'Spam / treść niezwiązana', value: a.spam ? 'tak' : 'nie' },
    ],
    code: JSON.stringify(json, null, 2),
    ms: Math.round(rnd(600, 900)),
  })

  const target = a.targetCaseId ? s.cases.find((c) => c.id === a.targetCaseId) : null
  const nearSame = s.cases
    .filter((c) => c.category === a.category && c.id !== a.targetCaseId)
    .map((c) => ({ c, d: distanceM(target?.location ?? s.cases[0].location, c.location) }))
    .sort((x, y) => x.d - y.d)
    .slice(0, 2)
  const sim = rnd(0.86, 0.95)
  steps.push({
    id: 'dup',
    title: 'Szukanie podobnych zgłoszeń',
    tech: ['emb', 'postgis'],
    short: target ? `Podobna sprawa w ${Math.round(rnd(8, 40))} m · podobieństwo ${pct(sim)}` : 'Brak podobnych w promieniu 150 m',
    lines: target
      ? [
          { label: `„${target.title}” (${a.similarCount} zgł.)`, value: pct(sim), bar: sim },
          ...nearSame.map(({ c, d }) => {
            const v = Math.max(0.2, sim - 0.25 - d / 4000)
            return { label: `„${c.title}”, ${Math.round(d)} m`, value: pct(v), bar: v }
          }),
          { label: 'Decyzja', value: 'połączono w jedną sprawę' },
        ]
      : [{ label: 'Decyzja', value: 'nowa sprawa' }],
    code: `SELECT id FROM cases\nWHERE ST_DWithin(geom, :punkt, 150)\nORDER BY embedding <=> :wektor_opisu\nLIMIT 3;`,
    ms: Math.round(rnd(150, 300)),
  })

  const docs: CityDocument[] = target ? caseDocuments(target, s.documents) : []
  steps.push({
    id: 'rag',
    title: 'Sprawdzenie dokumentów miasta',
    tech: ['rag'],
    short: docs.length ? `Znaleziono ${docs.length} dokument${docs.length === 1 ? '' : docs.length < 5 ? 'y' : 'ów'} z BIP` : 'Brak planów dla tego miejsca',
    lines: docs.length
      ? docs.map((d, i) => {
          const r = Math.max(0.55, rnd(0.82, 0.95) - i * 0.06)
          return { label: d.title, value: pct(r), bar: r }
        })
      : [{ label: 'Przeszukano', value: `${s.documents.filter((d) => !d.hidden).length} dokumentów` }],
    ms: Math.round(rnd(400, 700)),
  })

  steps.push({
    id: 'route',
    title: 'Adresat i odpowiedź dla mieszkańca',
    tech: ['llm'],
    short: `Adresat: ${a.unitShort}`,
    lines: [
      { label: 'Jednostka', value: a.unitName },
      { label: 'Uzasadnienie', value: a.unitReason },
      { label: 'Odpowiedź oparta na źródłach', value: a.answer.docId ? '1 dokument z BIP' : 'brak planów — informacja wprost' },
    ],
    ms: Math.round(rnd(500, 800)),
  })

  if (target) {
    const u = caseUrgency(target, s.reports, s.documents)
    steps.push({
      id: 'score',
      title: 'Ocena pilności',
      tech: ['score', 'gtfs'],
      short: `Pilność ${u.score}/99`,
      lines: urgencyBreakdown(target, s).map((f) => ({ label: f.label, value: f.points >= 0 ? `+${f.points}` : `−${-f.points}`, bar: Math.max(0, f.points / 40) })),
      ms: Math.round(rnd(60, 120)),
    })
  }
  return steps
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
