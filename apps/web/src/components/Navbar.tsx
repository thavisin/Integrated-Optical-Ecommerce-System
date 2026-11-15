"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, CaretDown } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

const NAV_LINKS = [
  { href: "/", label: "หน้าแรก" },
  { href: "/products", label: "สินค้าทั้งหมด" },
];

const noopSubscribe = () => () => {};

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const menuRef = useRef<HTMLDivElement>(null);

  // ให้เฟรมแรกของ client เหมือน SSR เสมอ แล้วค่อยเผยส่วนที่อ่าน localStorage
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  // ปิดเมนูเมื่อเปลี่ยนหน้า (ปรับ state ระหว่าง render แทน effect)
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className={`nav ${pathname.startsWith("/admin") ? "nav--flat" : "nav--pill"}`}>
      <div className="container nav-inner">
        <Link href="/" className="wordmark" aria-label="OptiMart, กลับหน้าแรก">
          OptiMart
        </Link>

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

        <div className="ml-auto flex items-center gap-[var(--space-2xs)] md:ml-[var(--space-md)]">
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
                <span className="avatar" aria-hidden="true">
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
              <span className="count num" aria-hidden="true">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* mobile nav */}
      <div className="container md:hidden" style={{ paddingBottom: "var(--space-sm)" }}>
        <nav className="flex items-center gap-[var(--space-xs)]" aria-label="เมนูหลัก">
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
