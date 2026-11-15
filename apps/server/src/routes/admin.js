import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authRequired, adminRequired } from '../middleware/auth.js'

const router = Router()

// สถานะที่นับเป็นยอดขาย (ชำระเงินแล้ว)
const PAID_STATUSES = ['PAID', 'SHIPPED', 'COMPLETED']

const pad2 = (n) => String(n).padStart(2, '0')
const localDateKey = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
const localMonthKey = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`

/**
 * GET /api/admin/stats — ข้อมูลสรุปสำหรับ Sales Analytics Dashboard (admin)
 * cards / revenueByDay (14 วัน) / revenueByMonth (6 เดือน) / topProducts / ordersByStatus / recentOrders
 */
router.get('/stats', authRequired, adminRequired, async (req, res, next) => {
  try {
    const [paidOrders, totalOrders, customers, products, pendingVerify, lowStock, statusGroups, recentOrders, orderItems] =
      await Promise.all([
        prisma.order.findMany({ where: { status: { in: PAID_STATUSES } }, select: { total: true, createdAt: true } }),
        prisma.order.count(),
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.product.count(),
        prisma.order.count({ where: { status: 'PENDING_VERIFY' } }),
        prisma.product.count({ where: { stock: { lte: 3 } } }),
        prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
          include: { user: { select: { name: true } }, items: true },
        }),
        prisma.orderItem.findMany({
          where: { order: { status: { in: PAID_STATUSES } } },
          include: { product: { select: { name: true } } },
        }),
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
    for (const it of orderItems) {
      const cur = productAgg.get(it.productId) || { name: it.product.name, quantity: 0, revenue: 0 }
      cur.quantity += it.quantity
      cur.revenue += it.quantity * it.price
      productAgg.set(it.productId, cur)
    }
    const topProducts = [...productAgg.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5)

    res.json({
      cards: { revenue, totalOrders, customers, products, pendingVerify, lowStock },
      revenueByDay: [...dayMap.values()],
      revenueByMonth: [...monthMap.values()],
      topProducts,
      ordersByStatus: statusGroups.map((g) => ({ status: g.status, count: g._count._all })),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
        customer: o.user.name,
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      })),
    })
  } catch (err) {
    next(err)
  }
})

export default router
