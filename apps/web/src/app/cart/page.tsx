"use client";

import Link from "next/link";
import { Trash } from "@phosphor-icons/react";
import { media } from "@/lib/api";
import { THB } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { EmptyState } from "@/components/ui";

export default function CartPage() {
  const { items, total, setQty, remove } = useCart();

  if (items.length === 0) {
    return (
      <div className="container max-w-3xl" style={{ paddingBlock: "var(--space-2xl)" }}>
        <EmptyState icon="cart" title="ตะกร้ายังว่างอยู่">
          <Link href="/products" className="btn btn--sm mt-[var(--space-2xs)] btn--primary">
            เลือกซื้อแว่นตากับร้าน
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBlock: "var(--space-lg) var(--section-gap-s)" }}>
      <h1>ตะกร้าสินค้า</h1>

      <div className="mt-[var(--space-xl)] grid gap-[var(--space-lg)] lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="card p-[var(--space-lg)]">
          <ul className="stack" style={{ gap: "var(--space-lg)" }}>
            {items.map((item) => (
              <li key={item.productId} className="flex flex-wrap items-center gap-[var(--space-md)]">
                <Link
                  href={`/products/${item.productId}`}
                  className="frame"
                  style={{ width: "5rem", height: "3.75rem", borderRadius: "var(--radius-input)", flexShrink: 0 }}
                  aria-label={`ดูรายละเอียด ${item.name}`}
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={media(item.imageUrl)} alt={item.name} loading="lazy" width={80} height={60} />
                  ) : (
                    <span aria-hidden="true" className="h-full w-full" />
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link href={`/products/${item.productId}`} className="line-clamp-1 font-medium no-underline hover:underline">
                    {item.name}
                  </Link>
                  <p className="text-xs" style={{ color: "var(--color-muted)" }}>{item.brand}</p>
                  <p className="num mt-[var(--space-2xs)]" style={{ color: "var(--color-ink)", fontSize: "var(--text-sm)" }}>
                    {THB(item.price)}
                  </p>
                </div>

                <div className="flex items-center" style={{ border: "1px solid var(--color-rule)", borderRadius: "var(--radius-input)" }}>
                  <button
                    type="button"
                    onClick={() => setQty(item.productId, item.quantity - 1)}
                    aria-label={`ลดจำนวน ${item.name}`}
                    className="icon-btn"
                    style={{ width: "2.5rem", height: "2.5rem", fontSize: "var(--text-md)" }}
                  >
                    −
                  </button>
                  <span className="num" style={{ minWidth: "2rem", textAlign: "center", fontSize: "var(--text-sm)" }}>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQty(item.productId, item.quantity + 1)}
                    aria-label={`เพิ่มจำนวน ${item.name}`}
                    className="icon-btn"
                    style={{ width: "2.5rem", height: "2.5rem", fontSize: "var(--text-md)" }}
                  >
                    +
                  </button>
                </div>

                <p className="num w-[6rem] text-right font-medium" style={{ fontSize: "var(--text-sm)" }}>
                  {THB(item.price * item.quantity)}
                </p>

                <button
                  type="button"
                  onClick={() => remove(item.productId)}
                  className="icon-btn"
                  style={{ color: "var(--color-muted)" }}
                  aria-label={`นำ ${item.name} ออกจากตะกร้า`}
                >
                  <Trash size={16} weight="bold" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <aside className="card h-fit p-[var(--space-lg)]">
          <h2 style={{ fontSize: "var(--text-title)" }}>สรุปคำสั่งซื้อ</h2>
          <div className="mt-[var(--space-md)] space-y-[var(--space-sm)] text-sm" style={{ color: "var(--color-ink-2)" }}>
            <p className="flex justify-between">
              <span>จำนวนสินค้า</span>
              <span className="num">{items.reduce((s, i) => s + i.quantity, 0)} ชิ้น</span>
            </p>
            <p className="flex justify-between border-t pt-[var(--space-sm)] text-base font-bold" style={{ borderColor: "var(--color-rule)", color: "var(--color-ink)" }}>
              <span>ยอดรวม</span>
              <span className="num" style={{ color: "var(--color-accent-deep)" }}>{THB(total)}</span>
            </p>
          </div>
          <Link href="/checkout" className="btn btn--primary mt-[var(--space-lg)] w-full">
            ดำเนินการสั่งซื้อ
          </Link>
          <Link href="/products" className="mt-[var(--space-sm)] block text-center text-sm no-underline hover:underline" style={{ color: "var(--color-muted)" }}>
            เลือกซื้อสินค้าเพิ่ม
          </Link>
        </aside>
      </div>
    </div>
  );
}
