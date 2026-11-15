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
        className="frame frame--card frame--fit block"
        aria-label={`ดูรายละเอียด ${product.name}`}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media(product.imageUrl)} alt={product.name} loading="lazy" />
        ) : (
          <span className="shop-frame-empty" aria-hidden="true">
            <span className="wordmark">OptiMart</span>
          </span>
        )}
      </Link>

      <div className="shop-card-body">
        <p className="small shop-card-meta">
          <span>{categoryLabel(product.category)}</span>{" "}
          <span>{product.brand || "OptiMart"}</span>
        </p>
        <h3 className="line-clamp-2">
          <Link href={`/products/${product.id}`} className="no-underline hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="shop-card-price num">{THB(product.price)}</p>
        <p className="small">
          {out ? "สินค้าหมดชั่วคราว" : `คงเหลือ ${product.stock} ชิ้น`}
        </p>
        <button
          type="button"
          onClick={handleAdd}
          disabled={out}
          className="btn btn--sm btn--quiet mt-4 w-full"
        >
          {added ? "เพิ่มแล้วในตะกร้า" : "หยิบลงตะกร้า"}
        </button>
      </div>
    </article>
  );
}
