"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, media } from "@/lib/api";
import type { Product } from "@/lib/types";
import { THB, categoryLabel } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { Spinner, EmptyState, ErrorBanner } from "@/components/ui";

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

  if (loading) return <Spinner label="กำลังโหลดสินค้า…" />;
  if (error || !product)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState icon="😕" title={error || "ไม่พบสินค้านี้"}>
          <Link href="/products" className="mt-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            กลับไปหน้าสินค้า
          </Link>
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-indigo-600">หน้าแรก</Link> /{" "}
        <Link href="/products" className="hover:text-indigo-600">สินค้า</Link> /{" "}
        <span className="text-slate-700">{product.name}</span>
      </nav>

      <div className="mt-5 grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media(product.imageUrl)} alt={product.name} className="aspect-[4/3] w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center text-8xl">🕶️</div>
          )}
        </div>

        <div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {categoryLabel(product.category)}
          </span>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">{product.name}</h1>
          <p className="mt-1 text-slate-500">แบรนด์: {product.brand || "—"}</p>
          <div className="mt-4 text-3xl font-extrabold text-indigo-600">{THB(product.price)}</div>

          <div className="mt-2 text-sm">
            {out ? (
              <span className="font-semibold text-rose-500">สินค้าหมดชั่วคราว</span>
            ) : (
              <span className="text-emerald-600">คงเหลือ {product.stock} ชิ้น</span>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">จำนวน</span>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={out}
                className="px-4 py-2.5 text-lg disabled:opacity-30"
              >
                −
              </button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                disabled={out}
                className="px-4 py-2.5 text-lg disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => handleAdd(false)}
              disabled={out}
              className="rounded-xl border-2 border-slate-900 px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white disabled:opacity-30"
            >
              {added ? "เพิ่มแล้ว ✓" : "หยิบลงตะกร้า 🛒"}
            </button>
            <button
              onClick={() => handleAdd(true)}
              disabled={out}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-30"
            >
              สั่งซื้อทันที ⚡
            </button>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-800">รายละเอียดสินค้า</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {product.description || "—"}
            </p>
          </div>
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
