import { Fragment } from 'react'
import { TechChip } from '../components/AiTrace'
import { IconChevron, IconSparkle, IconX } from '../components/icons'
import type { TechId } from '../lib/aiTrace'

/** Czy pokazywać kolumnę „Stan w demo”. Uczciwie wobec jury: co działa, a co jest symulowane. */
const SHOW_DEMO_STATUS = true

const LIVE: { title: string; detail: string; tech: TechId[] }[] = [
  { title: 'Zdjęcie i głos', detail: 'bez logowania, lokalizacja z telefonu', tech: [] },
  { title: 'Mowa → tekst', detail: 'dyktowany opis', tech: ['stt'] },
  { title: 'Analiza zdjęcia', detail: 'co jest na zdjęciu, twarze i tablice', tech: ['vlm'] },
  { title: 'Ekstrakcja do JSON', detail: 'problem czy pomysł, kategoria, miejsce', tech: ['llm'] },
  { title: 'Duplikaty w promieniu', detail: '150 m + podobieństwo opisu i zdjęcia', tech: ['emb', 'postgis'] },
  { title: 'Plany miasta', detail: 'interpelacje, odpowiedzi, plany remontów', tech: ['rag'] },
  { title: 'Pilność', detail: 'zgłoszenia, ruch, szkoły, podbicia', tech: ['score', 'gtfs'] },
]

const DOCS: { title: string; detail: string; tech: TechId[] }[] = [
  { title: 'BIP Toruń', detail: 'interpelacje i odpowiedzi (PDF)', tech: [] },
  { title: 'PDF → tekst', detail: 'OCR, czyszczenie', tech: [] },
  { title: 'Ekstrakcja', detail: 'temat, miejsca, zobowiązanie, termin', tech: ['llm'] },
  { title: 'Geokodowanie', detail: 'odmiana nazw ulic → PRG i OSM', tech: ['postgis'] },
  { title: 'Baza wiedzy', detail: 'PostGIS + pgvector', tech: ['emb'] },
]

type Status = 'działa' | 'symulacja' | 'plan'
const STACK: { layer: string; tech: string; status: Status }[] = [
  { layer: 'Aplikacja (PWA)', tech: 'React, Vite, TypeScript, Tailwind CSS', status: 'działa' },
  { layer: 'Mapa', tech: 'MapLibre GL, OpenFreeMap, OpenStreetMap', status: 'działa' },
  { layer: 'Dane miejsc', tech: 'OSM (Overpass, Nominatim), docelowo PRG', status: 'działa' },
  { layer: 'Backend', tech: 'Python, FastAPI', status: 'plan' },
  { layer: 'Baza danych', tech: 'PostgreSQL + PostGIS + pgvector', status: 'plan' },
  { layer: 'Analiza zgłoszeń', tech: 'LLM z obsługą obrazu, ekstrakcja do JSON', status: 'symulacja' },
  { layer: 'Mowa → tekst', tech: 'model rozpoznawania mowy (np. Whisper)', status: 'symulacja' },
  { layer: 'Duplikaty', tech: 'embeddingi tekstu i obrazu + promień PostGIS', status: 'symulacja' },
  { layer: 'Plany miasta', tech: 'RAG nad dokumentami BIP', status: 'symulacja' },
  { layer: 'Pilność', tech: 'model punktowy + GTFS (rozkład jazdy) + OSM', status: 'działa' },
  { layer: 'Szkic interpelacji', tech: 'LLM + szablon + przypisy do źródeł', status: 'symulacja' },
  { layer: 'Weryfikacja', tech: 'mObywatel przez integratora, docelowo EUDI Wallet', status: 'symulacja' },
]

const STATUS_CLS: Record<Status, string> = {
  działa: 'bg-st-done-bg text-st-done',
  symulacja: 'bg-st-new-bg text-st-new',
  plan: 'bg-st-planned-bg text-st-planned',
}

function Flow({ items }: { items: { title: string; detail: string; tech: TechId[] }[] }) {
  return (
    <div className="flex flex-wrap items-stretch gap-y-3">
      {items.map((it, i) => (
        <Fragment key={it.title}>
          <div className="flex w-[150px] flex-col gap-1.5 rounded-[12px] border border-line bg-surface p-2.5">
            <div className="text-[14px] font-bold leading-5">{it.title}</div>
            <div className="text-[12px] leading-4 text-ink-2">{it.detail}</div>
            {it.tech.length > 0 && (
              <div className="mt-auto flex flex-wrap gap-1">
                {it.tech.map((t) => (
                  <TechChip key={t} id={t} small />
                ))}
              </div>
            )}
          </div>
          {i < items.length - 1 && (
            <div className="flex w-6 items-center justify-center text-ink-2" aria-hidden="true">
              <IconChevron size={18} strokeWidth={2.4} />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  )
}

export function AiArchitectureModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-[clamp(12px,3vw,32px)]" role="dialog" aria-modal="true" aria-labelledby="ai-title">
      <div className="flex max-h-full w-full max-w-[1180px] flex-col overflow-hidden rounded-[20px] bg-canvas shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line bg-surface px-7 pt-5 pb-4">
          <div>
            <h2 id="ai-title" className="flex items-center gap-2 text-h1 font-bold">
              <IconSparkle size={26} className="text-brand" /> Jak działa AI w Głosie Osiedla
            </h2>
            <p className="mt-1 text-[16px] text-ink-2">AI porządkuje zgłoszenia i łączy je z planami miasta. Każda odpowiedź ma źródło, a decyzje podejmują ludzie.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Zamknij" className="flex size-12 shrink-0 items-center justify-center rounded-btn hover:bg-canvas">
            <IconX size={22} />
          </button>
        </div>
        <div className="flex min-h-0 flex-col gap-6 overflow-y-auto px-7 py-6">
          <section>
            <h3 className="mb-3 text-[18px] font-bold">Zgłoszenie na żywo (ok. 3 s)</h3>
            <Flow items={LIVE} />
            <div className="mt-3 flex flex-wrap gap-2 text-[14px]">
              <span className="rounded-full bg-surface px-3 py-1 font-bold">→ Mieszkaniec: odpowiedź od razu, ze źródłem</span>
              <span className="rounded-full bg-surface px-3 py-1 font-bold">→ Radni: lista według pilności i szkic interpelacji</span>
            </div>
          </section>
          <section>
            <h3 className="mb-3 text-[18px] font-bold">Dokumenty miasta (przetwarzane wcześniej, codziennie)</h3>
            <Flow items={DOCS} />
          </section>
          <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="overflow-hidden rounded-card border border-line bg-surface">
              <table className="w-full text-left text-[15px]">
                <caption className="px-4 pt-3 pb-1 text-left text-[18px] font-bold">Technologie</caption>
                <thead className="text-[13px] text-ink-2">
                  <tr className="border-b border-line">
                    <th className="px-4 py-2 font-bold">Warstwa</th>
                    <th className="px-4 py-2 font-bold">Technologia</th>
                    {SHOW_DEMO_STATUS && <th className="px-4 py-2 font-bold">Stan w demo</th>}
                  </tr>
                </thead>
                <tbody>
                  {STACK.map((r) => (
                    <tr key={r.layer} className="border-b border-[#eef0f3] last:border-0">
                      <td className="px-4 py-2 font-bold">{r.layer}</td>
                      <td className="px-4 py-2 text-ink-2">{r.tech}</td>
                      {SHOW_DEMO_STATUS && (
                        <td className="px-4 py-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${STATUS_CLS[r.status]}`}>{r.status}</span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3">
              {[
                ['AI nie wymyśla faktów', 'Odpowiedź dla mieszkańca i interpelacja powstają tylko z dokumentów BIP i zgłoszeń. Każde zdanie ma przypis.'],
                ['Człowiek decyduje', 'AI przygotowuje szkic, a radna czyta, poprawia i wysyła sama. Nic nie wychodzi automatycznie.'],
                ['Prywatność', 'Twarze i tablice rozmazujemy przed zapisem. Weryfikacja zostawia tylko pseudonim i flagę „mieszka w Toruniu”.'],
                ['Współpraca, nie skargi', 'Celem jest wspólne rozwiązanie sprawy: mieszkańcy, radni i urząd widzą to samo.'],
              ].map(([t, d]) => (
                <div key={t} className="rounded-card border border-line bg-surface px-4 py-3">
                  <div className="text-[16px] font-bold">{t}</div>
                  <div className="mt-0.5 text-[14px] leading-5 text-ink-2">{d}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
