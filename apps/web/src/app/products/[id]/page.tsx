"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, media } from "@/lib/api";
import type { Product } from "@/lib/types";
import { THB, categoryLabel } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { Spinner, EmptyState } from "@/components/ui";

function QtyStepper({
  labelId,
  qty,
  max,
  out,
  onChange,
}: {
  labelId: string;
  qty: number;
  max: number;
  out: boolean;
  onChange: (n: number) => void;
}) {
  return (
    <div className="stepper">
      <span className="visually-hidden" id={labelId}>
        จำนวนที่ต้องการ
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.max(1, qty - 1))}
        disabled={out}
        aria-label="ลดจำนวน"
        aria-labelledby={labelId}
        className="icon-btn"
      >
        −
      </button>
      <output htmlFor={labelId} className="num" aria-live="polite">
        {qty}
      </output>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, qty + 1))}
        disabled={out}
        aria-label="เพิ่มจำนวน"
        aria-labelledby={labelId}
        className="icon-btn"
      >
        +
      </button>
    </div>
  );
}

function ProductDetailContent() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const { add } = useCart();

  const [qty, setQty] = useState(1);
  const [loaded, setLoaded] = useState<{ id: string; product: Product } | null>(null);
  const [failed, setFailed] = useState<{ id: string; message: string } | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    api(`/api/products/${id}`)
      .then((d) => {
        if (alive) setLoaded({ id, product: d.product });
      })
      .catch((e) => {
        if (alive) setFailed({ id, message: e.message });
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const error = failed && failed.id === id ? failed.message : "";
  const product = loaded && loaded.id === id ? loaded.product : null;
  const loading = !error && !product;

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
    <div className="container shop-detail">
      <nav className="shop-crumb small" aria-label="เส้นทางหน้าเว็บ">
        <Link href="/">หน้าแรก</Link>
        <span aria-hidden="true">/</span>
        <Link href="/products">สินค้าทั้งหมด</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="shop-detail-grid">
        <div className="frame shop-detail-frame">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media(product.imageUrl)} alt={product.name} width={800} height={800} />
          ) : (
            <span className="shop-frame-empty" aria-hidden="true">
              <span className="wordmark">OptiMart</span>
            </span>
          )}
        </div>

        <div className="shop-detail-body">
          <div>
            <p className="small">แบรนด์ {product.brand || "OptiMart"}</p>
            <h1 className="shop-detail-title mt-2">{product.name}</h1>
          </div>

          <div className="well shop-detail-well">
            <dl className="rule-list">
              <div>
                <dt>หมวดหมู่</dt>
                <dd>{categoryLabel(product.category)}</dd>
              </div>
              <div>
                <dt>คงเหลือ</dt>
                <dd className="num">{out ? "หมดชั่วคราว" : `${product.stock} ชิ้น`}</dd>
              </div>
              <div>
                <dt>ราคา</dt>
                <dd className="num">{THB(product.price)}</dd>
              </div>
            </dl>
          </div>

          <div className="shop-buy">
            <QtyStepper
              labelId="detail-qty"
              qty={qty}
              max={product.stock}
              out={out}
              onChange={setQty}
            />
            <div className="shop-buy-actions">
              <button
                type="button"
                onClick={() => handleAdd(false)}
                disabled={out}
                className="btn btn--primary"
              >
                {added ? "เพิ่มแล้วในตะกร้า" : "หยิบลงตะกร้า"}
              </button>
              <button
                type="button"
                onClick={() => handleAdd(true)}
                disabled={out}
                className="btn btn--secondary"
              >
                สั่งซื้อทันที
              </button>
            </div>
          </div>

          <section className="shop-desc" aria-labelledby="detail-desc">
            <h2 id="detail-desc">รายละเอียดสินค้า</h2>
            <p className="shop-desc-text">
              {product.description || "รายละเอียดจะเพิ่มเร็ว ๆ นี้"}
            </p>
          </section>
        </div>
      </div>

      <div className="shop-buybar">
        <QtyStepper
          labelId="bar-qty"
          qty={qty}
          max={product.stock}
          out={out}
          onChange={setQty}
        />
        <button
          type="button"
          onClick={() => handleAdd(false)}
          disabled={out}
          className="btn btn--primary"
        >
          {added ? "เพิ่มแล้วในตะกร้า" : "หยิบลงตะกร้า"}
        </button>
        <button
          type="button"
          onClick={() => handleAdd(true)}
          disabled={out}
          className="btn btn--secondary"
        >
          สั่งซื้อทันที
        </button>
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
