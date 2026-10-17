import { Button } from '../components/ui'
import { IconBulb, IconCamera } from '../components/icons'
import { ScreenHeader } from './ScreenHeader'

const TOPICS = ['Drogi i chodniki', 'Oświetlenie', 'Zieleń i drzewa', 'Ławki i kosze', 'Place zabaw', 'Przystanki', 'Pomysły na okolicę']

/**
 * Sprawy interwencyjne (parkowanie, hałas, zakłócanie spokoju) nie są tematem aplikacji.
 * Nie przyjmujemy ich, tylko życzliwie mówimy, gdzie szybciej pomogą, i czym zajmuje się Głos Osiedla.
 */
export function RedirectScreen({ onNewReport, onHome }: { onNewReport: () => void; onHome: () => void }) {
  return (
    <div className="flex h-full flex-col bg-canvas">
      <ScreenHeader title="Twoje zgłoszenie" onBack={onHome} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 px-4 pt-5 pb-[calc(var(--safe-bottom)+16px)]">
          <div className="flex flex-col items-center gap-3 px-2 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-st-planned-bg text-st-planned">
              <IconBulb size={30} strokeWidth={2} />
            </span>
            <h1 className="text-h2 font-bold">Z tym szybciej pomoże ktoś inny</h1>
            <p className="text-[16px] leading-6 text-ink-2">
              Parkowanie, hałas czy zakłócanie spokoju wymagają szybkiej interwencji na miejscu. Najszybciej zajmie się tym straż miejska pod numerem <b className="text-ink">986</b>, a w nagłej sytuacji zadzwoń pod <b className="text-ink">112</b>.
            </p>
          </div>

          <section className="rounded-card border border-line bg-surface p-4" aria-labelledby="topics">
            <h2 id="topics" className="text-[17px] font-bold leading-6">
              W czym pomaga Głos Osiedla
            </h2>
            <p className="mt-1 text-[15px] leading-[22px] text-ink-2">Sprawy, które razem z radnymi i urzędem zmieniają okolicę na lepsze:</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {TOPICS.map((t) => (
                <li key={t} className="rounded-full bg-st-new-bg px-3 py-1 text-[15px] font-bold text-st-new">
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2.5 border-t border-line bg-surface px-4 pt-3 pb-[calc(var(--safe-bottom)+10px)]">
        <Button variant="primary" size="lg" className="w-full rounded-full" onClick={onNewReport}>
          <IconCamera size={24} strokeWidth={2.2} /> Zgłoś inną sprawę
        </Button>
        <Button className="w-full rounded-full" onClick={onHome}>
          Wróć do mapy
        </Button>
      </div>
    </div>
  )
}
