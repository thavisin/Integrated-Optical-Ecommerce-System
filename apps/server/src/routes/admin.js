import { count, desc, eq, inArray, lte } from 'drizzle-orm'
import { Hono } from 'hono'
import { getDb } from '../db/index.js'
import { orderItems, orders, products, users } from '../db/schema.js'
import { adminRequired, authRequired } from '../middleware/auth.js'

const router = new Hono()

// สถานะที่นับเป็นยอดขาย (ชำระเงินแล้ว)
const PAID_STATUSES = ['PAID', 'SHIPPED', 'COMPLETED']

const pad2 = (n) => String(n).padStart(2, '0')
const localDateKey = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
const localMonthKey = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`

/**
 * GET /api/admin/stats — ข้อมูลสรุปสำหรับ Sales Analytics Dashboard (admin)
 * cards / revenueByDay (14 วัน) / revenueByMonth (6 เดือน) / topProducts / ordersByStatus / recentOrders
 */
router.get('/stats', authRequired, adminRequired, async (c) => {
  const db = getDb(c.env)

  const [paidOrders, totalOrdersRow, customersRow, productsRow, pendingVerifyRow, lowStockRow, statusGroups, recentOrders, soldItems] =
    await Promise.all([
      db.select({ total: orders.total, createdAt: orders.createdAt }).from(orders).where(inArray(orders.status, PAID_STATUSES)).all(),
      db.select({ value: count() }).from(orders).get(),
      db.select({ value: count() }).from(users).where(eq(users.role, 'CUSTOMER')).get(),
      db.select({ value: count() }).from(products).get(),
      db.select({ value: count() }).from(orders).where(eq(orders.status, 'PENDING_VERIFY')).get(),
      db.select({ value: count() }).from(products).where(lte(products.stock, 3)).get(),
      db.select({ status: orders.status, value: count() }).from(orders).groupBy(orders.status).all(),
      db.query.orders.findMany({
        orderBy: [desc(orders.createdAt)],
        limit: 8,
        with: {
          user: { columns: { name: true } },
          items: { columns: { quantity: true } },
        },
      }),
      db
        .select({
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          productName: products.name,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(inArray(orders.status, PAID_STATUSES))
        .all(),
    ])

  const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0)

  // รายได้แยกตามวัน (14 วันล่าสุด) — เติมวันที่ไม่มียอดเป็น 0
  const dayMap = new Map()
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    dayMap.set(localDateKey(d), { date: localDateKey(d), amount: 0, orders: 0 })
  }
  for (const o of paidOrders) {
    const day = dayMap.get(localDateKey(o.createdAt))
    if (day) {
      day.amount += o.total
      day.orders += 1
    }
  }

  // รายได้แยกตามเดือน (6 เดือนล่าสุด) — แนวโน้มรายเดือน
  const monthMap = new Map()
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    monthMap.set(localMonthKey(d), { month: localMonthKey(d), amount: 0, orders: 0 })
  }
  for (const o of paidOrders) {
    const m = monthMap.get(localMonthKey(o.createdAt))
    if (m) {
      m.amount += o.total
      m.orders += 1
    }
  }

  // สินค้าขายดี (เรียงตามจำนวนชิ้นที่ขายได้)
  const productAgg = new Map()
  for (const it of soldItems) {
    const cur = productAgg.get(it.productId) || { name: it.productName, quantity: 0, revenue: 0 }
    cur.quantity += it.quantity
    cur.revenue += it.quantity * it.price
    productAgg.set(it.productId, cur)
  }
  const topProducts = [...productAgg.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5)

  return c.json({
    cards: {
      revenue,
      totalOrders: Number(totalOrdersRow?.value || 0),
      customers: Number(customersRow?.value || 0),
      products: Number(productsRow?.value || 0),
      pendingVerify: Number(pendingVerifyRow?.value || 0),
      lowStock: Number(lowStockRow?.value || 0),
    },
    revenueByDay: [...dayMap.values()],
    revenueByMonth: [...monthMap.values()],
    topProducts,
    ordersByStatus: statusGroups.map((g) => ({ status: g.status, count: Number(g.value) })),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
      customer: o.user.name,
      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    })),
  })
})

export default router
