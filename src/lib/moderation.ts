/**
 * Sprawdzenie treści zgłoszenia (symulacja moderacji AI).
 * Docelowo: LLM z instrukcją moderacji + detektory danych osobowych. Tu: reguły, które zawsze dają przewidywalny wynik.
 * Cel: zgłoszenie trafia do radnych i urzędu, więc bez danych osobowych innych osób, obraźliwych słów, gróźb i reklam.
 */

export type ViolationKind = 'personal' | 'plate' | 'insult' | 'threat' | 'ad'

export interface Violation {
  kind: ViolationKind
  title: string
  why: string
  fragments: string[]
}

export interface Moderation {
  violations: Violation[]
  /** proponowana, poprawiona wersja opisu (pusta, gdy nic sensownego nie zostaje) */
  cleaned: string
}

const INFO: Record<ViolationKind, { title: string; why: string }> = {
  personal: { title: 'Dane osobowe', why: 'Imion, nazwisk, numerów telefonów i adresów e-mail innych osób nie przekazujemy dalej (RODO). Opisz problem, nie osobę.' },
  plate: { title: 'Numer rejestracyjny', why: 'Numer tablicy to dane osobowe. Wystarczy opis, np. „srebrny samochód”.' },
  insult: { title: 'Obraźliwe słowa', why: 'Zgłoszenie czytają radni i urzędnicy. Spokojny opis szybciej prowadzi do rozwiązania.' },
  threat: { title: 'Groźby', why: 'Treści z groźbami nie przekazujemy. Jeśli dzieje się coś niebezpiecznego, zadzwoń pod 112.' },
  ad: { title: 'Reklama', why: 'Zgłoszenia służą sprawom okolicy, nie ofertom handlowym ani linkom.' },
}

const FIRST_NAMES =
  'Jan|Anna|Piotr|Paweł|Krzysztof|Andrzej|Tomasz|Marek|Michał|Marcin|Adam|Grzegorz|Zbigniew|Ryszard|Stanisław|Józef|Kamil|Łukasz|Jakub|Mateusz|Katarzyna|Maria|Agnieszka|Barbara|Ewa|Magdalena|Joanna|Małgorzata|Monika|Krystyna|Zofia|Teresa|Dorota|Beata|Elżbieta'
const UP = 'A-ZĄĆĘŁŃÓŚŹŻ'
const LOW = 'a-ząćęłńóśźż'

const RX: { kind: ViolationKind; rx: RegExp; check?: (m: string) => boolean }[] = [
  // „sąsiad Jan Kowalski”, „pan Nowak”, „Anna Wiśniewska”
  { kind: 'personal', rx: new RegExp(`(?:\\b(?:[Ss]ąsiad(?:ka)?|[Pp]an(?:i)?|[Mm]ieszkan(?:iec|ka))\\s+)?\\b(?:${FIRST_NAMES})\\s+[${UP}][${LOW}]+`, 'g') },
  { kind: 'personal', rx: new RegExp(`\\b(?:[Pp]an(?:i)?|[Ss]ąsiad(?:ka)?)\\s+[${UP}][${LOW}]{2,}`, 'g') },
  { kind: 'personal', rx: /(?:\+48[\s-]?)?\b\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g },
  { kind: 'personal', rx: /\b[\w.+-]+@[\w-]+\.[\w.]+\b/g },
  { kind: 'personal', rx: /\b\d{11}\b/g },
  { kind: 'plate', rx: /\b[A-Z]{2,3}\s?\d[0-9A-Z]{3,4}\b/g, check: (m) => !/^[IVXLC]+\s/.test(m) },
  { kind: 'insult', rx: /\b(?:idiot\w*|debil\w*|kretyn\w*|głup(?:ek|ia|i|ol)\w*|bydl\w*|złodzie\w*|łajda\w*|patol\w*|cham(?:y|em|stwo)?\b|kurw\w*|chuj\w*|pierdol\w*|jeba\w*|spierdal\w*|dupek|frajer\w*|nieroby?\w*)/gi },
  { kind: 'threat', rx: /\b(?:zabij\w*|pobij\w*|podpal\w*|dam mu\s+\w+|policzę się|zemsz\w*|pożałuj\w*)/gi },
  { kind: 'ad', rx: /(?:https?:\/\/\S+|\bwww\.\S+|\bpromocj\w*|\bkup(?:cie|uj)?\s+(?:u mnie|teraz|tanio)|\bkredyt\w*|\bzniżk\w*|\boferta\b)/gi },
]

export function moderate(text: string): Moderation {
  const found = new Map<ViolationKind, Set<string>>()
  for (const { kind, rx, check } of RX) {
    for (const m of text.matchAll(rx)) {
      const frag = m[0].trim()
      if (check && !check(frag)) continue
      if (!found.has(kind)) found.set(kind, new Set())
      found.get(kind)!.add(frag)
    }
  }
  // bez fragmentów zawartych w dłuższych (np. „Sąsiad Jan” w „Sąsiad Jan Kowalski”)
  const violations: Violation[] = [...found.entries()].map(([kind, set]) => {
    const all = [...set]
    return { kind, ...INFO[kind], fragments: all.filter((a) => !all.some((b) => b !== a && b.includes(a))) }
  })
  return { violations, cleaned: violations.length ? clean(text, found) : text }
}

/** Proponowana wersja: bez zdań z reklamą i groźbami, bez danych osobowych i obraźliwych słów */
function clean(text: string, found: Map<ViolationKind, Set<string>>): string {
  const sentences = text.split(/(?<=[.!?])\s+/)
  const has = (s: string, kind: ViolationKind) => [...(found.get(kind) ?? [])].some((f) => s.includes(f))
  const out: string[] = []
  for (const raw of sentences) {
    if (has(raw, 'ad') || has(raw, 'threat')) continue
    let s = raw
    const hadContact = [...(found.get('personal') ?? [])].some((f) => /\d|@/.test(f) && s.includes(f))
    for (const f of found.get('personal') ?? []) s = s.split(f).join(/\d|@/.test(f) ? '' : 'Ktoś')
    for (const f of found.get('plate') ?? []) s = s.split(f).join('')
    // obraźliwe słowo razem z „to …” / „jak …” przed nim
    for (const f of found.get('insult') ?? []) s = s.replace(new RegExp(`[,;]?\\s*(?:to|jak|ten|ta)?\\s*${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi'), '')
    s = s
      .replace(/\s+([,.!?:])/g, '$1')
      .replace(/[:,]\s*([.!?])/g, '$1')
      .replace(/\s{2,}/g, ' ')
      .replace(/(\s*[!?])+$/, '.')
      .trim()
    if (hadContact && s.split(/\s+/).length < 5) continue
    if (s.split(/\s+/).length < 3) continue
    out.push(s.charAt(0).toUpperCase() + s.slice(1))
  }
  return out.join(' ').replace(/\bKtoś\s+Ktoś\b/g, 'Ktoś')
}
