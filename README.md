# Integrated-Optical-Ecommerce-System

ระบบพาณิชย์อิเล็กทรอนิกส์สำหรับร้านแว่นตา (Integrated Optical E-commerce System) — Monorepo แยก **Frontend (Next.js)** และ **Backend (Node.js + Express + Prisma)**

## ✨ ฟีเจอร์

### ฐานระบบ (Base)
- สมัครสมาชิก / เข้าสู่ระบบ ด้วย **JWT** + **bcrypt** (แฮชรหัสผ่าน)
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
| Backend | Node.js + Express.js |
| Database | SQLite ผ่าน Prisma ORM (สลับเป็น PostgreSQL/MySQL ได้ง่าย) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Upload | Multer (สลิปโอนเงิน / รูปสินค้า) |

## 📁 โครงสร้าง Monorepo

```
glasses-market/
├── apps/
│   ├── server/                # Backend (Express API)
│   │   ├── prisma/            # schema + seed
│   │   ├── public/uploads/    # สลิป + รูปสินค้า (สร้างตอน runtime)
│   │   └── src/
│   │       ├── index.js       # entry point
│   │       ├── lib/prisma.js
│   │       ├── middleware/    # auth, upload, error
│   │       └── routes/        # auth, products, orders, admin
│   └── web/                   # Frontend (Next.js)
│       └── src/
│           ├── app/           # หน้าเว็บ (customer + admin)
│           ├── components/
│           ├── context/       # Auth + Cart
│           └── lib/           # api client, formatters, types
├── package.json               # npm workspaces
└── README.md
```

## 🚀 การติดตั้งและรัน

```bash
# 1) ติดตั้ง dependencies ทั้งหมดของ monorepo
npm install

# 2) เตรียม database (prisma generate + db push + seed ข้อมูลตัวอย่าง)
npm run setup

# 3) รันทั้ง backend และ frontend พร้อมกัน
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

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
   ├─ อนุมัติ → ชำระเงินแล้ว → จัดส่งแล้ว → สำเร็จ
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

## 📝 หมายเหตุ

- ไฟล์ `.env` ใน `apps/server` เป็นค่าสำหรับ development (แนะนำเปลี่ยน `JWT_SECRET` ก่อนใช้งานจริง)
- ระบบตัดสต็อกอัตโนมัติตอน checkout และคืนสต็อกเมื่อคำสั่งซื้อถูกปฏิเสธ/ยกเลิก (ผ่าน Prisma Transaction)
