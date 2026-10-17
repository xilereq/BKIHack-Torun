import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { CaseStatus, CaseType } from '../lib/types'
import { STATUS_LABEL, type UrgencyTag } from '../lib/domain'
import { IconAlert, IconBulb, IconCalendar, IconCheck, IconCircle, IconLogo, IconShield, IconWrench } from './icons'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'lg' | 'md' | 'sm'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark active:bg-brand-dark border-0',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-canvas',
  ghost: 'bg-transparent text-brand border-0 underline-offset-4 hover:underline',
}
const SIZE: Record<Size, string> = {
  lg: 'min-h-16 px-6 text-[22px] rounded-[16px]',
  md: 'min-h-13 px-5 text-[18px] rounded-btn',
  sm: 'min-h-12 px-4 text-[16px] rounded-btn',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2.5 font-bold transition-colors disabled:opacity-60 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

const STATUS_STYLE: Record<CaseStatus, string> = {
  new: 'bg-st-new-bg text-st-new',
  planned: 'bg-st-planned-bg text-st-planned',
  overdue: 'bg-st-overdue-bg text-st-overdue',
  done: 'bg-st-planned-bg text-st-planned',
  resolved: 'bg-st-done-bg text-st-done',
}

function StatusIcon({ status, size }: { status: CaseStatus; size: number }) {
  if (status === 'overdue') return <IconAlert size={size} strokeWidth={2.4} />
  if (status === 'planned') return <IconCalendar size={size} strokeWidth={2.2} />
  if (status === 'done') return <IconWrench size={size} strokeWidth={2.2} />
  if (status === 'resolved') return <IconCheck size={size} strokeWidth={2.6} />
  return <IconCircle size={size} strokeWidth={2.4} />
}

export function StatusBadge({ status, small = false, label }: { status: CaseStatus; small?: boolean; label?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-bold ${STATUS_STYLE[status]} ${small ? 'px-2.5 py-0.5 text-[14px] leading-5' : 'px-3 py-1 text-[15px] leading-5'}`}
    >
      <StatusIcon status={status} size={small ? 14 : 16} />
      {label ?? STATUS_LABEL[status]}
    </span>
  )
}

export function TypeBadge({ type, small = false }: { type: CaseType; small?: boolean }) {
  const cls = small ? 'px-2.5 py-0.5 text-[14px] leading-5' : 'px-3 py-1 text-[15px] leading-5'
  return type === 'idea' ? (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-st-idea-bg font-bold text-st-idea ${cls}`}>
      <IconBulb size={small ? 14 : 16} strokeWidth={2.2} />
      Pomysł
    </span>
  ) : (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-tint font-bold text-st-overdue ${cls}`}>Problem</span>
  )
}

export function VerifiedBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface font-bold text-ink ${small ? 'px-2 py-0.5 text-[13px] leading-5' : 'px-3 py-1 text-[15px] leading-5'}`}
    >
      <IconShield size={small ? 14 : 16} className="text-st-done" strokeWidth={2.2} />
      Zweryfikowany mieszkaniec
    </span>
  )
}

const TAG_STYLE: Record<UrgencyTag['tone'], string> = {
  neutral: 'bg-st-new-bg text-st-new',
  danger: 'bg-st-overdue-bg text-st-overdue',
  info: 'bg-st-planned-bg text-st-planned',
  success: 'bg-st-done-bg text-st-done',
}

export function Tag({ tag }: { tag: UrgencyTag }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[14px] font-bold leading-5 ${TAG_STYLE[tag.tone]}`}>
      {tag.tone === 'danger' && <IconAlert size={14} strokeWidth={2.4} />}
      {tag.label}
    </span>
  )
}

export function Card({ children, className = '', accent = false }: { children: ReactNode; className?: string; accent?: boolean }) {
  return (
    <div className={`rounded-card bg-surface ${accent ? 'border-2 border-brand' : 'border border-line'} ${className}`}>{children}</div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="text-[15px] font-bold text-ink-2">{children}</div>
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div className="flex shrink-0 items-center justify-center rounded-[10px] bg-brand text-white" style={{ width: size, height: size }}>
      <IconLogo size={Math.round(size * 0.56)} strokeWidth={2.2} />
    </div>
  )
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-[3px] border-line border-t-brand"
      style={{ width: size, height: size }}
      role="presentation"
    />
  )
}
