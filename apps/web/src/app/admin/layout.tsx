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
    <div className="container" style={{ paddingBlock: "var(--space-lg) var(--section-gap-s)" }}>
      <div className="admin-grid">
        <aside>
          <nav className="admin-nav" aria-label="เมนูผู้ดูแลระบบ">
            <p className="label" style={{ padding: "var(--space-xs) var(--space-sm)", marginBottom: 0 }}>
              หลังร้าน OptiMart
            </p>
            {MENU.map((m) => {
              const active = pathname === m.href;
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  className={active ? "on" : ""}
                  aria-current={active ? "page" : undefined}
                >
                  {m.label}
                </Link>
              );
            })}
            <Link href="/">กลับหน้าร้าน</Link>
          </nav>
        </aside>

        <div className="min-w-0">
          {/* mobile tabs */}
          <nav className="seg mb-[var(--space-md)] md:hidden" aria-label="เมนูผู้ดูแลระบบ">
            {MENU.map((m) => {
              const active = pathname === m.href;
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  className="btn btn--sm btn--quiet"
                  style={active ? { background: "var(--color-ink)", color: "var(--color-paper)" } : undefined}
                  aria-current={active ? "page" : undefined}
                >
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
      <div className="container max-w-lg text-center" style={{ paddingBlock: "var(--section-gap-s)" }}>
        <h1 style={{ fontSize: "var(--text-2xl)" }}>ต้องเข้าสู่ระบบก่อน</h1>
        <p className="mt-[var(--space-sm)] text-sm" style={{ color: "var(--color-muted)" }}>
          หน้านี้เปิดให้ผู้ดูแลระบบของร้านเท่านั้น
        </p>
        <Link href="/login" className="btn btn--primary mt-[var(--space-lg)]">เข้าสู่ระบบ</Link>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="container max-w-lg text-center" style={{ paddingBlock: "var(--section-gap-s)" }}>
        <h1 style={{ fontSize: "var(--text-2xl)" }}>หน้านี้เปิดเฉพาะผู้ดูแลระบบ</h1>
        <p className="mt-[var(--space-sm)] text-sm" style={{ color: "var(--color-muted)" }}>
          บัญชีของคุณเป็นบัญชีลูกค้า ใช้เลือกซื้อสินค้าได้ตามปกติ
        </p>
        <Link href="/" className="btn btn--primary mt-[var(--space-lg)]">กลับหน้าร้าน</Link>
      </div>
    );
  }

  return (
    <Suspense>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
