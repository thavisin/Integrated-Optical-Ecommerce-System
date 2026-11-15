import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "OptiMart — ร้านแว่นตาออนไลน์",
  description:
    "สั่งซื้อแว่นตาออนไลน์ โอนเงินแนบสลิป ติดตามสถานะคำสั่งซื้อได้ทุกขั้นตอน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Yeseva+One&family=Archivo:wght@400;500&family=Archivo+Narrow:wght@600&family=Chonburi&family=Anuphan:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={<div className="nav nav--pill" aria-hidden="true"><div className="container nav-inner" /></div>}>
              <Navbar />
            </Suspense>
            <main id="main">{children}</main>
            <footer className="mast">
              <div className="container">
                <Link href="/" className="wordmark" aria-label="OptiMart, กลับหน้าแรก">OptiMart</Link>
                <p className="mast-links">
                  <Link href="/products">สินค้าทั้งหมด</Link>
                  <Link href="/orders">คำสั่งซื้อของฉัน</Link>
                  <Link href="/register">สมัครสมาชิก</Link>
                  <Link href="/login">เข้าสู่ระบบ</Link>
                </p>
                <p>
                  © 2026 OptiMart สั่งซื้อแว่นตาออนไลน์ โอนเงินแล้วแนบสลิปในหน้าคำสั่งซื้อ ร้านตรวจสอบและจัดส่งภายใน 1 ถึง 2 วันทำการ
                </p>
                <p className="small">
                  ภาพตัวอย่างสินค้าจาก Pexels ใช้ได้ภายใต้ Pexels License
                </p>
              </div>
            </footer>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
