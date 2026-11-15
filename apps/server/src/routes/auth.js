import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { signToken, authRequired } from '../middleware/auth.js'
import { HttpError } from '../middleware/error.js'

const router = Router()

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })

/** POST /api/auth/register — สมัครสมาชิก (hash password ด้วย bcrypt) */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {}
    if (!name?.trim() || !email?.trim() || !password) {
      throw new HttpError(400, 'กรุณากรอกชื่อ อีเมล และรหัสผ่านให้ครบถ้วน')
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new HttpError(400, 'รูปแบบอีเมลไม่ถูกต้อง')
    if (String(password).length < 6) throw new HttpError(400, 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร')

    const normalizedEmail = email.trim().toLowerCase()
    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (exists) throw new HttpError(409, 'อีเมลนี้ถูกใช้สมัครสมาชิกแล้ว')

    const hashed = await bcrypt.hash(String(password), 10)
    const user = await prisma.user.create({
      data: { name: name.trim(), email: normalizedEmail, password: hashed, role: 'CUSTOMER' },
    })

    res.status(201).json({ token: signToken(user), user: publicUser(user) })
  } catch (err) {
    next(err)
  }
})

/** POST /api/auth/login — เข้าสู่ระบบ (verify bcrypt hash → ส่ง JWT) */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {}
    if (!email?.trim() || !password) throw new HttpError(400, 'กรุณากรอกอีเมลและรหัสผ่าน')

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (!user) throw new HttpError(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')

    const valid = await bcrypt.compare(String(password), user.password)
    if (!valid) throw new HttpError(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')

    res.json({ token: signToken(user), user: publicUser(user) })
  } catch (err) {
    next(err)
  }
})

/** GET /api/auth/me — ข้อมูลผู้ใช้จาก token */
router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user })
})

export default router
