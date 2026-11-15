import { and, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { getDb } from '../db/index.js'
import { orderItems, orders, products } from '../db/schema.js'
import { HttpError } from '../lib/http.js'
import { fileFrom, readBody, saveUpload } from '../lib/upload.js'
import { adminRequired, authRequired } from '../middleware/auth.js'

const router = new Hono()

const ORDER_INCLUDE = {
  items: { with: { product: true }, orderBy: (items, { asc }) => [asc(items.id)] },
  user: { columns: { id: true, name: true, email: true } },
}

const findOrder = (db, id) =>
  db.query.orders.findFirst({ where: eq(orders.id, id), with: ORDER_INCLUDE })

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

const isStockConstraintError = (err) => /CHECK constraint failed|SQLITE_CONSTRAINT_CHECK/i.test(String(err?.message || ''))

/**
 * POST /api/orders — Checkout (customer)
 * multipart/form-data: items (JSON), shippingName, phone, address, note, slip (แนบสลิปตอนนี้เลยก็ได้)
 * - ถ้าแนบสลิปมาด้วย → สถานะเริ่มที่ PENDING_VERIFY (รอแอดมินตรวจ)
 * - ถ้ายังไม่แนบ → สถานะ AWAITING_PAYMENT (รอโอนเงิน + ส่งสลิปทีหลัง)
 */
router.post('/', authRequired, async (c) => {
  const db = getDb(c.env)
  const body = await readBody(c)
  const { shippingName, phone, address, note } = body || {}
  if (!shippingName?.trim() || !phone?.trim() || !address?.trim()) {
    throw new HttpError(400, 'กรุณากรอกชื่อผู้รับ เบอร์โทร และที่อยู่จัดส่งให้ครบถ้วน')
  }

  let items
  try {
    items = typeof body.items === 'string' ? JSON.parse(body.items || '[]') : body.items
  } catch {
    throw new HttpError(400, 'รูปแบบรายการสินค้าไม่ถูกต้อง')
  }
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'ตะกร้าสินค้าว่างเปล่า')

  // ตรวจสต็อกล่วงหน้า (เหมือนเดิม) — ยังไม่หักสต็อกตอน checkout
  let total = 0
  const rows = []
  for (const it of items) {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, Number(it?.productId)))
      .get()
    if (!product) throw new HttpError(400, `ไม่พบสินค้า (id: ${it?.productId})`)
    const qty = Math.floor(Number(it?.quantity) || 1)
    if (qty < 1) throw new HttpError(400, 'จำนวนสินค้าไม่ถูกต้อง')
    if (product.stock < qty) {
      throw new HttpError(400, `สินค้า "${product.name}" มีสต็อกไม่เพียงพอ (คงเหลือ ${product.stock} ชิ้น)`)
    }
    total += product.price * qty
    rows.push({ productId: product.id, quantity: qty, price: product.price })
  }

  const slip = fileFrom(body, 'slip')
  const slipUrl = slip ? await saveUpload(c.env, slip, 'slips') : null
  const now = new Date()

  // batch เดียว: สร้าง Order แล้วสร้าง OrderItem ทั้งหมดผูกกับ order ที่เพิ่ง insert
  const [createdRows] = await db.batch([
    db
      .insert(orders)
      .values({
        userId: c.get('user').id,
        total,
        status: slip ? 'PENDING_VERIFY' : 'AWAITING_PAYMENT',
        slipUrl,
        shippingName: shippingName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        note: note?.trim() || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: orders.id }),
    ...rows.map((row) =>
      db.insert(orderItems).values({
        orderId: sql`(SELECT MAX("id") FROM "Order")`,
        ...row,
      }),
    ),
  ])

  const order = await findOrder(db, createdRows[0].id)
  return c.json({ order }, 201)
})

/** GET /api/orders — ประวัติคำสั่งซื้อของตัวเอง / admin ดูทั้งหมดด้วย ?all=true และกรอง ?status= */
router.get('/', authRequired, async (c) => {
  const db = getDb(c.env)
  const user = c.get('user')
  const conditions = []
  if (user.role !== 'ADMIN' || c.req.query('all') !== 'true') conditions.push(eq(orders.userId, user.id))
  if (c.req.query('status')) conditions.push(eq(orders.status, String(c.req.query('status'))))

  const list = await db.query.orders.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    with: ORDER_INCLUDE,
  })

  return c.json({ orders: list })
})

/** GET /api/orders/:id — รายละเอียดคำสั่งซื้อ (เจ้าของ หรือ admin) */
router.get('/:id', authRequired, async (c) => {
  const db = getDb(c.env)
  const order = await findOrder(db, Number(c.req.param('id')))
  if (!order) throw new HttpError(404, 'ไม่พบคำสั่งซื้อนี้')
  const user = c.get('user')
  if (order.userId !== user.id && user.role !== 'ADMIN') {
    throw new HttpError(403, 'คุณไม่มีสิทธิ์ดูคำสั่งซื้อนี้')
  }
  return c.json({ order })
})

/**
 * PATCH /api/orders/:id/status — เปลี่ยนสถานะ (admin)
 * - PENDING_VERIFY → PAID (อนุมัติสลิป + หักสต็อกใน batch เดียวกัน)
 * - PENDING_VERIFY → REJECTED (ต้องระบุเหตุผล)
 * - PAID → SHIPPED, SHIPPED → COMPLETED
 */
router.patch('/:id/status', authRequired, adminRequired, async (c) => {
  const db = getDb(c.env)
  const id = Number(c.req.param('id'))
  const body = await readBody(c)
  const nextStatus = String(body?.status || '')
  const note = body?.note?.trim() || null

  const found = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: true },
  })
  if (!found) throw new HttpError(404, 'ไม่พบคำสั่งซื้อนี้')

  if (!ALLOWED_TRANSITIONS[found.status]?.includes(nextStatus)) {
    throw new HttpError(400, `เปลี่ยนสถานะจาก ${found.status} เป็น ${nextStatus} ไม่ได้`)
  }
  if (nextStatus === 'REJECTED' && !note) {
    throw new HttpError(400, 'กรุณาระบุเหตุผลที่ปฏิเสธสลิป')
  }

  if (found.status === 'PENDING_VERIFY' && nextStatus === 'PAID') {
    // ตรวจสต็อกก่อน (ข้อความเดิม) — CHECK constraint กันขายเกินอีกชั้นตอน batch
    for (const it of found.items) {
      const product = await db.select().from(products).where(eq(products.id, it.productId)).get()
      if (!product) throw new HttpError(400, `ไม่พบสินค้า (id: ${it.productId})`)
      if (product.stock < it.quantity) {
        throw new HttpError(400, `สต็อก "${product.name}" ไม่พอ (เหลือ ${product.stock}) ไม่สามารถอนุมัติได้`)
      }
    }

    const updatedAt = new Date()
    const statements = found.items.map((it) =>
      db
        .update(products)
        .set({ stock: sql`${products.stock} - ${it.quantity}`, updatedAt })
        .where(eq(products.id, it.productId)),
    )
    statements.push(db.update(orders).set({ status: nextStatus, note, updatedAt }).where(eq(orders.id, id)))

    try {
      await db.batch(statements)
    } catch (err) {
      if (!isStockConstraintError(err)) throw err
      // batch ถูก rollback แล้ว — อ่านสต็อกจริงเพื่อสร้างข้อความเดียวกันกับตอนตรวจล่วงหน้า
      for (const it of found.items) {
        const product = await db.select().from(products).where(eq(products.id, it.productId)).get()
        if (!product) throw new HttpError(400, `ไม่พบสินค้า (id: ${it.productId})`)
        if (product.stock < it.quantity) {
          throw new HttpError(400, `สต็อก "${product.name}" ไม่พอ (เหลือ ${product.stock}) ไม่สามารถอนุมัติได้`)
        }
      }
      throw new HttpError(400, 'สต็อกสินค้าไม่เพียงพอ ไม่สามารถอนุมัติได้')
    }
  } else {
    await db
      .update(orders)
      .set({ status: nextStatus, note, updatedAt: new Date() })
      .where(eq(orders.id, id))
  }

  const order = await findOrder(db, id)
  return c.json({ order })
})

/**
 * POST /api/orders/:id/slip — ลูกค้าส่ง/แก้ไขสลิปโอนเงิน
 * ใช้ได้เมื่อ AWAITING_PAYMENT, PENDING_VERIFY (แทนที่รูปเดิม) หรือ REJECTED (ส่งใหม่)
 */
router.post('/:id/slip', authRequired, async (c) => {
  const db = getDb(c.env)
  const id = Number(c.req.param('id'))
  const body = await readBody(c)
  const slip = fileFrom(body, 'slip')
  if (!slip) throw new HttpError(400, 'กรุณาเลือกไฟล์สลิปก่อนส่ง')

  const found = await db.select().from(orders).where(eq(orders.id, id)).get()
  if (!found) throw new HttpError(404, 'ไม่พบคำสั่งซื้อนี้')
  if (found.userId !== c.get('user').id) throw new HttpError(403, 'คุณไม่มีสิทธิ์แก้ไขคำสั่งซื้อนี้')
  if (!['AWAITING_PAYMENT', 'PENDING_VERIFY', 'REJECTED'].includes(found.status)) {
    throw new HttpError(400, 'คำสั่งซื้อนี้ไม่อยู่ในสถานะที่ส่งสลิปได้')
  }

  const slipUrl = await saveUpload(c.env, slip, 'slips')
  await db
    .update(orders)
    .set({ slipUrl, status: 'PENDING_VERIFY', note: null, updatedAt: new Date() })
    .where(eq(orders.id, id))

  const order = await findOrder(db, id)
  return c.json({ order })
})

/** POST /api/orders/:id/cancel — ลูกค้ายกเลิกคำสั่งซื้อ (ได้เฉพาะก่อนอนุมัติสลิป) */
router.post('/:id/cancel', authRequired, async (c) => {
  const db = getDb(c.env)
  const id = Number(c.req.param('id'))
  const body = await readBody(c)

  const found = await db.select().from(orders).where(eq(orders.id, id)).get()
  if (!found) throw new HttpError(404, 'ไม่พบคำสั่งซื้อนี้')
  const user = c.get('user')
  if (found.userId !== user.id && user.role !== 'ADMIN') {
    throw new HttpError(403, 'คุณไม่มีสิทธิ์ยกเลิกคำสั่งซื้อนี้')
  }
  if (!canCancel(found.status)) {
    throw new HttpError(400, 'คำสั่งซื้อนี้ตรวจสอบแล้ว ยกเลิกไม่ได้ (โปรดติดต่อร้านค้า)')
  }

  await db
    .update(orders)
    .set({
      status: 'CANCELLED',
      note: body?.note?.trim() || 'ยกเลิกโดยลูกค้า',
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id))

  const order = await findOrder(db, id)
  return c.json({ order })
})

export default router
