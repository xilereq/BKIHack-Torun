import { useRef } from 'react'
import { Button } from '../components/ui'
import { IconCamera, IconImage } from '../components/icons'
import { downscale } from './demoPhotos'

/** Arkusz po naciśnięciu aparatu: zrób zdjęcie, wybierz z galerii albo opisz bez zdjęcia */
export function CaptureSheet({ onPhoto, onNoPhoto, onClose }: { onPhoto: (src: string) => void; onNoPhoto: () => void; onClose: () => void }) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const pick = async (f: File | undefined) => {
    if (f) onPhoto(await downscale(f))
  }
  return (
    <div className="absolute inset-0 z-40 flex items-end" role="dialog" aria-modal="true" aria-labelledby="capture-title">
      <button type="button" aria-label="Zamknij" onClick={onClose} className="absolute inset-0 cursor-default bg-ink/40" />
      <div className="relative w-full rounded-t-[28px] bg-surface px-5 pt-2.5 pb-[calc(var(--safe-bottom)+20px)] shadow-2xl animate-slide-up">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line-strong" aria-hidden="true" />
        <h2 id="capture-title" className="text-[24px] font-bold leading-[30px] tracking-[-0.01em]">
          Coś jest nie tak albo czegoś brakuje?
        </h2>
        <p className="mt-1.5 text-body text-ink-2">Zrób zdjęcie i powiedz jedno zdanie. Bez zakładania konta.</p>
        <div className="mt-5 flex flex-col gap-2.5">
          <Button variant="primary" size="lg" className="w-full rounded-full" onClick={() => cameraRef.current?.click()}>
            <IconCamera size={26} strokeWidth={2.2} /> Zrób zdjęcie
          </Button>
          <Button className="min-h-14 w-full rounded-full text-[18px]" onClick={() => galleryRef.current?.click()}>
            <IconImage size={22} /> Wybierz z galerii
          </Button>
          <button type="button" onClick={onNoPhoto} className="min-h-12 text-[17px] font-bold text-brand hover:underline">
            Opisz bez zdjęcia
          </button>
        </div>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => pick(e.target.files?.[0])} />
        <input ref={galleryRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => pick(e.target.files?.[0])} />
      </div>
    </div>
  )
}
