import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { hashPassword } from '../src/lib/password.js'

// สร้าง seed/seed.sql (ลบข้อมูลเดิมแล้วใส่ชุดตัวอย่าง) — รันด้วย `npm run seed`
// รหัสผ่านแฮชด้วย PBKDF2 helper ตัวเดียวกับที่ API ใช้ตรวจ

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_FILE = path.join(__dirname, 'seed.sql')
const now = Date.now()

const q = (value) => (value === null || value === undefined ? 'NULL' : `'${String(value).replace(/'/g, "''")}'`)

/* ---------- ข้อมูลสินค้าตัวอย่าง (เหมือน seed เดิม) ---------- */

const PRODUCTS = [
  {
    name: 'Ray-Ban RB2140 Original Wayfarer',
    brand: 'Ray-Ban',
    category: 'SUNGLASS',
    price: 5490,
    stock: 14,
    description: 'แว่นกันแดดสุดคลาสสิก กรอบ Wayfarer สีดำ เลนส์ G-15 กัน UV400 เหมาะทั้งผู้ชายผู้หญิง',
    file: 'photo-01.jpg',
  },
  {
    name: 'Oakley Holbrook Round',
    brand: 'Oakley',
    category: 'SUNGLASS',
    price: 6900,
    stock: 9,
    description: 'แว่นกันแดดกีฬาสไตล์ Retroluxe เลนส์ Prizm เพิ่มความคมชัด กันแดด UV400 เหมาะกับกิจกรรมกลางแจ้ง',
    file: 'photo-02.jpg',
  },
  {
    name: 'JINS Classico JF-21A',
    brand: 'JINS',
    category: 'FRAME',
    price: 1590,
    stock: 25,
    description: 'กรอบแว่นสายตาสไตล์ญี่ปุ่น น้ำหนักเบา ใส่สบายทั้งวัน มาพร้อมเลนส์แอสเฟอริกมาตรฐาน',
    file: 'photo-03.jpg',
  },
  {
    name: 'OWNDAYS Classic Air Frame',
    brand: 'OWNDAYS',
    category: 'FRAME',
    price: 1290,
    stock: 30,
    description: 'กรอบแว่นไร้น้ำหนัก วัสดุ TR90 ยืดหยุ่นสูง เหมาะกับการใช้งานทั่วไปและสายตาสั้น/ยาว',
    file: 'photo-04.jpg',
  },
  {
    name: 'Gentle Monster Bold Collection',
    brand: 'Gentle Monster',
    category: 'SUNGLASS',
    price: 9900,
    stock: 5,
    description: 'แว่นกันแดดดีไซน์โดดเด่นสไตล์เกาหลี กรอบหนา สีมาตรฐาน การันตีความปังทุกมุมถ่าย',
    file: 'photo-05.jpg',
  },
  {
    name: 'Vogue VO5396S Feminine',
    brand: 'Vogue Eyewear',
    category: 'SUNGLASS',
    price: 3290,
    stock: 11,
    description: 'แว่นกันแดดสำหรับผู้หญิง กรอบโค้งมน เลนส์ไล่เฉด ออกแบบมาเน้นความน่ารักและทันสมัย',
    file: 'photo-06.jpg',
  },
  {
    name: 'กรอบแว่นไททาเนียม Ultra Light',
    brand: 'OptiMart',
    category: 'FRAME',
    price: 2990,
    stock: 18,
    description: 'กรอบแว่นไททาเนียมเกรดพรีเมียม เบาเป็นพิเศษ แข็งแรง ไม่ก่อนการแพ้ ผลิตในไทย',
    file: 'photo-07.jpg',
  },
  {
    name: 'กรอบแว่นเด็ก Kids Flex Safe',
    brand: 'OptiMart',
    category: 'FRAME',
    price: 890,
    stock: 22,
    description: 'กรอบแว่นสำหรับเด็ก วัสดุนิรภัยไม่แตกหัก สายคล้องกันหล่น ปรับได้ทุกขนาดหน้า',
    file: 'photo-08.jpg',
  },
  {
    name: 'เลนส์กรองแสงน้ำเงิน Blue-Cut 1.60',
    brand: 'Hoya',
    category: 'LENS',
    price: 2490,
    stock: 40,
    description: 'เลนส์สายตาดัชนี 1.60 เคลือบกรองแสงน้ำเงินจากหน้าจอ ลดอาการตาแห้ง ตาล้าง เหมาะกับคนทำงานหน้าคอม',
    file: 'photo-09.jpg',
  },
  {
    name: 'คอนแท็คเลนส์รายเดือน 30 วัน',
    brand: 'Bausch+Lomb',
    category: 'LENS',
    price: 450,
    stock: 3,
    description: 'คอนแท็คเลนส์ใส่ได้ 30 วัน/คู่ ค่าออกซิเจนสูง ใส่สบาย ชุดละ 2 ข้าง',
    file: 'photo-10.jpg',
  },
  {
    name: 'น้ำยาล้างคอนแท็คเลนส์ 360ml',
    brand: 'OptiFree',
    category: 'ACCESSORY',
    price: 220,
    stock: 50,
    description: 'น้ำยาล้าง+ถนอมคอนแท็คเลนส์ ฆ่าเชื้อ 99.9% ใช้ได้ทุกเลนส์นุ่ม ขวด 360 มล.',
    file: 'photo-11.jpg',
  },
  {
    name: 'กล่องเก็บแว่น หนังแท้ + ผ้าเช็ด',
    brand: 'OptiMart',
    category: 'ACCESSORY',
    price: 350,
    stock: 35,
    description: 'กล่องเก็บแว่นหนังแท้แข็งแรง กันกระแทก มาพร้อมผ้าไมโครไฟเบอร์เช็ดเลนส์',
    file: 'photo-12.jpg',
  },
]

/* ---------- คำสั่งซื้อตัวอย่าง (กระจาย ~5 เดือน) ---------- */

const DEMO_ORDERS = [
  { status: 'COMPLETED', daysAgo: 145 },
  { status: 'COMPLETED', daysAgo: 132 },
  { status: 'COMPLETED', daysAgo: 120 },
  { status: 'CANCELLED', daysAgo: 115 },
  { status: 'COMPLETED', daysAgo: 104 },
  { status: 'COMPLETED', daysAgo: 96 },
  { status: 'COMPLETED', daysAgo: 88 },
  { status: 'COMPLETED', daysAgo: 75 },
  { status: 'COMPLETED', daysAgo: 66 },
  { status: 'COMPLETED', daysAgo: 55 },
  { status: 'SHIPPED', daysAgo: 47 },
  { status: 'COMPLETED', daysAgo: 41 },
  { status: 'COMPLETED', daysAgo: 34 },
  { status: 'SHIPPED', daysAgo: 27 },
  { status: 'PAID', daysAgo: 22 },
  { status: 'COMPLETED', daysAgo: 18 },
  { status: 'SHIPPED', daysAgo: 13 },
  { status: 'PAID', daysAgo: 9 },
  { status: 'COMPLETED', daysAgo: 6 },
  { status: 'SHIPPED', daysAgo: 4 },
  { status: 'REJECTED', daysAgo: 3, note: 'ยอดเงินในสลิปไม่ตรงกับคำสั่งซื้อ กรุณาตรวจสอบและอัปโหลดสลิปใหม่' },
  { status: 'PAID', daysAgo: 2 },
  { status: 'PENDING_VERIFY', daysAgo: 1 },
  { status: 'PENDING_VERIFY', daysAgo: 0 },
  { status: 'AWAITING_PAYMENT', daysAgo: 0 },
]

const rand = (n) => Math.floor(Math.random() * n)

async function main() {
  const adminPassword = await hashPassword('admin123')
  const customerPassword = await hashPassword('customer123')

  const lines = [
    '-- สร้างอัตโนมัติโดย seed/build-seed.js — อย่าแก้ด้วยมือ',
    '-- `npm run seed` จะลบข้อมูลเดิมทั้งหมดแล้วใส่ข้อมูลตัวอย่างชุดนี้',
    '',
    'DELETE FROM "OrderItem";',
    'DELETE FROM "Order";',
    'DELETE FROM "Product";',
    'DELETE FROM "User";',
    '',
    `INSERT INTO "User" ("id", "name", "email", "password", "role", "createdAt") VALUES`,
    `  (1, ${q('ผู้ดูแลระบบ OptiMart')}, ${q('admin@optimart.com')}, ${q(adminPassword)}, 'ADMIN', ${now}),`,
    `  (2, ${q('สมชาย ใจดี')}, ${q('customer@example.com')}, ${q(customerPassword)}, 'CUSTOMER', ${now});`,
    '',
    'INSERT INTO "Product" ("id", "name", "brand", "description", "category", "price", "stock", "imageUrl", "createdAt", "updatedAt") VALUES',
  ]

  const productValues = PRODUCTS.map((p, index) => {
    const id = index + 1
    return `  (${id}, ${q(p.name)}, ${q(p.brand)}, ${q(p.description)}, ${q(p.category)}, ${p.price}, ${p.stock}, ${q(`/uploads/products/${p.file}`)}, ${now}, ${now})`
  })
  lines.push(productValues.join(',\n') + ';', '')

  // ---- demo orders (สุ่มรายการเหมือน seed เดิม) ----
  const orderValues = []
  const itemValues = []
  let itemId = 1

  DEMO_ORDERS.forEach((demo, index) => {
    const orderId = index + 1
    const itemCount = 1 + rand(2)
    const chosen = [...PRODUCTS].sort(() => Math.random() - 0.5).slice(0, itemCount)
    const items = chosen.map((product) => {
      const productId = PRODUCTS.indexOf(product) + 1
      return { productId, quantity: 1 + rand(2), price: product.price }
    })
    const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
    const createdAt = now - demo.daysAgo * 86400000 - rand(20) * 3600000
    const hasSlip = demo.status !== 'AWAITING_PAYMENT'

    orderValues.push(
      `  (${orderId}, 2, ${total}, ${q(demo.status)}, ${q(hasSlip ? '/uploads/slips/demo-slip.svg' : null)}, ${q(demo.note || null)}, ${q('สมชาย ใจดี')}, ${q('081-234-5678')}, ${q('123/45 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110')}, ${createdAt}, ${now})`,
    )

    for (const item of items) {
      itemValues.push(`  (${itemId++}, ${orderId}, ${item.productId}, ${item.quantity}, ${item.price})`)
    }
  })

  lines.push(
    'INSERT INTO "Order" ("id", "userId", "total", "status", "slipUrl", "note", "shippingName", "phone", "address", "createdAt", "updatedAt") VALUES',
    orderValues.join(',\n') + ';',
    '',
    'INSERT INTO "OrderItem" ("id", "orderId", "productId", "quantity", "price") VALUES',
    itemValues.join(',\n') + ';',
    '',
  )

  writeFileSync(OUT_FILE, lines.join('\n'))
  console.log(`🌱 seed.sql written (${PRODUCTS.length} products, ${DEMO_ORDERS.length} orders)`)
}

await main()
