"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, media } from "@/lib/api";
import type { Product } from "@/lib/types";
import { CATEGORIES, THB, categoryLabel } from "@/lib/format";
import ProductCard from "@/components/ProductCard";
import { Spinner } from "@/components/ui";

const CATEGORY_PHOTOS = [
  "/uploads/products/photo-03.jpg",
  "/uploads/products/photo-01.jpg",
  "/uploads/products/photo-10.jpg",
  "/uploads/products/photo-12.jpg",
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const router = useRouter();

  useEffect(() => {
    api("/api/products?limit=8")
      .then((d) => setProducts(d.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    router.push(`/products${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ""}`);
  };

  const featured = products[0];

  return (
    <div>
      {/* hero · Ledge: ข้อความซ้าย และสินค้ามาใหม่ตัวจริงยืนอยู่บนพื้นครีมถึงพลบค่ำ */}
      <section className="shop-hero">
        <div className="container shop-hero-grid">
          <div className="shop-hero-copy">
            <h1>แว่นตาที่ชัด ราคาที่จริง</h1>
            <p className="lead mt-6">
              เลือกกรอบ เลือกเลนส์ โอนเงินแนบสลิป แล้วติดตามคำสั่งซื้อได้ทุกขั้นตอน
            </p>
            <form onSubmit={onSearch} role="search" className="shop-hero-search">
              <label htmlFor="home-search" className="visually-hidden">ค้นหาสินค้า</label>
              <input
                id="home-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ลองพิมพ์ Ray-Ban หรือ ไททาเนียม"
                className="field"
              />
              <button className="btn btn--primary">ค้นหาสินค้า</button>
            </form>
            <div className="shop-hero-actions">
              <Link href="/products" className="btn btn--sm btn--quiet">ดูสินค้าทั้งหมด</Link>
              <Link href="/orders" className="btn btn--sm btn--quiet">ตรวจสอบคำสั่งซื้อ</Link>
            </div>
          </div>

          <div className="shop-hero-visual">
            {loading ? (
              <span className="shop-hero-stage" aria-hidden="true">
                <span className="frame shop-hero-frame" />
              </span>
            ) : featured ? (
              <Link
                href={`/products/${featured.id}`}
                className="shop-hero-feature"
                aria-label={`ดูสินค้ามาใหม่ ${featured.name}`}
              >
                <span className="shop-hero-stage">
                  <span className="frame shop-hero-frame">
                    {featured.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={media(featured.imageUrl)} alt={featured.name} width={800} height={600} />
                    )}
                  </span>
                </span>
                <span className="shop-hero-caption">
                  <span className="small shop-hero-cat">{categoryLabel(featured.category)}</span>
                  <span className="shop-hero-name">{featured.name}</span>
                  <span className="shop-hero-price num">{THB(featured.price)}</span>
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {/* bento: หมวดหมู่สี่ช่องก่อน แล้วจึงหัวข้อสินค้ามาใหม่และเซลล์สินค้าที่ไม่เท่ากัน */}
      <section
        className="container"
        style={{ paddingTop: "var(--space-lg)", paddingBottom: "var(--space-2xl)" }}
        aria-labelledby="home-new"
      >
        <h2 id="home-categories" className="visually-hidden">เลือกตามหมวดหมู่</h2>
        <div className="shop-bento" style={{ marginTop: 0 }}>
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.value}
              href={`/products?category=${c.value}`}
              className={`shop-cell shop-cell--photo ${i < 2 ? "shop-cell--wide" : "shop-cell--narrow"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={media(CATEGORY_PHOTOS[i])} alt="" loading="lazy" />
              <span className="shop-cell-label">{c.label}</span>
            </Link>
          ))}
          <div className="shop-store-head">
            <h2 id="home-new">สินค้ามาใหม่ในร้าน</h2>
            <Link href="/products" className="btn btn--sm btn--secondary">ดูสินค้าทั้งหมดของร้าน</Link>
          </div>
          {loading ? (
            <div className="shop-bento-spinner">
              <Spinner label="กำลังโหลดสินค้า" />
            </div>
          ) : (
            products.map((p) => (
              <div key={p.id} className="shop-bento-item">
                <ProductCard product={p} />
              </div>
            ))
          )}
        </div>
      </section>

      {/* ปิดท้ายด้วยข้อเท็จจริงของการซื้อ: โอนเงิน ตรวจสลิป จัดส่ง */}
      <section className="band band--ink" aria-labelledby="home-terms">
        <div className="container section">
          <h2 id="home-terms">ซื้อง่ายด้วยสามขั้นตอนจริงของร้าน</h2>
          <dl className="rule-list shop-facts">
            <div>
              <dt>โอนเงินแนบสลิป</dt>
              <dd>ชำระผ่านบัญชีธนาคารหรือพร้อมเพย์ แล้วอัปโหลดสลิปในหน้าคำสั่งซื้อ</dd>
            </div>
            <div>
              <dt>ร้านตรวจสอบทุกสลิป</dt>
              <dd>แอดมินเทียบยอดกับคำสั่งซื้อก่อนหักสต็อก สลิปไม่ตรงส่งใหม่ได้</dd>
            </div>
            <div>
              <dt>จัดส่ง 1 ถึง 2 วันทำการ</dt>
              <dd>ส่งฟรีเมื่อสั่งครบ 1,500 บาท ติดตามสถานะได้ตลอด 24 ชั่วโมง</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
