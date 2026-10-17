/**
 * Weryfikacja mieszkańca przez mObywatel — architektura (PROJEKT.md, sekcja 6).
 *
 * Każdy dostawca zwraca PESEL i adres zameldowania. Z PESEL-u liczymy pseudonim
 * HMAC-SHA256(PESEL, klucz serwera), z adresu zapisujemy tylko „zameldowany w Toruniu: tak/nie”.
 * Imię, nazwisko, PESEL i adres są usuwane od razu po weryfikacji.
 *
 * Na hackathonie działa tylko MockProvider. Kolejne implementacje opisuje README:
 *  - IntegratorProvider  (np. Autopay, IDENTT, Authologic — kod QR, podpisane dane)
 *  - LoginGovProvider    (login.gov.pl / Węzeł Krajowy, SAML 2.0)
 *  - EudiWalletProvider  (mObywatel Europa / EUDI Wallet — tylko atrybut „mieszka w Toruniu”)
 */
import type { Verification } from './types'

export interface VerificationResult {
  pesel: string
  address: string
}

export interface VerificationProvider {
  id: string
  /** Dane do kodu QR, który mieszkaniec skanuje w mObywatelu */
  qrPayload(): string
  verify(): Promise<VerificationResult>
}

export class MockProvider implements VerificationProvider {
  id = 'mock'
  qrPayload() {
    return `glos-osiedla://verify/${Math.random().toString(36).slice(2, 10)}`
  }
  verify(): Promise<VerificationResult> {
    // symulowana odpowiedź testowa po zeskanowaniu kodu
    return new Promise((resolve) =>
      setTimeout(() => resolve({ pesel: '00000000000', address: 'ul. Przykładowa 1, 87-100 Toruń' }), 2600),
    )
  }
}

// W prawdziwej wersji klucz jest tylko na serwerze. Tu: stała demo.
const DEMO_SERVER_KEY = 'demo-klucz-serwera-glos-osiedla'

async function hmacHex(message: string, key: string): Promise<string> {
  try {
    const enc = new TextEncoder()
    const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const sig = await crypto.subtle.sign('HMAC', k, enc.encode(message))
    return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    // crypto.subtle niedostępne (np. strona bez HTTPS w sieci lokalnej): pseudonim zastępczy
    return Array.from(message + key, (ch) => ch.charCodeAt(0).toString(16)).join('').slice(0, 64)
  }
}

/** Minimalizacja danych: zostaje tylko pseudonim i flagi */
export async function toVerification(result: VerificationResult): Promise<Verification> {
  const pseudonym = (await hmacHex(result.pesel, DEMO_SERVER_KEY)).slice(0, 16)
  const torun = /toruń/i.test(result.address)
  return { pseudonym, torun, verifiedAt: new Date().toISOString() }
}

export const verificationProvider: VerificationProvider = new MockProvider()
