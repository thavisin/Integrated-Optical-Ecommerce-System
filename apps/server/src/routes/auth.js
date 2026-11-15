import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { getDb } from '../db/index.js'
import { users } from '../db/schema.js'
import { HttpError } from '../lib/http.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { readBody } from '../lib/upload.js'
import { authRequired, signToken } from '../middleware/auth.js'

const router = new Hono()

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })

/** POST /api/auth/register — สมัครสมาชิก (hash password ด้วย PBKDF2) */
router.post('/register', async (c) => {
  const body = await readBody(c)
  const { name, email, password } = body || {}
  if (!name?.trim() || !email?.trim() || !password) {
    throw new HttpError(400, 'กรุณากรอกชื่อ อีเมล และรหัสผ่านให้ครบถ้วน')
  }
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new HttpError(400, 'รูปแบบอีเมลไม่ถูกต้อง')
  if (String(password).length < 6) throw new HttpError(400, 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร')

  const db = getDb(c.env)
  const normalizedEmail = email.trim().toLowerCase()
  const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).get()
  if (exists) throw new HttpError(409, 'อีเมลนี้ถูกใช้สมัครสมาชิกแล้ว')

  const [user] = await db
    .insert(users)
    .values({
      name: name.trim(),
      email: normalizedEmail,
      password: await hashPassword(String(password)),
      role: 'CUSTOMER',
      createdAt: new Date(),
    })
    .returning()

  return c.json({ token: await signToken(c.env, user), user: publicUser(user) }, 201)
})

/** POST /api/auth/login — เข้าสู่ระบบ (verify PBKDF2 hash → ส่ง JWT) */
router.post('/login', async (c) => {
  const body = await readBody(c)
  const { email, password } = body || {}
  if (!email?.trim() || !password) throw new HttpError(400, 'กรุณากรอกอีเมลและรหัสผ่าน')

  const db = getDb(c.env)
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .get()
  if (!user) throw new HttpError(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')

  const valid = await verifyPassword(String(password), user.password)
  if (!valid) throw new HttpError(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')

  return c.json({ token: await signToken(c.env, user), user: publicUser(user) })
})

/** GET /api/auth/me — ข้อมูลผู้ใช้จาก token */
router.get('/me', authRequired, (c) => c.json({ user: c.get('user') }))

export default router
