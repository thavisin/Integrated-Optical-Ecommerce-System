import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authRequired, adminRequired } from '../middleware/auth.js'
import { uploadProduct } from '../middleware/upload.js'
import { HttpError } from '../middleware/error.js'

const router = Router()

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
router.get('/', async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim()
    const category = String(req.query.category || '').trim()
    const sort = String(req.query.sort || 'newest')
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 12))

    const where = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (category) where.category = category

    const orderBy = {
      price_asc: { price: 'asc' },
      price_desc: { price: 'desc' },
      name: { name: 'asc' },
    }[sort] || { createdAt: 'desc' }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
    ])

    res.json({ products, total, page, pages: Math.ceil(total / limit) || 1 })
  } catch (err) {
    next(err)
  }
})

/** GET /api/products/:id — รายละเอียดสินค้า (public) */
router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) } })
    if (!product) throw new HttpError(404, 'ไม่พบสินค้านี้')
    res.json({ product })
  } catch (err) {
    next(err)
  }
})

/** POST /api/products — เพิ่มสินค้าใหม่ (admin) รองรับอัปโหลดรูป (multipart field: image) */
router.post('/', authRequired, adminRequired, uploadProduct.single('image'), async (req, res, next) => {
  try {
    const data = parseProductBody(req.body)
    data.imageUrl = req.file ? `/uploads/products/${req.file.filename}` : (req.body.imageUrl?.trim() || null)
    const product = await prisma.product.create({ data })
    res.status(201).json({ product })
  } catch (err) {
    next(err)
  }
})

/** PUT /api/products/:id — แก้ไขสินค้า (admin) */
router.put('/:id', authRequired, adminRequired, uploadProduct.single('image'), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) throw new HttpError(404, 'ไม่พบสินค้านี้')

    const data = parseProductBody(req.body)
    if (req.file) {
      data.imageUrl = `/uploads/products/${req.file.filename}`
    } else if (typeof req.body.imageUrl === 'string') {
      data.imageUrl = req.body.imageUrl.trim() || null
    } else {
      data.imageUrl = existing.imageUrl
    }

    const product = await prisma.product.update({ where: { id }, data })
    res.json({ product })
  } catch (err) {
    next(err)
  }
})

/** DELETE /api/products/:id — ลบสินค้า (admin) */
router.delete('/:id', authRequired, adminRequired, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const usedCount = await prisma.orderItem.count({ where: { productId: id } })
    if (usedCount > 0) {
      throw new HttpError(400, 'สินค้านี้มีประวัติในคำสั่งซื้อจึงลบไม่ได้ (แนะนำปรับสต็อกเป็น 0 แทน)')
    }
    const product = await prisma.product.delete({ where: { id } })
    res.json({ product })
  } catch (err) {
    next(err)
  }
})

export default router
