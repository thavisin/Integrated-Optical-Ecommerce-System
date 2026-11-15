import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "OptiMart — ร้านแว่นตาออนไลน์",
  description:
    "Integrated Optical E-commerce System — สั่งซื้อแว่นตาออนไลน์ แนบสลิปโอนเงิน ตรวจสอบสถานะคำสั่งซื้อได้",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={<div className="h-16 border-b border-slate-200 bg-white" />}>
              <Navbar />
            </Suspense>
            <main className="min-h-[calc(100vh-260px)]">{children}</main>
            <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
              © 2026 OptiMart — Integrated Optical E-commerce System
            </footer>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
