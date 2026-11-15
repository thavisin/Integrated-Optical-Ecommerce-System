"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MagnifyingGlass, ShoppingCart, CaretDown } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

const NAV_LINKS = [
  { href: "/", label: "หน้าแรก" },
  { href: "/products", label: "สินค้าทั้งหมด" },
];

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState("");
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ให้เฟรมแรกของ client เหมือน SSR เสมอ แล้วค่อยเผยส่วนที่อ่าน localStorage
  useEffect(() => setMounted(true), []);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onSearchEnter = () => {
    router.push(q.trim() ? `/products?search=${encodeURIComponent(q.trim())}` : "/products");
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="wordmark" aria-label="OptiMart, กลับหน้าแรก">
          OptiMart
        </Link>

        {/* ช่องค้นหานำทาง ไม่ใช่ form เพื่อไม่ให้แทรกลำดับฟอร์มของหน้าเอง */}
        <div className="hidden min-w-0 flex-1 md:flex" role="search" style={{ maxWidth: "26rem" }}>
          <label htmlFor="nav-search" className="visually-hidden">ค้นหาสินค้า</label>
          <div className="search-shell">
            <MagnifyingGlass size={16} weight="bold" aria-hidden="true" style={{ color: "var(--color-muted)", flexShrink: 0 }} />
            <input
              id="nav-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSearchEnter(); }}
              placeholder="ค้นหาแว่นตา แบรนด์ หรือเลนส์"
              className="search-input"
            />
            <button type="button" className="btn btn--sm btn--quiet" onClick={onSearchEnter}>ค้นหา</button>
          </div>
        </div>

        <nav className="ml-auto hidden items-center gap-[var(--space-2xs)] md:flex" aria-label="เมนูหลัก">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${pathname === l.href ? "nav-link--on" : ""}`}
              aria-current={pathname === l.href ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-[var(--space-2xs)] md:ml-0">
          {loading || !mounted ? (
            <span className="btn btn--sm btn--quiet" aria-hidden="true" style={{ width: "5.5rem" }} />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="btn btn--sm btn--quiet"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "1.5rem",
                    height: "1.5rem",
                    borderRadius: "var(--radius-pill)",
                    background: "var(--color-accent-soft)",
                    color: "var(--color-accent-deep)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 500,
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-[7rem] truncate sm:block">{user.name}</span>
                <CaretDown size={14} weight="bold" aria-hidden="true" />
              </button>
              {menuOpen && (
                <div className="menu" role="menu">
                  {user.role === "ADMIN" && (
                    <Link href="/admin" role="menuitem">หลังร้านสำหรับแอดมิน</Link>
                  )}
                  <Link href="/orders" role="menuitem">คำสั่งซื้อของฉัน</Link>
                  <button type="button" onClick={handleLogout} role="menuitem">ออกจากระบบ</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="nav-link">เข้าสู่ระบบ</Link>
              <Link href="/register" className="btn btn--sm btn--quiet">สมัครสมาชิก</Link>
            </>
          )}

          <Link href="/cart" className="icon-btn" aria-label={`ตะกร้าสินค้า มีสินค้า ${count} ชิ้น`}>
            <ShoppingCart size={20} weight="bold" aria-hidden="true" />
            {count > 0 && (
              <span
                className="num"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "var(--space-3xs)",
                  right: "var(--space-3xs)",
                  minWidth: "1.1rem",
                  padding: "0 0.2rem",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--color-accent)",
                  color: "var(--color-accent-ink)",
                  fontFamily: "var(--font-outlier)",
                  fontSize: "var(--text-xs)",
                  lineHeight: "1.1rem",
                  textAlign: "center",
                }}
              >
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* mobile nav */}
      <div className="container md:hidden" style={{ paddingBottom: "var(--space-sm)" }}>
        <div className="search-shell md:hidden" role="search">
          <label htmlFor="nav-search-m" className="visually-hidden">ค้นหาสินค้า</label>
          <MagnifyingGlass size={16} weight="bold" aria-hidden="true" style={{ color: "var(--color-muted)", flexShrink: 0 }} />
          <input
            id="nav-search-m"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSearchEnter(); }}
            placeholder="ค้นหาสินค้าในร้าน"
            className="search-input"
          />
          <button type="button" className="btn btn--sm btn--quiet" onClick={onSearchEnter}>ค้นหา</button>
        </div>
        <nav className="flex items-center gap-[var(--space-xs)]" style={{ paddingTop: "var(--space-sm)" }} aria-label="เมนูหลัก">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${pathname === l.href ? "nav-link--on" : ""}`}
              aria-current={pathname === l.href ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
