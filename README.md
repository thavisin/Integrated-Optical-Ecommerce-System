# Integrated-Optical-Ecommerce-System

ระบบพาณิชย์อิเล็กทรอนิกส์สำหรับร้านแว่นตา (Integrated Optical E-commerce System) — Monorepo แยก **Frontend (Next.js)** และ **Backend (Cloudflare Workers + Hono)** โดยใช้ **D1** เป็นฐานข้อมูล และ **R2** เก็บรูปสินค้า/สลิป

## ✨ ฟีเจอร์

### ฐานระบบ (Base)
- สมัครสมาชิก / เข้าสู่ระบบ ด้วย **JWT** + **PBKDF2-SHA256** (แฮชรหัสผ่านด้วย Web Crypto)
- **Authentication / Authorization** แยกสิทธิ์ `CUSTOMER` และ `ADMIN` (protect ทั้งฝั่ง API และหน้าเว็บ)

### ฝั่งลูกค้า (Customer)
- เลือกซื้อสินค้าแว่นตา: กรอบแว่น / แว่นกันแดด / เลนส์ / อุปกรณ์เสริม
- ตะกร้าสินค้า + **Checkout พร้อมแนบสลิปโอนเงิน** ส่งให้แอดมินตรวจสอบ
- **ตรวจสอบสถานะคำสั่งซื้อได้**: รอตรวจสอบ → ชำระเงินแล้ว → จัดส่งแล้ว → สำเร็จ (+ ปฏิเสธ/ยกเลิก)
- ดู**ประวัติการสั่งซื้อ**ทั้งหมด / ดูสลิป / ส่งสลิปใหม่กรณีถูกปฏิเสธ / ยกเลิกคำสั่งซื้อ
- **ค้นหาสินค้า (Search)** + กรองตามหมวดหมู่ + เรียงตามราคา/ชื่อ

### ฝั่งผู้ดูแลระบบ (Admin)
- **Inventory Management**: เพิ่ม / แก้ไข / ลบสินค้า + อัปโหลดรูปสินค้า
- **จัดการคำสั่งซื้อ**: ดูสลิป, อนุมัติ / ปฏิเสธ (พร้อมเหตุผล), ทำเครื่องหมายจัดส่ง / เสร็จสิ้น
- **Sales Analytics Dashboard**: รายได้รวม, จำนวนคำสั่งซื้อ, กราฟรายได้ย้อนหลัง 14 วัน, สินค้าขายดี Top 5, สัดส่วนสถานะคำสั่งซื้อ, สต็อกต่ำ

## 🧰 เทคโนโลยี

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS + Recharts |
| Backend | Cloudflare Workers + Hono (ESM JavaScript) |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM |
| Storage | Cloudflare R2 (รูปสินค้า / สลิปโอนเงิน) |
| Auth | Hono JWT (HS256) + Web Crypto PBKDF2-SHA256 |
| Upload | Hono `parseBody` (multipart) → R2 |

## 📁 โครงสร้าง Monorepo

```
glasses-market/
├── apps/
│   ├── server/                  # Backend Worker (optimart-api)
│   │   ├── wrangler.jsonc       # D1 + R2 bindings
│   │   ├── drizzle/             # SQL migrations (wrangler d1 migrations apply)
│   │   ├── drizzle.config.js
│   │   ├── seed/                # build-seed.js, seed.sql, upload-r2.js, uploads/
│   │   └── src/
│   │       ├── index.js         # entry point (Hono)
│   │       ├── db/              # drizzle schema + client
│   │       ├── lib/             # password, upload, http error
│   │       ├── middleware/      # auth, error
│   │       └── routes/          # auth, products, orders, admin
│   └── web/                     # Frontend Worker (optimart-web, Next.js)
│       └── src/
│           ├── app/             # หน้าเว็บ (customer + admin)
│           ├── components/
│           ├── context/         # Auth + Cart
│           └── lib/             # api client, formatters, types
├── package.json                 # npm workspaces
└── README.md
```

## 🚀 การติดตั้งและรัน (local)

```bash
# 1) ติดตั้ง dependencies ทั้งหมดของ monorepo
npm install

# 2) ตั้งค่า secret สำหรับ development
cp apps/server/.dev.vars.example apps/server/.dev.vars
# แล้วแก้ JWT_SECRET ในไฟล์ apps/server/.dev.vars

# 3) เตรียมฐานข้อมูล local (D1 migration + seed + อัปโหลดไฟล์ตัวอย่างขึ้น R2 local)
npm run setup

# 4) รันทั้ง backend และ frontend พร้อมกัน
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000 (`wrangler dev --port 4000`)
- คำสั่งแยกส่วน: `npm run dev:server`, `npm run dev:web`
- ข้อมูล local ทั้งหมด (D1/R2) อยู่ใน `apps/server/.wrangler/` — ลบทิ้งได้ถ้าต้องการเริ่มใหม่

## 👤 บัญชีทดสอบ (จาก seed)

| บทบาท | อีเมล | รหัสผ่าน |
|---|---|---|
| Admin | `admin@optimart.com` | `admin123` |
| Customer | `customer@example.com` | `customer123` |

## 🔄 Flow การสั่งซื้อ (Checkout + สลิป)

```
ลูกค้าเข้าสู่ระบบ → เลือกสินค้า → หยิบลงตะกร้า → Checkout
→ กรอกที่อยู่จัดส่ง + แนบสลิปโอนเงิน → สร้างคำสั่งซื้อ (สถานะ: รอตรวจสอบ)
→ Admin ตรวจสอบสลิป:
   ├─ อนุมัติ → ชำระเงินแล้ว (หักสต็อก) → จัดส่งแล้ว → สำเร็จ
   └─ ปฏิเสธ (ระบุเหตุผล) → ลูกค้าส่งสลิปใหม่ได้ หรือยกเลิกคำสั่งซื้อ
```

## 📡 API หลัก

| Method | Endpoint | คำอธิบาย | สิทธิ์ |
|---|---|---|---|
| POST | `/api/auth/register` | สมัครสมาชิก | Public |
| POST | `/api/auth/login` | เข้าสู่ระบบ (ได้ JWT) | Public |
| GET | `/api/auth/me` | ข้อมูลผู้ใช้ปัจจุบัน | ล็อกอิน |
| GET | `/api/products` | รายการสินค้า + `?search=` `&category=` `&sort=` `&page=` | Public |
| GET | `/api/products/:id` | รายละเอียดสินค้า | Public |
| POST/PUT/DELETE | `/api/products` | จัดการสินค้า | Admin |
| POST | `/api/orders` | Checkout (แนบสลิป multipart) | ล็อกอิน |
| GET | `/api/orders` | ประวัติคำสั่งซื้อของตัวเอง (admin ดูได้ทั้งหมดด้วย `?all=true`) | ล็อกอิน |
| GET | `/api/orders/:id` | รายละเอียดคำสั่งซื้อ | เจ้าของ/Admin |
| PATCH | `/api/orders/:id/status` | เปลี่ยนสถานะ (อนุมัติ/ปฏิเสธ/จัดส่ง/เสร็จ) | Admin |
| POST | `/api/orders/:id/slip` | ส่งสลิปใหม่ | เจ้าของ |
| POST | `/api/orders/:id/cancel` | ยกเลิกคำสั่งซื้อ | เจ้าของ/Admin |
| GET | `/api/admin/stats` | ข้อมูลสรุปสำหรับ Dashboard | Admin |
| GET | `/uploads/*` | ไฟล์จาก R2 (`products/*`, `slips/*`) | Public |

## ☁️ Deploy ขึ้น Cloudflare Workers

ดูขั้นตอนเต็มใน [DEPLOY.md](DEPLOY.md) — สรุป (รันที่รากโปรเจกต์):

```bash
npx wrangler login
npm run deploy:check   # dry run ทั้ง 2 Workers (ไม่อัปโหลด)
npm run deploy        # deploy API (สร้าง D1/R2 อัตโนมัติ + migration + JWT_SECRET) แล้ว deploy เว็บ
npm run seed:remote   # (ไม่บังคับ, ครั้งแรก) ข้อมูลตัวอย่าง — ลบข้อมูลเดิมทั้งหมด
```

## 📝 หมายเหตุ

- `apps/server/.dev.vars` ใช้เก็บ `JWT_SECRET` สำหรับ local (ถูก gitignore) — ตัวอย่างอยู่ใน `.dev.vars.example`
- seed ใช้ `seed/build-seed.js` สร้าง `seed/seed.sql` (แฮชรหัสผ่านด้วย PBKDF2) แล้วรันผ่าน `wrangler d1 execute --local`
- ไฟล์ตัวอย่างใน `seed/uploads/` ถูกอัปโหลดขึ้น R2 ด้วย `seed/upload-r2.js` (`--local` เป็นค่าเริ่มต้น, ใส่ `--remote` เมื่อต้องการอัปโหลดจริง)
- ระบบตัดสต็อกอัตโนมัติตอนแอดมินอนุมัติสลิป (batch เดียวกับการเปลี่ยนสถานะ) และมี `CHECK (stock >= 0)` กันขายเกินในระดับฐานข้อมูล
