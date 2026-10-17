import type { Analysis } from '../lib/ai'
import type { ViolationKind } from '../lib/moderation'
import { Button } from '../components/ui'
import { IconEdit, IconMegaphone, IconShield, IconSparkle, IconUsers, IconX } from '../components/icons'
import { ScreenHeader } from './ScreenHeader'
import type { ReportDraft } from './ReportScreen'

const KIND_ICON: Record<ViolationKind, typeof IconShield> = {
  personal: IconUsers,
  plate: IconShield,
  insult: IconX,
  threat: IconX,
  ad: IconMegaphone,
}

/** Opis z zaznaczonymi fragmentami do poprawy */
function Highlighted({ text, fragments }: { text: string; fragments: string[] }) {
  if (!fragments.length) return <>{text}</>
  const esc = fragments.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length)
  const parts = text.split(new RegExp(`(${esc.join('|')})`, 'g'))
  return (
    <>
      {parts.map((p, i) =>
        fragments.includes(p) ? (
          <mark key={i} className="rounded-[4px] bg-st-wait-bg px-0.5 font-bold text-st-wait underline decoration-2 underline-offset-2">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}

/**
 * Ścieżka „z błędem”: AI wykryło w zgłoszeniu rzeczy, których nie przekazujemy dalej.
 * Ton spokojny i pomocny — mówimy, co poprawić i dlaczego, i proponujemy gotową wersję.
 */
export function ModerationScreen({
  draft,
  analysis,
  onSendFixed,
  onEditMyself,
  onBack,
}: {
  draft: ReportDraft
  analysis: Analysis
  onSendFixed: (fixed: ReportDraft) => void
  onEditMyself: () => void
  onBack: () => void
}) {
  const { violations, cleaned } = analysis.moderation
  const fragments = violations.flatMap((v) => v.fragments)

  return (
    <div className="flex h-full flex-col bg-canvas">
      <ScreenHeader title="Popraw zgłoszenie" onBack={onBack} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 px-4 pt-4 pb-[calc(var(--safe-bottom)+16px)]">
          <div className="flex items-start gap-3 rounded-card bg-st-wait-bg px-4 py-3.5 text-st-wait">
            <IconSparkle size={24} className="mt-0.5 shrink-0" />
            <div>
              <div className="text-[18px] font-bold leading-6">Zanim wyślemy, popraw kilka rzeczy</div>
              <p className="mt-0.5 text-[15px] leading-[22px] text-ink">
                Zgłoszenie przeczytają radni i urzędnicy. Pomagamy, żeby było rzeczowe i bez danych innych osób.
              </p>
            </div>
          </div>

          <section className="rounded-card border border-line bg-surface p-4" aria-labelledby="mod-text">
            <h2 id="mod-text" className="mb-1.5 text-[15px] font-bold text-ink-2">
              Twój opis
            </h2>
            <p className="text-[17px] leading-[27px] [overflow-wrap:anywhere]">
              <Highlighted text={draft.description} fragments={fragments} />
            </p>
          </section>

          <section className="rounded-card border border-line bg-surface px-4 py-1" aria-label="Co poprawić">
            <ul className="flex flex-col">
              {violations.map((v, i) => {
                const Icon = KIND_ICON[v.kind]
                return (
                  <li key={v.kind} className={`flex gap-3 py-3 ${i ? 'border-t border-[#eef0f3]' : ''}`}>
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-st-wait-bg text-st-wait">
                      <Icon size={18} strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[17px] font-bold leading-6">{v.title}</div>
                      <div className="text-[14px] leading-5 text-ink-2 [overflow-wrap:anywhere]">„{v.fragments.join('”, „')}”</div>
                      <p className="mt-1 text-[15px] leading-[22px]">{v.why}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="rounded-card border-2 border-st-done bg-surface p-4" aria-labelledby="mod-fixed">
            <h2 id="mod-fixed" className="mb-1.5 flex items-center gap-2 text-[15px] font-bold text-st-done">
              <IconSparkle size={18} /> Proponowana wersja
            </h2>
            <p className="text-[17px] leading-[27px] [overflow-wrap:anywhere]">{cleaned}</p>
          </section>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2.5 border-t border-line bg-surface px-4 pt-3 pb-[calc(var(--safe-bottom)+10px)]">
        <Button variant="primary" size="lg" className="w-full rounded-full" onClick={() => onSendFixed({ ...draft, description: cleaned, usedMic: false })}>
          Wyślij poprawioną wersję
        </Button>
        <Button className="w-full rounded-full" onClick={onEditMyself}>
          <IconEdit size={20} /> Popraw samodzielnie
        </Button>
      </div>
    </div>
  )
}
