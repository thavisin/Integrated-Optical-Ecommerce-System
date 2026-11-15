"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { THB, categoryLabel } from "@/lib/format";
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
    <article className="card card--lift flex flex-col overflow-hidden">
      <Link
        href={`/products/${product.id}`}
        className="frame frame--card block"
        aria-label={`ดูรายละเอียด ${product.name}`}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media(product.imageUrl)} alt={product.name} width={800} height={600} />
        ) : (
          <span className="flex h-full w-full items-center justify-center" aria-hidden="true">
            <span className="wordmark" style={{ color: "var(--color-rule)" }}>OptiMart</span>
          </span>
        )}
      </Link>

      <div className="pharm-label pharm-label--stub flex flex-1 flex-col" style={{ borderRadius: "0 0 var(--radius-card) var(--radius-card)", borderTop: 0, borderWidth: "0 1px 1px 1px" }}>
        <p className="pharm-head">
          <span>{categoryLabel(product.category)}</span>
          <span className="num">{product.brand || "OptiMart"}</span>
        </p>
        <h3 className="mt-[var(--space-2xs)]" style={{ fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: 0, lineHeight: 1.35, fontSize: "var(--text-md)", maxWidth: "100%" }}>
          <Link href={`/products/${product.id}`} className="line-clamp-2 no-underline hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="num mt-[var(--space-2xs)]" style={{ fontSize: "var(--text-lg)", fontWeight: 500, color: "var(--color-ink)" }}>
          {THB(product.price)}
        </p>
        <p style={{ marginTop: "var(--space-2xs)", color: out ? "var(--color-muted)" : "var(--color-accent-deep)", fontSize: "var(--text-xs)" }}>
          {out ? "สินค้าหมดชั่วคราว" : `คงเหลือ ${product.stock} ชิ้น`}
        </p>
        <button
          type="button"
          onClick={handleAdd}
          disabled={out}
          className={`btn btn--sm mt-[var(--space-sm)] w-full ${added ? "btn--quiet" : "btn--primary"}`}
        >
          {added ? "เพิ่มแล้วในตะกร้า" : "หยิบลงตะกร้า"}
        </button>
      </div>
    </article>
  );
}
