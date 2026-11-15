"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui";

const MENU = [
  { href: "/admin", label: "แดชบอร์ดยอดขาย" },
  { href: "/admin/products", label: "จัดการสินค้า" },
  { href: "/admin/orders", label: "คำสั่งซื้อและสลิป" },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      data-scope="app"
      className="container"
      style={{ paddingBlock: "var(--space-lg) var(--section-gap-s)" }}
    >
      <div className="adm-shell">
        <aside className="adm-rail">
          <nav className="adm-nav" aria-label="เมนูผู้ดูแลระบบ">
            <p className="small adm-rail-label">หลังร้าน OptiMart</p>
            {MENU.map((m) => {
              const active = pathname === m.href;
              return (
                <Link key={m.href} href={m.href} aria-current={active ? "page" : undefined}>
                  {m.label}
                </Link>
              );
            })}
            <Link href="/" className="adm-nav-exit">กลับหน้าร้าน</Link>
          </nav>
        </aside>

        <div className="min-w-0">
          {/* mobile tabs */}
          <nav className="seg seg--tabs mb-4 min-[60rem]:hidden" aria-label="เมนูผู้ดูแลระบบ">
            {MENU.map((m) => {
              const active = pathname === m.href;
              return (
                <Link key={m.href} href={m.href} aria-current={active ? "page" : undefined}>
                  {m.label}
                </Link>
              );
            })}
          </nav>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner label="กำลังตรวจสอบสิทธิ์" />;

  if (!user) {
    return (
      <div className="container" style={{ paddingBlock: "var(--section-gap-s)" }}>
        <div className="well adm-guard">
          <h1>ต้องเข้าสู่ระบบก่อน</h1>
          <p className="text-sm">
            หน้านี้เปิดให้ผู้ดูแลระบบของร้านเท่านั้น
          </p>
          <Link href="/login" className="btn btn--primary">เข้าสู่ระบบ</Link>
        </div>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="container" style={{ paddingBlock: "var(--section-gap-s)" }}>
        <div className="well adm-guard">
          <h1>หน้านี้เปิดเฉพาะผู้ดูแลระบบ</h1>
          <p className="text-sm">
            บัญชีของคุณเป็นบัญชีลูกค้า ใช้เลือกซื้อสินค้าได้ตามปกติ
          </p>
          <Link href="/" className="btn btn--primary">กลับหน้าร้าน</Link>
        </div>
      </div>
    );
  }

  return (
    <Suspense>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
