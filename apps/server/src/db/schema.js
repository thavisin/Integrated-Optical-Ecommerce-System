import { relations, sql } from 'drizzle-orm'
import { check, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// ชื่อตาราง/คอลัมน์คงเดิมเหมือน Prisma ทุกตัวอักษร เพื่อให้ JSON ที่ส่งออกเหมือนเดิม
// เก็บ DateTime เป็น integer timestamp_ms (แบบเดียวกับที่ Prisma SQLite เก็บจริง)

const now = () => new Date()

export const users = sqliteTable('User', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('CUSTOMER'),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().$defaultFn(now),
})

export const products = sqliteTable(
  'Product',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    brand: text('brand').notNull().default(''),
    description: text('description').notNull().default(''),
    category: text('category').notNull().default('FRAME'),
    price: real('price').notNull(),
    stock: integer('stock').notNull().default(0),
    imageUrl: text('imageUrl'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().$defaultFn(now),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull().$defaultFn(now),
  },
  (t) => [check('Product_stock_check', sql`${t.stock} >= 0`)],
)

export const orders = sqliteTable('Order', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  total: real('total').notNull(),
  status: text('status').notNull().default('AWAITING_PAYMENT'),
  slipUrl: text('slipUrl'),
  note: text('note'),
  shippingName: text('shippingName').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().$defaultFn(now),
  updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull().$defaultFn(now),
})

export const orderItems = sqliteTable('OrderItem', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('orderId')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  productId: integer('productId')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({ orders: many(orders) }))

export const productsRelations = relations(products, ({ many }) => ({ orderItems: many(orderItems) }))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}))
