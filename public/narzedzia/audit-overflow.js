/**
 * Audyt mieszczenia się tekstu (narzędzie zespołu, uruchamiane w konsoli przeglądarki).
 * Zwraca listę problemów: tekst wychodzący poza element, ucięty przez kontener z overflow:hidden,
 * nachodzące na siebie przyciski/etykiety oraz teksty obcięte wielokropkiem.
 * Użycie: wklej plik do konsoli i wywołaj window.auditOverflow().
 */
window.auditOverflow = function auditOverflow(opts = {}) {
  const root = opts.root || document.body
  // animacje wyłączone, żeby mierzyć stan końcowy (karta w tle wstrzymuje animacje)
  if (!document.getElementById('audit-no-anim')) {
    const st = document.createElement('style')
    st.id = 'audit-no-anim'
    st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}'
    document.head.appendChild(st)
  }
  const out = []
  const seen = new Set()
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return false
    const cs = getComputedStyle(el)
    return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05
  }
  const label = (el) => {
    const t = (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ')
    const cls = typeof el.className === 'string' ? el.className.split(' ').slice(0, 4).join('.') : ''
    return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''} „${t.slice(0, 60)}”`
  }
  const push = (kind, el, extra) => {
    const key = kind + label(el)
    if (seen.has(key)) return
    seen.add(key)
    out.push({ kind, el: label(el), ...extra })
  }
  // mapa celowo ucina punkty poza kadrem; ozdobne elementy ramki telefonu są aria-hidden
  const skip = (el) =>
    el.classList.contains('sr-only') ||
    el.classList.contains('maplibregl-map') ||
    el.closest('.maplibregl-canvas-container, .maplibregl-ctrl, svg, [aria-hidden="true"], [data-audit-skip]')

  const all = root.querySelectorAll('*')
  for (const el of all) {
    if (skip(el) || !visible(el)) continue
    const cs = getComputedStyle(el)
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    // 1) poziome przepełnienie elementu
    if (el.scrollWidth > el.clientWidth + 1 && !['auto', 'scroll'].includes(cs.overflowX) && el.clientWidth > 0) {
      if (cs.textOverflow === 'ellipsis') push('ucięty wielokropkiem', el, { szer: el.clientWidth, potrzeba: el.scrollWidth })
      else if (el.innerText && el.innerText.trim()) push('wychodzi poza element', el, { szer: el.clientWidth, potrzeba: el.scrollWidth })
    }
    // 2) tekst ucięty przez przodka z overflow hidden
    if (hasText) {
      const r = el.getBoundingClientRect()
      let a = el.parentElement
      while (a && a !== document.body) {
        const acs = getComputedStyle(a)
        // kontener przewijany: treść poza widokiem jest dostępna po przewinięciu
        if (['auto', 'scroll'].includes(acs.overflowY) || ['auto', 'scroll'].includes(acs.overflowX)) break
        if (['hidden', 'clip'].includes(acs.overflowX) || ['hidden', 'clip'].includes(acs.overflowY)) {
          const ar = a.getBoundingClientRect()
          const dx = Math.max(ar.left - r.left, r.right - ar.right)
          const dy = Math.max(ar.top - r.top, r.bottom - ar.bottom)
          if ((dx > 2 && ['hidden', 'clip'].includes(acs.overflowX)) || (dy > 2 && ['hidden', 'clip'].includes(acs.overflowY) && !el.closest('[class*="line-clamp"]'))) {
            push('ucięty przez kontener', el, { o_px: Math.round(Math.max(dx, dy)) })
          }
          break
        }
        a = a.parentElement
      }
    }
  }
  // 3) etykiety-pigułki, przyciski i chipy, które zawijają tekst do kilku linii
  for (const el of root.querySelectorAll('span, button, a, [role="radio"], [role="tab"]')) {
    if (skip(el) || !visible(el) || !el.innerText || !el.innerText.trim()) continue
    const cs = getComputedStyle(el)
    const pill = parseFloat(cs.borderTopLeftRadius) >= 9 || el.tagName === 'BUTTON' || el.getAttribute('role')
    if (!pill || cs.display === 'block' || cs.whiteSpace === 'nowrap') continue
    // liczba linii tekstu = liczba różnych wierszy w prostokątach zakresu (nie wysokość elementu)
    // tylko węzły tekstowe (ikonki SVG nie są liniami tekstu)
    let lines = 0
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(n)
      const tops = new Set([...range.getClientRects()].filter((r) => r.width > 1).map((r) => Math.round(r.top / 4)))
      lines = Math.max(lines, tops.size)
    }
    const shortText = el.innerText.trim().length < 40
    if (lines >= 2 && shortText && el.children.length < 4) push('zawija się w etykiecie/przycisku', el, { linie: lines })
  }
  // 4) nachodzące na siebie elementy interaktywne i etykiety
  // widoczny fragment elementu: przecięcie z przodkami, które ucinają treść (np. przewijana lista)
  const visibleRect = (el) => {
    const r = el.getBoundingClientRect()
    let box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a)
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue
      const ar = a.getBoundingClientRect()
      box = { left: Math.max(box.left, ar.left), top: Math.max(box.top, ar.top), right: Math.min(box.right, ar.right), bottom: Math.min(box.bottom, ar.bottom) }
    }
    return box.right - box.left > 1 && box.bottom - box.top > 1 ? box : null
  }
  const items = [...root.querySelectorAll('button, a, [role="radio"], span[class*="rounded-full"]')]
    .filter((e) => visible(e) && !skip(e))
    .map((e) => ({ e, r: visibleRect(e) }))
    .filter((x) => x.r)
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i].e
      const b = items[j].e
      if (a.contains(b) || b.contains(a)) continue
      // tło arkusza/okna (przycisk na całą powierzchnię) celowo leży pod treścią
      if (/inset-0/.test(a.className) || /inset-0/.test(b.className)) continue
      // panel historii leży nad mapą celowo (warstwa absolutna)
      if (a.closest('aside') !== b.closest('aside')) continue
      const ra = items[i].r
      const rb = items[j].r
      const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left)
      const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top)
      if (w > 3 && h > 3) {
        const za = getComputedStyle(a).position
        const zb = getComputedStyle(b).position
        // pomijamy elementy w różnych warstwach (dymki, arkusze nad treścią)
        if (a.closest('[role="dialog"]') !== b.closest('[role="dialog"]')) continue
        if (a.closest('.maplibregl-popup') !== b.closest('.maplibregl-popup')) continue
        out.push({ kind: 'nachodzą na siebie', el: label(a), z: label(b), px: `${Math.round(w)}×${Math.round(h)}`, pos: `${za}/${zb}` })
      }
    }
  }
  return out
}
