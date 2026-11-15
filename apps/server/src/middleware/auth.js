import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

/** สร้าง JWT จากข้อมูลผู้ใช้ */
export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/** Authentication — ตรวจว่าแนบ Bearer token ที่ถูกต้องมาหรือไม่ แล้วแนบ req.user */
export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' })

    let payload
    try {
      payload = jwt.verify(token, JWT_SECRET)
    } catch {
      return res.status(401).json({ message: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' })
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } })
    if (!user) return res.status(401).json({ message: 'ไม่พบผู้ใช้งานนี้ในระบบ' })

    req.user = { id: user.id, name: user.name, email: user.email, role: user.role }
    next()
  } catch (err) {
    next(err)
  }
}

/** Authorization — ต้องเป็น ADMIN เท่านั้น (ต้องใช้หลัง authRequired) */
export function adminRequired(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'สำหรับผู้ดูแลระบบ (Admin) เท่านั้น' })
  }
  next()
}
