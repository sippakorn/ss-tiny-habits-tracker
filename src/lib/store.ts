import type { AppData } from './types'
import { DEFAULT_DATA } from './defaults'

const DATA_KEY = 'tiny-habits:data'
const AUTH_KEY = 'tiny-habits:auth'

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (!raw) return DEFAULT_DATA
    return { ...DEFAULT_DATA, ...(JSON.parse(raw) as AppData) }
  } catch {
    return DEFAULT_DATA
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(DATA_KEY, JSON.stringify(data))
}

interface Credential {
  salt: string
  hash: string
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function deriveHash(passcode: string, salt: string): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passcode),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 150000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return toHex(bits)
}

export function hasPasscode(): boolean {
  return localStorage.getItem(AUTH_KEY) !== null
}

export async function setPasscode(passcode: string): Promise<void> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer)
  const hash = await deriveHash(passcode, salt)
  const cred: Credential = { salt, hash }
  localStorage.setItem(AUTH_KEY, JSON.stringify(cred))
}

export async function verifyPasscode(passcode: string): Promise<boolean> {
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return false
  const cred = JSON.parse(raw) as Credential
  const hash = await deriveHash(passcode, cred.salt)
  return hash === cred.hash
}
