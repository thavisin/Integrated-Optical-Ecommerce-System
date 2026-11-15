import { and, asc, count, desc, eq, like, or } from 'drizzle-orm'
import { Hono } from 'hono'
import { getDb } from '../db/index.js'
import { orderItems, products } from '../db/schema.js'
import { HttpError } from '../lib/http.js'
import { fileFrom, readBody, saveUpload } from '../lib/upload.js'
import { adminRequired, authRequired } from '../middleware/auth.js'

const router = new Hono()

const CATEGORIES = ['FRAME', 'SUNGLASS', 'LENS', 'ACCESSORY']

function parseProductBody(body = {}) {
  const name = body.name?.trim()
  const brand = body.brand?.trim() || ''
  const description = body.description?.trim() || ''
  const category = CATEGORIES.includes(body.category) ? body.category : 'FRAME'
  const price = Number(body.price)
  const stock = Number.parseInt(body.stock, 10)

  if (!name) throw new HttpError(400, 'กรุณากรอกชื่อสินค้า')
  if (!Number.isFinite(price) || price <= 0) throw new HttpError(400, 'ราคาต้องเป็นตัวเลขที่มากกว่า 0')
  if (!Number.isInteger(stock) || stock < 0) throw new HttpError(400, 'สต็อกต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป')

  return { name, brand, description, category, price, stock }
}

/** GET /api/products — รายการสินค้า + text search + กรองหมวด + เรียงลำดับ + แบ่งหน้า (public) */
router.get('/', async (c) => {
  const db = getDb(c.env)
  const search = String(c.req.query('search') || '').trim()
  const category = String(c.req.query('category') || '').trim()
  const sort = String(c.req.query('sort') || 'newest')
  const page = Math.max(1, Number(c.req.query('page')) || 1)
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit')) || 12))

  const conditions = []
  if (search) {
    conditions.push(
      or(
        like(products.name, `%${search}%`),
        like(products.brand, `%${search}%`),
        like(products.description, `%${search}%`),
      ),
    )
  }
  if (category) conditions.push(eq(products.category, category))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const orderBy =
    {
      price_asc: asc(products.price),
      price_desc: desc(products.price),
      name: asc(products.name),
    }[sort] || desc(products.createdAt)

  const [totalRow, list] = await Promise.all([
    db.select({ value: count() }).from(products).where(where).get(),
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset((page - 1) * limit)
      .all(),
  ])

  const total = Number(totalRow?.value || 0)
  return c.json({ products: list, total, page, pages: Math.ceil(total / limit) || 1 })
})

/** GET /api/products/:id — รายละเอียดสินค้า (public) */
router.get('/:id', async (c) => {
  const db = getDb(c.env)
  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, Number(c.req.param('id'))))
    .get()
  if (!product) throw new HttpError(404, 'ไม่พบสินค้านี้')
  return c.json({ product })
})

/** POST /api/products — เพิ่มสินค้าใหม่ (admin) รองรับอัปโหลดรูป (multipart field: image) */
router.post('/', authRequired, adminRequired, async (c) => {
  const db = getDb(c.env)
  const body = await readBody(c)
  const data = parseProductBody(body)
  const image = fileFrom(body, 'image')
  const imageUrl = image ? await saveUpload(c.env, image, 'products') : body.imageUrl?.trim() || null

  const [product] = await db
    .insert(products)
    .values({ ...data, imageUrl, createdAt: new Date(), updatedAt: new Date() })
    .returning()

  return c.json({ product }, 201)
})

/** PUT /api/products/:id — แก้ไขสินค้า (admin) */
router.put('/:id', authRequired, adminRequired, async (c) => {
  const db = getDb(c.env)
  const id = Number(c.req.param('id'))
  const existing = await db.select().from(products).where(eq(products.id, id)).get()
  if (!existing) throw new HttpError(404, 'ไม่พบสินค้านี้')

  const body = await readBody(c)
  const data = parseProductBody(body)
  const image = fileFrom(body, 'image')

  let imageUrl
  if (image) {
    imageUrl = await saveUpload(c.env, image, 'products')
  } else if (typeof body.imageUrl === 'string') {
    imageUrl = body.imageUrl.trim() || null
  } else {
    imageUrl = existing.imageUrl
  }

  const [product] = await db
    .update(products)
    .set({ ...data, imageUrl, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning()

  return c.json({ product })
})

/** DELETE /api/products/:id — ลบสินค้า (admin) */
router.delete('/:id', authRequired, adminRequired, async (c) => {
  const db = getDb(c.env)
  const id = Number(c.req.param('id'))

  const used = await db
    .select({ value: count() })
    .from(orderItems)
    .where(eq(orderItems.productId, id))
    .get()
  if (Number(used?.value || 0) > 0) {
    throw new HttpError(400, 'สินค้านี้มีประวัติในคำสั่งซื้อจึงลบไม่ได้ (แนะนำปรับสต็อกเป็น 0 แทน)')
  }

  const [product] = await db.delete(products).where(eq(products.id, id)).returning()
  if (!product) throw new HttpError(404, 'ไม่พบสินค้านี้')
  return c.json({ product })
})

export default router
