import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { notFound, onError } from './middleware/error.js'
import adminRoutes from './routes/admin.js'
import authRoutes from './routes/auth.js'
import orderRoutes from './routes/orders.js'
import productRoutes from './routes/products.js'

const app = new Hono()

// CORS — CORS_ORIGIN รองรับหลาย origin คั่นด้วย comma (ค่าเริ่มต้นคือ localhost:3000)
app.use('*', async (c, next) => {
  const origins = String(c.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  const origin = origins.length === 0 || origins.includes('*') ? '*' : origins
  return cors({ origin })(c, next)
})

app.get('/api/health', (c) => c.json({ ok: true, service: 'optimart-api' }))

app.route('/api/auth', authRoutes)
app.route('/api/products', productRoutes)
app.route('/api/orders', orderRoutes)
app.route('/api/admin', adminRoutes)

// ให้บริการไฟล์สลิป/รูปสินค้าจาก R2 (key: products/<name>, slips/<name>)
app.get('/uploads/*', async (c) => {
  const key = c.req.path.slice('/uploads/'.length)
  const object = await c.env.BUCKET.get(key)
  if (!object) return c.notFound()

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('content-length', String(object.size))
  if (key.startsWith('products/')) {
    headers.set('cache-control', 'public, max-age=31536000, immutable')
  }
  return new Response(object.body, { headers })
})

app.notFound(notFound)
app.onError(onError)

export default app
