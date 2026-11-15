import type { Metadata } from "next";
import { Suspense } from "react";
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
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={<div className="nav" aria-hidden="true"><div className="container nav-inner" /></div>}>
              <Navbar />
            </Suspense>
            <main id="main">{children}</main>
            <footer className="section--tight">
              <div className="container">
                <hr className="divider" />
                <div className="stack" style={{ marginTop: "var(--space-lg)", gap: "var(--space-sm)" }}>
                  <a href="/" className="wordmark" aria-label="OptiMart, กลับหน้าแรก">OptiMart</a>
                  <p className="breadcrumb flex flex-wrap gap-x-[var(--space-lg)] gap-y-[var(--space-2xs)]">
                    <a href="/products">สินค้าทั้งหมด</a>
                    <a href="/orders">คำสั่งซื้อของฉัน</a>
                    <a href="/register">สมัครสมาชิก</a>
                    <a href="/login">เข้าสู่ระบบ</a>
                  </p>
                  <p className="breadcrumb">
                    © 2026 OptiMart สั่งซื้อแว่นตาออนไลน์ โอนเงินแล้วแนบสลิปในหน้าคำสั่งซื้อ ร้านตรวจสอบและจัดส่งภายใน 1 ถึง 2 วันทำการ
                  </p>
                </div>
              </div>
            </footer>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
