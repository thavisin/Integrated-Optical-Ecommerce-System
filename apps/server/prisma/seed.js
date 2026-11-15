import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const prisma = new PrismaClient()

const productsDir = path.join(__dirname, '..', 'public', 'uploads', 'products')
const slipsDir = path.join(__dirname, '..', 'public', 'uploads', 'slips')
fs.mkdirSync(productsDir, { recursive: true })
fs.mkdirSync(slipsDir, { recursive: true })

/* ---------- รูปภาพตัวอย่าง (SVG placeholder) ---------- */

function glassesSvg(brand, c1, c2) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <g stroke="#ffffff" stroke-width="14" fill="rgba(255,255,255,0.12)" stroke-linecap="round">
    <circle cx="275" cy="290" r="95"/>
    <circle cx="525" cy="290" r="95"/>
    <path d="M370 290 Q400 250 430 290"/>
    <path d="M182 275 L120 245"/>
    <path d="M618 275 L680 245"/>
  </g>
  <text x="400" y="480" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="38" font-weight="700" fill="#ffffff">${brand}</text>
</svg>`
}

function slipSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="720" viewBox="0 0 520 720">
  <rect width="520" height="720" fill="#f8fafc"/>
  <rect width="520" height="110" fill="#0f766e"/>
  <text x="260" y="50" text-anchor="middle" font-family="Helvetica" font-size="24" font-weight="700" fill="#ffffff">ใบโอนเงิน / PAYMENT SLIP</text>
  <text x="260" y="82" text-anchor="middle" font-family="Helvetica" font-size="16" fill="#ccfbf1">Mobile Banking — โอนเข้าบัญชีร้าน OptiMart</text>
  <rect x="40" y="150" width="440" height="500" rx="16" fill="#ffffff" stroke="#e2e8f0"/>
  <circle cx="260" cy="230" r="44" fill="#0f766e"/>
  <text x="260" y="240" text-anchor="middle" font-family="Helvetica" font-size="26" fill="#ffffff">K</text>
  <text x="260" y="310" text-anchor="middle" font-family="Helvetica" font-size="16" fill="#64748b">โอนสำเร็จ</text>
  <text x="260" y="365" text-anchor="middle" font-family="Helvetica" font-size="38" font-weight="700" fill="#0f172a">฿ 5,490.00</text>
  <line x1="80" y1="400" x2="440" y2="400" stroke="#e2e8f0"/>
  <text x="90" y="440" font-family="Helvetica" font-size="15" fill="#94a3b8">จากบัญชี</text>
  <text x="430" y="440" text-anchor="end" font-family="Helvetica" font-size="15" fill="#0f172a">xxx-x-x1234-6</text>
  <text x="90" y="480" font-family="Helvetica" font-size="15" fill="#94a3b8">เข้าบัญชี</text>
  <text x="430" y="480" text-anchor="end" font-family="Helvetica" font-size="15" fill="#0f172a">OptiMart Co., Ltd. (KBANK)</text>
  <text x="90" y="520" font-family="Helvetica" font-size="15" fill="#94a3b8">วันที่</text>
  <text x="430" y="520" text-anchor="end" font-family="Helvetica" font-size="15" fill="#0f172a">15-11-2026 10:24 น.</text>
  <text x="90" y="560" font-family="Helvetica" font-size="15" fill="#94a3b8">เลขอ้างอิง</text>
  <text x="430" y="560" text-anchor="end" font-family="Helvetica" font-size="15" fill="#0f172a">TXN20261115-004218</text>
  <rect x="150" y="600" width="220" height="28" rx="6" fill="#e2e8f0"/>
  <text x="260" y="619" text-anchor="middle" font-family="Helvetica" font-size="13" fill="#64748b">DEMO SLIP (ข้อมูลสมมติ)</text>
</svg>`
}

/* ---------- ข้อมูลสินค้าตัวอย่าง ---------- */

const PRODUCTS = [
  {
    name: 'Ray-Ban RB2140 Original Wayfarer',
    brand: 'Ray-Ban',
    category: 'SUNGLASS',
    price: 5490,
    stock: 14,
    description: 'แว่นกันแดดสุดคลาสสิก กรอบ Wayfarer สีดำ เลนส์ G-15 กัน UV400 เหมาะทั้งผู้ชายผู้หญิง',
    file: 'rayban-wayfarer.svg',
    colors: ['#111827', '#374151'],
  },
  {
    name: 'Oakley Holbrook Round',
    brand: 'Oakley',
    category: 'SUNGLASS',
    price: 6900,
    stock: 9,
    description: 'แว่นกันแดดกีฬาสไตล์ Retroluxe เลนส์ Prizm เพิ่มความคมชัด กันแดด UV400 เหมาะกับกิจกรรมกลางแจ้ง',
    file: 'oakley-holbrook.svg',
    colors: ['#0c4a6e', '#0284c7'],
  },
  {
    name: 'JINS Classico JF-21A',
    brand: 'JINS',
    category: 'FRAME',
    price: 1590,
    stock: 25,
    description: 'กรอบแว่นสายตาสไตล์ญี่ปุ่น น้ำหนักเบา ใส่สบายทั้งวัน มาพร้อมเลนส์แอสเฟอริกมาตรฐาน',
    file: 'jins-classico.svg',
    colors: ['#4c1d95', '#7c3aed'],
  },
  {
    name: 'OWNDAYS Classic Air Frame',
    brand: 'OWNDAYS',
    category: 'FRAME',
    price: 1290,
    stock: 30,
    description: 'กรอบแว่นไร้น้ำหนัก วัสดุ TR90 ยืดหยุ่นสูง เหมาะกับการใช้งานทั่วไปและสายตาสั้น/ยาว',
    file: 'owndays-air.svg',
    colors: ['#065f46', '#10b981'],
  },
  {
    name: 'Gentle Monster Bold Collection',
    brand: 'Gentle Monster',
    category: 'SUNGLASS',
    price: 9900,
    stock: 5,
    description: 'แว่นกันแดดดีไซน์โดดเด่นสไตล์เกาหลี กรอบหนา สีมาตรฐาน การันตีความปังทุกมุมถ่าย',
    file: 'gentle-monster.svg',
    colors: ['#18181b', '#71717a'],
  },
  {
    name: 'Vogue VO5396S Feminine',
    brand: 'Vogue Eyewear',
    category: 'SUNGLASS',
    price: 3290,
    stock: 11,
    description: 'แว่นกันแดดสำหรับผู้หญิง กรอบโค้งมน เลนส์ไล่เฉด ออกแบบมาเน้นความน่ารักและทันสมัย',
    file: 'vogue-feminine.svg',
    colors: ['#9d174d', '#ec4899'],
  },
  {
    name: 'กรอบแว่นไททาเนียม Ultra Light',
    brand: 'OptiMart',
    category: 'FRAME',
    price: 2990,
    stock: 18,
    description: 'กรอบแว่นไททาเนียมเกรดพรีเมียม เบาเป็นพิเศษ แข็งแรง ไม่ก่อนการแพ้ ผลิตในไทย',
    file: 'optimart-titanium.svg',
    colors: ['#78350f', '#d97706'],
  },
  {
    name: 'กรอบแว่นเด็ก Kids Flex Safe',
    brand: 'OptiMart',
    category: 'FRAME',
    price: 890,
    stock: 22,
    description: 'กรอบแว่นสำหรับเด็ก วัสดุนิรภัยไม่แตกหัก สายคล้องกันหล่น ปรับได้ทุกขนาดหน้า',
    file: 'optimart-kids.svg',
    colors: ['#1d4ed8', '#60a5fa'],
  },
  {
    name: 'เลนส์กรองแสงน้ำเงิน Blue-Cut 1.60',
    brand: 'Hoya',
    category: 'LENS',
    price: 2490,
    stock: 40,
    description: 'เลนส์สายตาดัชนี 1.60 เคลือบกรองแสงน้ำเงินจากหน้าจอ ลดอาการตาแห้ง ตาล้าง เหมาะกับคนทำงานหน้าคอม',
    file: 'hoya-bluecut.svg',
    colors: ['#0891b2', '#22d3ee'],
  },
  {
    name: 'คอนแท็คเลนส์รายเดือน 30 วัน',
    brand: 'Bausch+Lomb',
    category: 'LENS',
    price: 450,
    stock: 3,
    description: 'คอนแท็คเลนส์ใสได้ 30 วัน/คู่ ค่าออกซิเจนสูง ใส่สบาย ชุดละ 2 ข้าง',
    file: 'bausch-monthly.svg',
    colors: ['#155e75', '#67e8f9'],
  },
  {
    name: 'น้ำยาล้างคอนแท็คเลนส์ 360ml',
    brand: 'OptiFree',
    category: 'ACCESSORY',
    price: 220,
    stock: 50,
    description: 'น้ำยาล้าง+ถนอมคอนแท็คเลนส์ ฆ่าเชื้อ 99.9% ใช้ได้ทุกเลนส์นุ่ม ขวด 360 มล.',
    file: 'optifree-solution.svg',
    colors: ['#312e81', '#818cf8'],
  },
  {
    name: 'กล่องเก็บแว่น หนังแท้ + ผ้าเช็ด',
    brand: 'OptiMart',
    category: 'ACCESSORY',
    price: 350,
    stock: 35,
    description: 'กล่องเก็บแว่นหนังแท้แข็งแรง กันกระแทก มาพร้อมผ้าไมโครไฟเบอร์เช็ดเลนส์',
    file: 'optimart-case.svg',
    colors: ['#374151', '#9ca3af'],
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
const pick = (arr) => arr[rand(arr.length)]

async function main() {
  console.log('🌱 Seeding OptiMart database...')

  // ---- users ----
  const adminPass = await bcrypt.hash('admin123', 10)
  const customerPass = await bcrypt.hash('customer123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@optimart.com' },
    update: { role: 'ADMIN' },
    create: { name: 'ผู้ดูแลระบบ OptiMart', email: 'admin@optimart.com', password: adminPass, role: 'ADMIN' },
  })

  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: { name: 'สมชาย ใจดี', email: 'customer@example.com', password: customerPass, role: 'CUSTOMER' },
  })
  console.log('👤 Users ready: admin@optimart.com / customer@example.com')

  // ---- demo slip ----
  const slipFile = path.join(slipsDir, 'demo-slip.svg')
  if (!fs.existsSync(slipFile)) fs.writeFileSync(slipFile, slipSvg())

  // ---- products ----
  const existingCount = await prisma.product.count()
  if (existingCount === 0) {
    for (const p of PRODUCTS) {
      const svgFile = path.join(productsDir, p.file)
      if (!fs.existsSync(svgFile)) fs.writeFileSync(svgFile, glassesSvg(p.brand, p.colors[0], p.colors[1]))
      await prisma.product.create({
        data: {
          name: p.name,
          brand: p.brand,
          category: p.category,
          price: p.price,
          stock: p.stock,
          description: p.description,
          imageUrl: `/uploads/products/${p.file}`,
        },
      })
    }
    console.log(`🕶️  Created ${PRODUCTS.length} products`)
  } else {
    console.log(`🕶️  Products already exist (${existingCount}), skip`)
  }

  // ---- demo orders ----
  const orderCount = await prisma.order.count()
  if (orderCount === 0) {
    const products = await prisma.product.findMany()
    for (const d of DEMO_ORDERS) {
      const itemCount = 1 + rand(2)
      const chosen = [...products].sort(() => Math.random() - 0.5).slice(0, itemCount)
      const items = chosen.map((prod) => ({ productId: prod.id, quantity: 1 + rand(2), price: prod.price }))
      const total = items.reduce((s, it) => s + it.price * it.quantity, 0)
      const createdAt = new Date(Date.now() - d.daysAgo * 86400000 - rand(20) * 3600000)
      const hasSlip = d.status !== 'AWAITING_PAYMENT'
      await prisma.order.create({
        data: {
          userId: customer.id,
          total,
          status: d.status,
          slipUrl: hasSlip ? '/uploads/slips/demo-slip.svg' : null,
          note: d.note || null,
          shippingName: customer.name,
          phone: '081-234-5678',
          address: '123/45 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110',
          items: { create: items.map((it) => ({ productId: it.productId, quantity: it.quantity, price: it.price })) },
          createdAt,
        },
      })
    }
    console.log(`🧾 Created ${DEMO_ORDERS.length} demo orders`)
  } else {
    console.log(`🧾 Orders already exist (${orderCount}), skip`)
  }

  console.log('✅ Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
