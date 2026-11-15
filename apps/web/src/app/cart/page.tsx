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
      <div className="container max-w-3xl py-16">
        <EmptyState icon="cart" title="ตะกร้ายังว่างอยู่">
          <Link href="/products" className="btn btn--sm btn--primary mt-2">
            เลือกซื้อแว่นตากับร้าน
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1>ตะกร้าสินค้า</h1>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <ul className="acct-rows">
          {items.map((item) => (
            <li key={item.productId}>
              <Link
                href={`/products/${item.productId}`}
                className="frame acct-thumb"
                aria-label={`ดูรายละเอียด ${item.name}`}
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={media(item.imageUrl)} alt={item.name} loading="lazy" width={80} height={60} />
                ) : (
                  <span aria-hidden="true" className="h-full w-full" />
                )}
              </Link>

              <div className="acct-body">
                <Link href={`/products/${item.productId}`} className="line-clamp-1 font-medium no-underline hover:underline">
                  {item.name}
                </Link>
                <p className="small">{item.brand}</p>
                <p className="num mt-1 text-sm text-ink">{THB(item.price)}</p>
              </div>

              <div className="stepper">
                <button
                  type="button"
                  onClick={() => setQty(item.productId, item.quantity - 1)}
                  aria-label={`ลดจำนวน ${item.name}`}
                  className="icon-btn"
                >
                  −
                </button>
                <span className="num">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => setQty(item.productId, item.quantity + 1)}
                  aria-label={`เพิ่มจำนวน ${item.name}`}
                  className="icon-btn"
                >
                  +
                </button>
              </div>

              <div className="acct-row-end">
                <p className="acct-line-total">{THB(item.price * item.quantity)}</p>

                <button
                  type="button"
                  onClick={() => remove(item.productId)}
                  className="icon-btn text-muted"
                  aria-label={`นำ ${item.name} ออกจากตะกร้า`}
                >
                  <Trash size={16} weight="bold" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <aside className="well h-fit">
          <h2 className="text-title">สรุปคำสั่งซื้อ</h2>
          <dl className="rule-list">
            <div>
              <dt>จำนวนสินค้า</dt>
              <dd className="num">{items.reduce((s, i) => s + i.quantity, 0)} ชิ้น</dd>
            </div>
            <div>
              <dt>ยอดรวม</dt>
              <dd className="num">{THB(total)}</dd>
            </div>
          </dl>
          <Link href="/checkout" className="btn btn--primary mt-6 w-full">
            ดำเนินการสั่งซื้อ
          </Link>
          <Link href="/products" className="mt-3 block text-center text-sm text-muted no-underline hover:underline">
            เลือกซื้อสินค้าเพิ่ม
          </Link>
        </aside>
      </div>
    </div>
  );
}
