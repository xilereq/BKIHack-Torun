/**
 * Przejście po ekranach panelu radnego z audytem mieszczenia tekstu (narzędzie zespołu).
 * Wymaga wcześniej załadowanego audit-overflow.js. Wywołanie: await window.auditCouncil()
 */
window.auditCouncil = async function auditCouncil() {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const results = {}
  const run = (name) => {
    results[name] = window
      .auditOverflow()
      .map((x) => `${x.kind}: ${x.el}${x.z ? ' ⟷ ' + x.z : ''}${x.szer ? ` ${x.szer}/${x.potrzeba}` : ''}${x.o_px ? ` o ${x.o_px}px` : ''}${x.px ? ` ${x.px}` : ''}${x.linie ? ` (${x.linie} linie)` : ''}`)
  }
  const btn = (txt) => [...document.querySelectorAll('button, a, [role="radio"], [role="tab"]')].find((b) => (b.innerText || b.getAttribute('aria-label') || '').trim().startsWith(txt)) || [...document.querySelectorAll('button')].find((b) => (b.innerText || '').includes(txt))
  const click = async (txt, ms = 700) => {
    const b = btn(txt)
    if (!b) {
      results[`BRAK: ${txt}`] = []
      return
    }
    b.click()
    await wait(ms)
  }
  const select = async (index, value, ms = 900) => {
    const s = document.querySelectorAll('select')[index]
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set
    setter.call(s, value)
    s.dispatchEvent(new Event('change', { bubbles: true }))
    await wait(ms)
  }

  run('lista (mój okręg)')
  await select(2, 'custom')
  run('filtr: własny zakres dat')
  await select(2, 'all')
  await select(0, 'all', 1200)
  run('całe miasto')
  await click('Wykonane')
  run('status: wykonane')
  await click('Wszystkie')
  await click('Pomysły')
  run('zakładka pomysły')
  await click('Problemy')
  const marker = [...document.querySelectorAll('.gm-marker')].find((m) => (m.getAttribute('aria-label') || '').includes('Rubinkowo Centrum'))
  if (marker) {
    marker.click()
    await wait(1400)
    run('dymek sprawy')
  }
  const doc = [...document.querySelectorAll('.gm-marker')].find((m) => /Plan miasta|Interpelacja|Odpowiedź/.test(m.getAttribute('aria-label') || ''))
  if (doc) {
    doc.click()
    await wait(1400)
    run('dymek dokumentu')
  }
  await click('Dziura w jezdni przy przystanku', 1400)
  run('historia miejsca')
  await click('Przygotuj interpelację', 9500)
  run('szkic interpelacji')
  await click('Zamknij', 600)
  await click('Jak działa AI', 800)
  run('jak działa AI')
  await click('Zamknij', 500)
  return results
}
