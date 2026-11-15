"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, media } from "@/lib/api";
import type { Product } from "@/lib/types";
import { THB, categoryLabel } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { Spinner, EmptyState } from "@/components/ui";

function ProductDetailContent() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const { add } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api(`/api/products/${id}`)
      .then((d) => setProduct(d.product))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner label="กำลังโหลดรายละเอียดสินค้า" />;
  if (error || !product)
    return (
      <div className="container max-w-3xl" style={{ paddingBlock: "var(--space-2xl)" }}>
        <EmptyState icon="warn" title={error || "ไม่พบสินค้านี้"}>
          <Link href="/products" className="btn btn--sm mt-[var(--space-2xs)]">กลับไปหน้าสินค้า</Link>
        </EmptyState>
      </div>
    );

  const out = product.stock <= 0;

  const handleAdd = (goCheckout = false) => {
    add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    if (goCheckout) router.push("/checkout");
  };

  return (
    <div className="container" style={{ paddingBlock: "var(--space-lg) var(--section-gap-s)" }}>
      <nav className="breadcrumb" aria-label="เส้นทางหน้าเว็บ">
        <Link href="/">หน้าแรก</Link>
        {" / "}
        <Link href="/products">สินค้าทั้งหมด</Link>
        {" / "}
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="mt-[var(--space-lg)] grid gap-[var(--section-gap-s)] md:grid-cols-2">
        <figure className="card overflow-hidden" style={{ margin: 0 }}>
          <div className="frame" style={{ aspectRatio: "4 / 3", height: "auto", borderRadius: "var(--radius-card)" }}>
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media(product.imageUrl)} alt={product.name} width={800} height={600} />
            ) : (
              <span className="flex h-full w-full items-center justify-center" aria-hidden="true">
                <span className="wordmark" style={{ color: "var(--color-rule)" }}>OptiMart</span>
              </span>
            )}
          </div>
        </figure>

        <div className="stack-lg">
          <div>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              {categoryLabel(product.category)} แบรนด์ {product.brand || "OptiMart"}
            </p>
            <h1 className="mt-[var(--space-2xs)]" style={{ fontSize: "var(--text-2xl)" }}>{product.name}</h1>
          </div>

          <p className="num" style={{ fontSize: "var(--text-3xl)", fontWeight: 500, color: "var(--color-ink)" }}>
            {THB(product.price)}
          </p>

          <p className="text-sm" style={{ color: out ? "var(--color-muted)" : "var(--color-accent-deep)" }}>
            {out ? "สินค้าหมดชั่วคราว พบกันรอบหน้า" : `คงเหลือในสต็อก ${product.stock} ชิ้น`}
          </p>

          <div className="flex flex-wrap items-center gap-[var(--space-md)]">
            <div className="flex items-center" style={{ border: "1px solid var(--color-rule)", borderRadius: "var(--radius-input)" }}>
              <span className="visually-hidden" id="qty-label">จำนวนที่ต้องการ</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={out}
                aria-label="ลดจำนวน"
                aria-labelledby="qty-label"
                className="icon-btn"
                style={{ width: "2.75rem", height: "2.75rem", fontSize: "var(--text-lg)" }}
              >
                −
              </button>
              <output htmlFor="qty-label" className="num" style={{ minWidth: "2.5rem", textAlign: "center", fontSize: "var(--text-md)" }} aria-live="polite">
                {qty}
              </output>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                disabled={out}
                aria-label="เพิ่มจำนวน"
                aria-labelledby="qty-label"
                className="icon-btn"
                style={{ width: "2.75rem", height: "2.75rem", fontSize: "var(--text-lg)" }}
              >
                +
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-[var(--space-xs)]">
            <button
              type="button"
              onClick={() => handleAdd(false)}
              disabled={out}
              className="btn btn--quiet"
            >
              {added ? "เพิ่มแล้วในตะกร้า" : "หยิบลงตะกร้า"}
            </button>
            <button
              type="button"
              onClick={() => handleAdd(true)}
              disabled={out}
              className="btn btn--primary"
            >
              สั่งซื้อทันที
            </button>
          </div>

          <section className="card p-[var(--space-lg)]" aria-labelledby="detail-desc">
            <h2 id="detail-desc" style={{ fontSize: "var(--text-title)" }}>รายละเอียดสินค้า</h2>
            <p className="mt-[var(--space-sm)] whitespace-pre-line text-sm leading-relaxed" style={{ color: "var(--color-ink-2)" }}>
              {product.description || "รายละเอียดจะเพิ่มเร็ว ๆ นี้"}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ProductDetailContent />
    </Suspense>
  );
}
