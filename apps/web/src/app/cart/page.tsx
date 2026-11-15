"use client";

import Link from "next/link";
import { media } from "@/lib/api";
import { THB } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { EmptyState } from "@/components/ui";

export default function CartPage() {
  const { items, total, setQty, remove } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState icon="🛒" title="ตะกร้าสินค้าว่างเปล่า">
          <Link href="/products" className="mt-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-600">
            เลือกซื้อแว่นตากันเลย →
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-slate-900">ตะกร้าสินค้า 🛒</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <Link href={`/products/${item.productId}`} className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={media(item.imageUrl)} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-3xl">🕶️</span>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link href={`/products/${item.productId}`} className="line-clamp-1 font-semibold hover:text-indigo-600">
                  {item.name}
                </Link>
                <div className="text-xs text-slate-400">{item.brand}</div>
                <div className="mt-1 font-bold text-indigo-600">{THB(item.price)}</div>
              </div>

              <div className="flex items-center rounded-xl border border-slate-200">
                <button onClick={() => setQty(item.productId, item.quantity - 1)} className="px-3 py-2 text-lg">
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => setQty(item.productId, item.quantity + 1)} className="px-3 py-2 text-lg">
                  +
                </button>
              </div>

              <div className="w-24 text-right font-bold">{THB(item.price * item.quantity)}</div>

              <button
                onClick={() => remove(item.productId)}
                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                aria-label="ลบสินค้า"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-800">สรุปคำสั่งซื้อ</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>จำนวนสินค้า</span>
              <span>{items.reduce((s, i) => s + i.quantity, 0)} ชิ้น</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
              <span>ยอดรวม</span>
              <span className="text-indigo-600">{THB(total)}</span>
            </div>
          </div>
          <Link
            href="/checkout"
            className="mt-5 block rounded-xl bg-indigo-600 py-3 text-center font-semibold text-white transition hover:bg-indigo-500"
          >
            ดำเนินการสั่งซื้อ →
          </Link>
          <Link href="/products" className="mt-2 block text-center text-sm text-slate-500 hover:text-indigo-600">
            เลือกซื้อสินค้าเพิ่ม
          </Link>
        </div>
      </div>
    </div>
  );
}
