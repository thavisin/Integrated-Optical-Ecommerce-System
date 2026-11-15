// แฮชรหัสผ่านด้วย Web Crypto (PBKDF2-SHA256) — ใช้ได้ทั้ง Workers และ Node
// รูปแบบที่เก็บ: pbkdf2$<iterations>$<base64 salt>$<base64 hash>

const ITERATIONS = 100000
const SALT_BYTES = 16
const HASH_BITS = 256

const encoder = new TextEncoder()

const toBase64 = (bytes) => btoa(String.fromCharCode(...bytes))

function fromBase64(text) {
  const raw = atob(text)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    key,
    HASH_BITS,
  )
  return new Uint8Array(bits)
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await derive(String(password), salt, ITERATIONS)
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`
}

export async function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false

  const iterations = Number(parts[1])
  if (!Number.isInteger(iterations) || iterations < 1) return false

  let salt
  let expected
  try {
    salt = fromBase64(parts[2])
    expected = fromBase64(parts[3])
  } catch {
    return false
  }
  if (salt.length === 0 || expected.length === 0) return false

  const actual = await derive(String(password), salt, iterations)
  if (actual.length !== expected.length) return false

  // constant-time compare
  let diff = 0
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i]
  return diff === 0
}
