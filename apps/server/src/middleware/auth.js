import { eq } from 'drizzle-orm'
import { sign, verify } from 'hono/jwt'
import { getDb } from '../db/index.js'
import { users } from '../db/schema.js'

const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86400 }

/** แปลงอายุ token แบบ '7d' / '12h' / '30m' / '3600s' เป็นวินาที (ค่าเริ่มต้น 7 วัน) */
export function tokenTtlSeconds(expiresIn) {
  const match = /^(\d+)\s*([smhd])$/.exec(String(expiresIn || '').trim())
  if (!match) return 7 * UNIT_SECONDS.d
  return Number(match[1]) * UNIT_SECONDS[match[2]]
}

/** สร้าง JWT (HS256) จากข้อมูลผู้ใช้ */
export async function signToken(env, user) {
  const now = Math.floor(Date.now() / 1000)
  return await sign(
    { id: user.id, email: user.email, role: user.role, iat: now, exp: now + tokenTtlSeconds(env.JWT_EXPIRES_IN) },
    env.JWT_SECRET,
    'HS256',
  )
}

/** Authentication — ตรวจ Bearer token แล้วแนบ user ลง context */
export async function authRequired(c, next) {
  const header = c.req.header('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return c.json({ message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' }, 401)

  let payload
  try {
    payload = await verify(token, c.env.JWT_SECRET, 'HS256')
  } catch {
    return c.json({ message: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' }, 401)
  }

  const db = getDb(c.env)
  const user = Number.isInteger(payload?.id)
    ? await db.select().from(users).where(eq(users.id, payload.id)).get()
    : null
  if (!user) return c.json({ message: 'ไม่พบผู้ใช้งานนี้ในระบบ' }, 401)

  c.set('user', { id: user.id, name: user.name, email: user.email, role: user.role })
  await next()
}

/** Authorization — ต้องเป็น ADMIN เท่านั้น (ใช้หลัง authRequired) */
export async function adminRequired(c, next) {
  if (c.get('user')?.role !== 'ADMIN') {
    return c.json({ message: 'สำหรับผู้ดูแลระบบ (Admin) เท่านั้น' }, 403)
  }
  await next()
}
