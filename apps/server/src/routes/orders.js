import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authRequired, adminRequired } from '../middleware/auth.js'
import { uploadSlip } from '../middleware/upload.js'
import { HttpError } from '../middleware/error.js'

const router = Router()

const ORDER_INCLUDE = {
  items: { include: { product: true } },
  user: { select: { id: true, name: true, email: true } },
}

/** สถานะที่เปลี่ยนไปได้จากแต่ละสถานะ (ตาม flowchart 03/04) */
const ALLOWED_TRANSITIONS = {
  AWAITING_PAYMENT: ['PENDING_VERIFY', 'CANCELLED'],
  PENDING_VERIFY: ['PAID', 'REJECTED', 'CANCELLED'],
  PAID: ['SHIPPED'],
  SHIPPED: ['COMPLETED'],
  REJECTED: ['PENDING_VERIFY', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

const canCancel = (status) => ['AWAITING_PAYMENT', 'PENDING_VERIFY', 'REJECTED'].includes(status)

/**
 * POST /api/orders — Checkout (customer)
 * multipart/form-data: items (JSON), shippingName, phone, address, note, slip (แนบสลิปตอนนี้เลยก็ได้)
 * - ถ้าแนบสลิปมาด้วย → สถานะเริ่มที่ PENDING_VERIFY (รอแอดมินตรวจ)
 * - ถ้ายังไม่แนบ → สถานะ AWAITING_PAYMENT (รอโอนเงิน + ส่งสลิปทีหลัง)
 */
router.post('/', authRequired, uploadSlip.single('slip'), async (req, res, next) => {
  try {
    const { shippingName, phone, address, note } = req.body || {}
    if (!shippingName?.trim() || !phone?.trim() || !address?.trim()) {
      throw new HttpError(400, 'กรุณากรอกชื่อผู้รับ เบอร์โทร และที่อยู่จัดส่งให้ครบถ้วน')
    }

    let items
    try {
      items = JSON.parse(req.body.items || '[]')
    } catch {
      throw new HttpError(400, 'รูปแบบรายการสินค้าไม่ถูกต้อง')
    }
    if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'ตะกร้าสินค้าว่างเปล่า')

    const order = await prisma.$transaction(async (tx) => {
      let total = 0
      const orderItems = []

      for (const it of items) {
        const product = await tx.product.findUnique({ where: { id: Number(it?.productId) } })
        if (!product) throw new HttpError(400, `ไม่พบสินค้า (id: ${it?.productId})`)
        const qty = Math.floor(Number(it?.quantity) || 1)
        if (qty < 1) throw new HttpError(400, 'จำนวนสินค้าไม่ถูกต้อง')
        if (product.stock < qty) {
          throw new HttpError(400, `สินค้า "${product.name}" มีสต็อกไม่เพียงพอ (คงเหลือ ${product.stock} ชิ้น)`)
        }
        total += product.price * qty
        orderItems.push({ productId: product.id, quantity: qty, price: product.price })
      }

      // หักสต็อกตอนแอดมินอนุมัติ (ตาม flowchart 04) — ตอนนี้เช็คสต็อกล่วงหน้าไว้ก่อน
      const created = await tx.order.create({
        data: {
          userId: req.user.id,
          total,
          status: req.file ? 'PENDING_VERIFY' : 'AWAITING_PAYMENT',
          slipUrl: req.file ? `/uploads/slips/${req.file.filename}` : null,
          shippingName: shippingName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          note: note?.trim() || null,
          items: { create: orderItems },
        },
        include: ORDER_INCLUDE,
      })
      return created
    })

    res.status(201).json({ order })
  } catch (err) {
    next(err)
  }
})

/** GET /api/orders — ประวัติคำสั่งซื้อของตัวเอง / admin ดูทั้งหมดด้วย ?all=true และกรอง ?status= */
router.get('/', authRequired, async (req, res, next) => {
  try {
    const where = {}
    const isAdmin = req.user.role === 'ADMIN'
    if (!isAdmin || req.query.all !== 'true') where.userId = req.user.id
    if (req.query.status) where.status = String(req.query.status)

    const orders = await prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, include: ORDER_INCLUDE })
    res.json({ orders })
  } catch (err) {
    next(err)
  }
})

/** GET /api/orders/:id — รายละเอียดคำสั่งซื้อ (เจ้าของ หรือ admin) */
router.get('/:id', authRequired, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) }, include: ORDER_INCLUDE })
    if (!order) throw new HttpError(404, 'ไม่พบคำสั่งซื้อนี้')
    if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new HttpError(403, 'คุณไม่มีสิทธิ์ดูคำสั่งซื้อนี้')
    }
    res.json({ order })
  } catch (err) {
    next(err)
  }
})

/**
 * PATCH /api/orders/:id/status — เปลี่ยนสถานะ (admin)
 * body: { status, note? }
 * - PENDING_VERIFY → PAID (อนุมัติสลิป + หักสต็อกใน transaction)
 * - PENDING_VERIFY → REJECTED (ต้องระบุเหตุผล)
 * - PAID → SHIPPED, SHIPPED → COMPLETED
 */
router.patch('/:id/status', authRequired, adminRequired, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const nextStatus = String(req.body?.status || '')
    const note = req.body?.note?.trim() || null

    const order = await prisma.$transaction(async (tx) => {
      const found = await tx.order.findUnique({ where: { id }, include: { items: true } })
      if (!found) throw new HttpError(404, 'ไม่พบคำสั่งซื้อนี้')

      if (!ALLOWED_TRANSITIONS[found.status]?.includes(nextStatus)) {
        throw new HttpError(400, `เปลี่ยนสถานะจาก ${found.status} เป็น ${nextStatus} ไม่ได้`)
      }
      if (nextStatus === 'REJECTED' && !note) {
        throw new HttpError(400, 'กรุณาระบุเหตุผลที่ปฏิเสธสลิป')
      }

      // อนุมัติสลิป → หักสต็อกสินค้า (transaction กันขายเกินสต็อก)
      if (found.status === 'PENDING_VERIFY' && nextStatus === 'PAID') {
        for (const it of found.items) {
          const product = await tx.product.findUnique({ where: { id: it.productId } })
          if (!product) throw new HttpError(400, `ไม่พบสินค้า (id: ${it.productId})`)
          if (product.stock < it.quantity) {
            throw new HttpError(400, `สต็อก "${product.name}" ไม่พอ (เหลือ ${product.stock}) ไม่สามารถอนุมัติได้`)
          }
          await tx.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.quantity } } })
        }
      }

      return tx.order.update({ where: { id }, data: { status: nextStatus, note }, include: ORDER_INCLUDE })
    })

    res.json({ order })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/orders/:id/slip — ลูกค้าส่ง/แก้ไขสลิปโอนเงิน
 * ใช้ได้เมื่อ AWAITING_PAYMENT, PENDING_VERIFY (แทนที่รูปเดิม) หรือ REJECTED (ส่งใหม่)
 */
router.post('/:id/slip', authRequired, uploadSlip.single('slip'), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!req.file) throw new HttpError(400, 'กรุณาเลือกไฟล์สลิปก่อนส่ง')

    const order = await prisma.$transaction(async (tx) => {
      const found = await tx.order.findUnique({ where: { id } })
      if (!found) throw new HttpError(404, 'ไม่พบคำสั่งซื้อนี้')
      if (found.userId !== req.user.id) throw new HttpError(403, 'คุณไม่มีสิทธิ์แก้ไขคำสั่งซื้อนี้')
      if (!['AWAITING_PAYMENT', 'PENDING_VERIFY', 'REJECTED'].includes(found.status)) {
        throw new HttpError(400, 'คำสั่งซื้อนี้ไม่อยู่ในสถานะที่ส่งสลิปได้')
      }
      return tx.order.update({
        where: { id },
        data: { slipUrl: `/uploads/slips/${req.file.filename}`, status: 'PENDING_VERIFY', note: null },
        include: ORDER_INCLUDE,
      })
    })

    res.json({ order })
  } catch (err) {
    next(err)
  }
})

/** POST /api/orders/:id/cancel — ลูกค้ายกเลิกคำสั่งซื้อ (ได้เฉพาะก่อนอนุมัติสลิป) */
router.post('/:id/cancel', authRequired, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const order = await prisma.$transaction(async (tx) => {
      const found = await tx.order.findUnique({ where: { id } })
      if (!found) throw new HttpError(404, 'ไม่พบคำสั่งซื้อนี้')
      if (found.userId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new HttpError(403, 'คุณไม่มีสิทธิ์ยกเลิกคำสั่งซื้อนี้')
      }
      if (!canCancel(found.status)) {
        throw new HttpError(400, 'คำสั่งซื้อนี้ตรวจสอบแล้ว ยกเลิกไม่ได้ (โปรดติดต่อร้านค้า)')
      }
      return tx.order.update({
        where: { id },
        data: { status: 'CANCELLED', note: req.body?.note?.trim() || 'ยกเลิกโดยลูกค้า' },
        include: ORDER_INCLUDE,
      })
    })
    res.json({ order })
  } catch (err) {
    next(err)
  }
})

export default router
