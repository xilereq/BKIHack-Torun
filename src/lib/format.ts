const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

/** „2026-06” → „VI 2026” */
export function romanMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-').map(Number)
  return `${ROMAN[m - 1]} ${y}`
}

/** ISO → „18 marca 2025” */
export function formatDate(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** ISO → „III 2025” */
export function shortMonth(iso: string): string {
  return romanMonth(iso.slice(0, 7))
}

export function relativeDate(iso: string, now = new Date()): string {
  const d = new Date(iso)
  const diffMin = Math.round((now.getTime() - d.getTime()) / 60000)
  if (diffMin < 2) return 'przed chwilą'
  if (diffMin < 60) return `${diffMin} min temu`
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return `dziś, ${d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`
  return formatDate(iso)
}

/** Polska odmiana: plural(5, ['zgłoszenie', 'zgłoszenia', 'zgłoszeń']) → „zgłoszeń” */
export function plural(n: number, forms: [string, string, string]): string {
  if (n === 1) return forms[0]
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1]
  return forms[2]
}

export function countLabel(n: number, forms: [string, string, string]): string {
  return `${n} ${plural(n, forms)}`
}

export const REPORT_FORMS: [string, string, string] = ['zgłoszenie', 'zgłoszenia', 'zgłoszeń']

export function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1)
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}
