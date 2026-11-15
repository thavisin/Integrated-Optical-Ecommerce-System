"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { THB } from "@/lib/format";
import { media } from "@/lib/api";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const out = product.stock <= 0;

  const handleAdd = () => {
    add(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
      <Link
        href={`/products/${product.id}`}
        className="block aspect-[4/3] overflow-hidden bg-slate-100"
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media(product.imageUrl)}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-6xl">🕶️</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{product.brand}</div>
        <Link
          href={`/products/${product.id}`}
          className="mt-1 line-clamp-1 font-semibold text-slate-800 hover:text-indigo-600"
        >
          {product.name}
        </Link>
        <div className="mt-2 text-lg font-bold text-indigo-600">{THB(product.price)}</div>
        <div className="mt-1 text-xs">
          {out ? (
            <span className="font-medium text-rose-500">สินค้าหมด</span>
          ) : (
            <span className="text-emerald-600">คงเหลือ {product.stock} ชิ้น</span>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={out}
          className="mt-3 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {added ? "เพิ่มแล้ว ✓" : out ? "สินค้าหมด" : "หยิบลงตะกร้า 🛒"}
        </button>
      </div>
    </div>
  );
}
