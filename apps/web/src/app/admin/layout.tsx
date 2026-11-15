"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui";

const MENU = [
  { href: "/admin", label: "แดชบอร์ด", icon: "📊" },
  { href: "/admin/products", label: "จัดการสินค้า", icon: "📦" },
  { href: "/admin/orders", label: "คำสั่งซื้อ / ตรวจสลิป", icon: "🛒" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return <Spinner label="กำลังตรวจสอบสิทธิ์…" />;

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <span className="text-6xl">🔐</span>
        <h1 className="mt-4 text-xl font-bold text-slate-800">ต้องเข้าสู่ระบบก่อน</h1>
        <p className="mt-2 text-sm text-slate-500">หน้านี้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น</p>
        <Link href="/login" className="mt-5 inline-block rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-600">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <span className="text-6xl">⛔</span>
        <h1 className="mt-4 text-xl font-bold text-slate-800">403 — ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="mt-2 text-sm text-slate-500">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น (บัญชีของคุณเป็นลูกค้า)</p>
        <Link href="/" className="mt-5 inline-block rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-600">
          กลับหน้าร้าน
        </Link>
      </div>
    );
  }

  return (
    <Suspense>
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-8 sm:px-6">
      <aside className="hidden h-fit w-60 shrink-0 rounded-2xl border border-slate-200 bg-white p-3 md:block">
        <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          Admin Panel
        </div>
        <nav className="mt-1 space-y-1">
          {MENU.map((m) => {
            const active = pathname === m.href;
            return (
              <Link
                key={m.href}
                href={m.href}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  active ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{m.icon}</span> {m.label}
              </Link>
            );
          })}
          <Link href="/" className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-100">
            <span>🏠</span> กลับหน้าร้าน
          </Link>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {/* mobile tabs */}
        <nav className="mb-5 flex gap-2 overflow-x-auto md:hidden">
          {MENU.map((m) => {
            const active = pathname === m.href;
            return (
              <Link
                key={m.href}
                href={m.href}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium ${
                  active ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                {m.icon} {m.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
      </div>
    </Suspense>
  );
}
