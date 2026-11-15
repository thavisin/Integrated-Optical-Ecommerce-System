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

/* ---------- ภาพสินค้า: การ์ดสเปคสินค้าแบบแคตตาล็อกร้านแว่น (specimen card) ----------
   ลายเส้นหน้ากรอบหนึ่งเส้นเดียวทั้งร้าน + สเปคตัวเลขแบบ mono ใต้ภาพ
   สีอ้างอิงจากธีม Dose: กระดาษอุ่น หมึกเขียวดำ เขียวร้านหนึ่งเส้น */

const C = {
  paper: '#F7F3E9',
  ink: '#2B3634',
  rule: '#D9DCD2',
  muted: '#77827C',
  accent: '#1E7A5A',
}

function specimen({ category, brand, spec, shape }) {
  const W = 800, H = 600
  const label = category === 'SUNGLASS' ? 'SUN' : category === 'LENS' ? 'LENS' : category === 'ACCESSORY' ? 'ACC' : 'OPT'
  const g = (inner) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"/><feColorMatrix values="0 0 0 0 0.3 0 0 0 0 0.34 0 0 0 0 0.32 0 0 0 0.05 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="${C.paper}"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.5"/>
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="${C.rule}" stroke-width="1.5"/>
  <text x="48" y="72" font-family="'IBM Plex Mono', 'SF Mono', Menlo, monospace" font-size="22" fill="${C.ink}">${brand}</text>
  <text x="${W - 48}" y="72" text-anchor="end" font-family="'IBM Plex Mono', 'SF Mono', Menlo, monospace" font-size="16" fill="${C.muted}">${label}</text>
  <g stroke="${C.ink}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round">
${inner}
  </g>
  <text x="48" y="${H - 52}" font-family="'IBM Plex Mono', 'SF Mono', Menlo, monospace" font-size="22" fill="${C.ink}">${spec}</text>
  <text x="${W - 48}" y="${H - 52}" text-anchor="end" font-family="'IBM Plex Mono', 'SF Mono', Menlo, monospace" font-size="16" fill="${C.accent}">OptiMart</text>
</svg>`

  /* หน้ากรอบแว่นแต่ละแบบ วาดบนกริดกลางภาพ (กลางที่ 300) */
  const shapes = {
    wayfarer: `<path d="M170 260 L330 240 Q360 236 396 240 Q432 236 462 240 L630 260 Q648 262 646 282 L636 356 Q632 386 600 390 L470 396 Q440 398 428 370 L414 330 Q400 308 386 330 L372 370 Q360 398 330 396 L200 390 Q168 386 164 356 L154 282 Q152 262 170 260 Z"/>
      <path d="M164 268 Q400 224 636 268" stroke-width="9"/>`,
    sport: `<rect x="168" y="252" width="212" height="128" rx="26"/>
      <rect x="420" y="252" width="212" height="128" rx="26"/>
      <path d="M380 268 Q400 252 420 268"/>
      <path d="M168 264 L128 244 M632 264 L672 244"/>`,
    roundFull: `<circle cx="272" cy="308" r="88"/>
      <circle cx="528" cy="308" r="88"/>
      <path d="M360 296 Q400 262 440 296"/>
      <path d="M186 296 L128 268 M614 296 L672 268"/>`,
    thinRect: `<rect x="184" y="262" width="188" height="100" rx="18"/>
      <rect x="428" y="262" width="188" height="100" rx="18"/>
      <path d="M372 282 Q400 268 428 282"/>
      <path d="M184 276 L132 256 M616 276 L668 256"/>`,
    oversized: `<path d="M164 250 Q400 210 636 250 L648 340 Q650 384 600 392 L476 400 Q436 402 420 366 L410 336 Q400 314 390 336 L380 366 Q364 402 324 400 L200 392 Q150 384 152 340 Z"/>`,
    catEye: `<path d="M172 272 Q290 232 376 268 Q400 280 424 268 Q510 232 628 272 L640 330 Q644 378 590 388 L480 396 Q442 398 424 362 L412 332 Q400 310 388 332 L376 362 Q358 398 320 396 L210 388 Q156 378 160 330 Z"/>
      <path d="M172 272 L146 240 M628 272 L654 240"/>`,
    titanRound: `<circle cx="272" cy="306" r="84"/>
      <circle cx="528" cy="306" r="84"/>
      <path d="M356 290 Q400 264 444 290"/>
      <path d="M356 310 Q400 336 444 310"/>
      <path d="M190 294 L134 272 M610 294 L666 272"/>`,
    kidsRound: `<circle cx="288" cy="310" r="72"/>
      <circle cx="512" cy="310" r="72"/>
      <path d="M360 296 Q400 272 440 296"/>
      <path d="M216 300 L166 284 M584 300 L634 284"/>`,
    lensDisc: `<circle cx="400" cy="304" r="118"/>
      <path d="M330 258 Q312 280 306 308"/>
      <path d="M474 344 Q492 322 496 296" stroke="${C.accent}"/>`,
    contactDome: `<path d="M240 352 Q400 216 560 352"/>
      <path d="M212 352 L588 352"/>
      <path d="M330 292 Q400 252 470 292" stroke="${C.accent}"/>`,
    bottle: `<rect x="336" y="238" width="128" height="160" rx="20"/>
      <rect x="372" y="204" width="56" height="34" rx="8"/>
      <path d="M336 296 L464 296" stroke="${C.accent}"/>`,
    case: `<rect x="228" y="266" width="344" height="118" rx="26"/>
      <path d="M400 266 L400 384"/>
      <path d="M252 250 Q400 224 548 250"/>`,
  }

  return g(shapes[shape] || shapes.roundFull)
}

function slipSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="720" viewBox="0 0 520 720">
  <rect width="520" height="720" fill="#F7F3E9"/>
  <rect width="520" height="110" fill="#1E5E4A"/>
  <text x="260" y="50" text-anchor="middle" font-family="'IBM Plex Mono', Menlo, monospace" font-size="24" font-weight="700" fill="#F7F3E9">ใบโอนเงิน / PAYMENT SLIP</text>
  <text x="260" y="82" text-anchor="middle" font-family="'IBM Plex Mono', Menlo, monospace" font-size="15" fill="#BFE3D5">Mobile Banking โอนเข้าบัญชีร้าน OptiMart</text>
  <rect x="40" y="150" width="440" height="500" rx="14" fill="#FFFFFF" stroke="#D9DCD2"/>
  <circle cx="260" cy="230" r="42" fill="#1E5E4A"/>
  <text x="260" y="240" text-anchor="middle" font-family="'IBM Plex Mono', Menlo, monospace" font-size="24" fill="#F7F3E9">K</text>
  <text x="260" y="310" text-anchor="middle" font-family="'IBM Plex Mono', Menlo, monospace" font-size="15" fill="#77827C">โอนสำเร็จ</text>
  <text x="260" y="364" text-anchor="middle" font-family="'IBM Plex Mono', Menlo, monospace" font-size="36" font-weight="700" fill="#2B3634">5,490.00 THB</text>
  <line x1="80" y1="400" x2="440" y2="400" stroke="#D9DCD2"/>
  <text x="90" y="440" font-family="'IBM Plex Mono', Menlo, monospace" font-size="14" fill="#77827C">จากบัญชี</text>
  <text x="430" y="440" text-anchor="end" font-family="'IBM Plex Mono', Menlo, monospace" font-size="14" fill="#2B3634">xxx-x-x1234-6</text>
  <text x="90" y="480" font-family="'IBM Plex Mono', Menlo, monospace" font-size="14" fill="#77827C">เข้าบัญชี</text>
  <text x="430" y="480" text-anchor="end" font-family="'IBM Plex Mono', Menlo, monospace" font-size="14" fill="#2B3634">OptiMart Co., Ltd. (KBANK)</text>
  <text x="90" y="520" font-family="'IBM Plex Mono', Menlo, monospace" font-size="14" fill="#77827C">วันที่</text>
  <text x="430" y="520" text-anchor="end" font-family="'IBM Plex Mono', Menlo, monospace" font-size="14" fill="#2B3634">15-11-2026 10:24</text>
  <text x="90" y="560" font-family="'IBM Plex Mono', Menlo, monospace" font-size="14" fill="#77827C">เลขอ้างอิง</text>
  <text x="430" y="560" text-anchor="end" font-family="'IBM Plex Mono', Menlo, monospace" font-size="14" fill="#2B3634">TXN20261115-004218</text>
  <rect x="150" y="600" width="220" height="28" rx="6" fill="#E9ECE4"/>
  <text x="260" y="619" text-anchor="middle" font-family="'IBM Plex Mono', Menlo, monospace" font-size="13" fill="#77827C">DEMO SLIP ข้อมูลสมมติ</text>
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
    shape: 'wayfarer',
    spec: '50 □ 22 · 150 · UV400',
    file: 'photo-01.jpg',
  },
  {
    name: 'Oakley Holbrook Round',
    brand: 'Oakley',
    category: 'SUNGLASS',
    price: 6900,
    stock: 9,
    description: 'แว่นกันแดดกีฬาสไตล์ Retroluxe เลนส์ Prizm เพิ่มความคมชัด กันแดด UV400 เหมาะกับกิจกรรมกลางแจ้ง',
    shape: 'sport',
    spec: '57 □ 17 · 138 · PRIZM',
    file: 'photo-02.jpg',
  },
  {
    name: 'JINS Classico JF-21A',
    brand: 'JINS',
    category: 'FRAME',
    price: 1590,
    stock: 25,
    description: 'กรอบแว่นสายตาสไตล์ญี่ปุ่น น้ำหนักเบา ใส่สบายทั้งวัน มาพร้อมเลนส์แอสเฟอริกมาตรฐาน',
    shape: 'roundFull',
    spec: '49 □ 20 · 145 · ASPH',
    file: 'photo-03.jpg',
  },
  {
    name: 'OWNDAYS Classic Air Frame',
    brand: 'OWNDAYS',
    category: 'FRAME',
    price: 1290,
    stock: 30,
    description: 'กรอบแว่นไร้น้ำหนัก วัสดุ TR90 ยืดหยุ่นสูง เหมาะกับการใช้งานทั่วไปและสายตาสั้น/ยาว',
    shape: 'thinRect',
    spec: '51 □ 18 · 140 · TR90',
    file: 'photo-04.jpg',
  },
  {
    name: 'Gentle Monster Bold Collection',
    brand: 'Gentle Monster',
    category: 'SUNGLASS',
    price: 9900,
    stock: 5,
    description: 'แว่นกันแดดดีไซน์โดดเด่นสไตล์เกาหลี กรอบหนา สีมาตรฐาน การันตีความปังทุกมุมถ่าย',
    shape: 'oversized',
    spec: '54 □ 21 · 148 · UV400',
    file: 'photo-05.jpg',
  },
  {
    name: 'Vogue VO5396S Feminine',
    brand: 'Vogue Eyewear',
    category: 'SUNGLASS',
    price: 3290,
    stock: 11,
    description: 'แว่นกันแดดสำหรับผู้หญิง กรอบโค้งมน เลนส์ไล่เฉด ออกแบบมาเน้นความน่ารักและทันสมัย',
    shape: 'catEye',
    spec: '55 □ 17 · 140 · GRAD',
    file: 'photo-06.jpg',
  },
  {
    name: 'กรอบแว่นไททาเนียม Ultra Light',
    brand: 'OptiMart',
    category: 'FRAME',
    price: 2990,
    stock: 18,
    description: 'กรอบแว่นไททาเนียมเกรดพรีเมียม เบาเป็นพิเศษ แข็งแรง ไม่ก่อนการแพ้ ผลิตในไทย',
    shape: 'titanRound',
    spec: '48 □ 21 · 145 · TITAN',
    file: 'photo-07.jpg',
  },
  {
    name: 'กรอบแว่นเด็ก Kids Flex Safe',
    brand: 'OptiMart',
    category: 'FRAME',
    price: 890,
    stock: 22,
    description: 'กรอบแว่นสำหรับเด็ก วัสดุนิรภัยไม่แตกหัก สายคล้องกันหล่น ปรับได้ทุกขนาดหน้า',
    shape: 'kidsRound',
    spec: '44 □ 18 · 125 · FLEX',
    file: 'photo-08.jpg',
  },
  {
    name: 'เลนส์กรองแสงน้ำเงิน Blue-Cut 1.60',
    brand: 'Hoya',
    category: 'LENS',
    price: 2490,
    stock: 40,
    description: 'เลนส์สายตาดัชนี 1.60 เคลือบกรองแสงน้ำเงินจากหน้าจอ ลดอาการตาแห้ง ตาล้าง เหมาะกับคนทำงานหน้าคอม',
    shape: 'lensDisc',
    spec: 'Ø 70 · 1.60 · BLUE-CUT',
    file: 'photo-09.jpg',
  },
  {
    name: 'คอนแท็คเลนส์รายเดือน 30 วัน',
    brand: 'Bausch+Lomb',
    category: 'LENS',
    price: 450,
    stock: 3,
    description: 'คอนแท็คเลนส์ใส่ได้ 30 วัน/คู่ ค่าออกซิเจนสูง ใส่สบาย ชุดละ 2 ข้าง',
    shape: 'contactDome',
    spec: 'BC 8.6 · DIA 14.2 · 30 DAY',
    file: 'photo-10.jpg',
  },
  {
    name: 'น้ำยาล้างคอนแท็คเลนส์ 360ml',
    brand: 'OptiFree',
    category: 'ACCESSORY',
    price: 220,
    stock: 50,
    description: 'น้ำยาล้าง+ถนอมคอนแท็คเลนส์ ฆ่าเชื้อ 99.9% ใช้ได้ทุกเลนส์นุ่ม ขวด 360 มล.',
    shape: 'bottle',
    spec: '360 ML · MULTI-PURPOSE',
    file: 'photo-11.jpg',
  },
  {
    name: 'กล่องเก็บแว่น หนังแท้ + ผ้าเช็ด',
    brand: 'OptiMart',
    category: 'ACCESSORY',
    price: 350,
    stock: 35,
    description: 'กล่องเก็บแว่นหนังแท้แข็งแรง กันกระแทก มาพร้อมผ้าไมโครไฟเบอร์เช็ดเลนส์',
    shape: 'case',
    spec: 'H 60 · W 140 · FOLD',
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

  // ---- specimen SVG: เขียนไว้เป็นไฟล์สำรองเมื่อไม่มีรูปถ่าย (idempotent) ----
  // รูปสินค้าหลักเป็นภาพถ่ายจาก Pexels (photo-01..12.jpg) ที่ commit ไว้ใน repo
  for (const p of PRODUCTS) {
    fs.writeFileSync(path.join(productsDir, p.file), specimen(p))
  }
  const slipFile = path.join(slipsDir, 'demo-slip.svg')
  fs.writeFileSync(slipFile, slipSvg())
  console.log(`🖼️  Wrote ${PRODUCTS.length} specimen cards + demo slip`)

  // ---- products ----
  const existingCount = await prisma.product.count()
  if (existingCount === 0) {
    for (const p of PRODUCTS) {
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
