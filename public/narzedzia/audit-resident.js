/**
 * Przejście po wszystkich ekranach mieszkańca z audytem mieszczenia tekstu (narzędzie zespołu).
 * Wymaga wcześniej załadowanego scripts/audit-overflow.js. Wywołanie: await window.auditResident()
 */
window.auditResident = async function auditResident() {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const results = {}
  const run = (name) => {
    results[name] = window
      .auditOverflow()
      .filter((x) => !/origin-top-left|relative\.shrink-0 „/.test(x.el))
      .map((x) => `${x.kind}: ${x.el}${x.z ? ' ⟷ ' + x.z : ''}${x.szer ? ` ${x.szer}/${x.potrzeba}` : ''}${x.o_px ? ` o ${x.o_px}px` : ''}${x.px ? ` ${x.px}` : ''}${x.linie ? ` (${x.linie} linie)` : ''}`)
  }
  const btn = (txt) => [...document.querySelectorAll('button, a')].find((b) => (b.innerText || b.getAttribute('aria-label') || '').includes(txt))
  const click = async (txt, ms = 700) => {
    const b = btn(txt)
    if (!b) {
      results[`BRAK PRZYCISKU: ${txt}`] = []
      return false
    }
    b.click()
    await wait(ms)
    return true
  }
  const cmd = async (detail, ms = 900) => {
    window.dispatchEvent(new CustomEvent('glos-osiedla:demo', { detail }))
    await wait(ms)
  }

  localStorage.removeItem('glos-osiedla-demo-v1')
  await cmd({ type: 'home' }, 1500)
  run('start')
  // podgląd sprawy po kliknięciu znacznika
  const marker = [...document.querySelectorAll('.gm-marker')].find((m) => (m.getAttribute('aria-label') || '').includes('Rubinkowo Centrum'))
  if (marker) {
    marker.click()
    await wait(700)
    run('start: karta podglądu')
  }
  await click('Zgłoś: zrób zdjęcie')
  run('arkusz aparatu')
  await click('Opisz bez zdjęcia', 900)
  run('nowe zgłoszenie')
  await cmd({ type: 'prefill', scenario: 'pothole' }, 1200)
  await click('Powiedz zamiast pisać', 6000)
  run('zgłoszenie z opisem')
  await click('Wyślij zgłoszenie', 1800)
  run('AI analizuje')
  await wait(5000)
  run('wynik')
  await click('Jak AI to oceniło', 600)
  const steps = [...document.querySelectorAll('li button[aria-expanded]')]
  for (const s of steps) s.click()
  await wait(500)
  run('wynik: ślad AI rozwinięty')
  await click('Zweryfikuj przez mObywatel', 700)
  run('weryfikacja')
  await click('Zamknij', 500)
  await click('Śledź sprawę', 1000)
  run('sprawa (własna)')
  await cmd({ type: 'open-case', caseId: 'c-przejscie-sp16' }, 1000)
  run('sprawa (cudza, podbij)')
  await cmd({ type: 'open-case', caseId: 'c-city-polna' }, 1000)
  run('pomysł (budżet obywatelski)')
  await cmd({ type: 'home' }, 800)
  await click('Moje sprawy', 900)
  run('moje sprawy')
  return results
}
