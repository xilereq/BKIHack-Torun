import { useRef, useState } from 'react'
import { IconBack, IconChevron } from './icons'
import { Photo } from './shared'

export interface Slide {
  src: string
  alt: string
  caption?: string
}

/** Karuzela zdjęć: przesuwanie palcem (scroll-snap) albo strzałkami, kropki i licznik. */
export function Carousel({ slides, height = 180, rounded = '' }: { slides: Slide[]; height?: number; rounded?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const many = slides.length > 1

  const go = (i: number) => {
    const el = ref.current
    if (!el) return
    const next = Math.max(0, Math.min(slides.length - 1, i))
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
  }

  if (slides.length === 0) return null

  return (
    <div className={`relative overflow-hidden bg-[#e6e8eb] ${rounded}`} style={{ height }} aria-roledescription="karuzela" aria-label="Zdjęcia mieszkańców">
      <div
        ref={ref}
        className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const el = e.currentTarget
          setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
        }}
      >
        {slides.map((s, i) => (
          <figure key={`${s.src}-${i}`} className="relative h-full w-full shrink-0 snap-center" aria-label={`Zdjęcie ${i + 1} z ${slides.length}`}>
            <Photo src={s.src} alt={s.alt} className="h-full w-full" />
            {s.caption && (
              <figcaption className="absolute bottom-2 left-2 rounded-full bg-ink/70 px-2.5 text-[12px] font-bold leading-5 text-white">{s.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>
      {many && (
        <>
          <button
            type="button"
            aria-label="Poprzednie zdjęcie"
            onClick={() => go(index - 1)}
            className={`absolute top-1/2 left-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/95 text-ink shadow ${index === 0 ? 'opacity-40' : ''}`}
          >
            <IconBack size={18} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            aria-label="Następne zdjęcie"
            onClick={() => go(index + 1)}
            className={`absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/95 text-ink shadow ${index === slides.length - 1 ? 'opacity-40' : ''}`}
          >
            <IconChevron size={18} strokeWidth={2.4} />
          </button>
          <div className="absolute top-2 right-2 rounded-full bg-ink/70 px-2 text-[12px] font-bold leading-5 text-white">
            {index + 1}/{slides.length}
          </div>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden="true">
            {slides.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
