"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, media } from "@/lib/api";
import type { Product } from "@/lib/types";
import { CATEGORIES, THB, categoryLabel } from "@/lib/format";
import ProductCard from "@/components/ProductCard";
import { Spinner } from "@/components/ui";

/* ลายเส้นกรอบแว่นแบบแคตตาล็อก ขนาดไอคอน เส้นเดียวกันทั้งชุด */
function FrameMark({ kind }: { kind: "frame" | "sun" | "lens" | "acc" }) {
  const common = {
    width: 28,
    height: 28,
    viewBox: "0 0 48 48",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (kind === "frame")
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="15" cy="24" r="9" />
        <circle cx="33" cy="24" r="9" />
        <path d="M24 22c1.5-2 2.5-2 4 0" />
        <path d="M6 22 3 19M42 22l3-3" />
      </svg>
    );
  if (kind === "sun")
    return (
      <svg {...common} aria-hidden="true">
        <path d="M10 22c0-5 4-8 8-8h12c4 0 8 3 8 8v1c0 6-6 8-14 8s-14-2-14-8z" />
        <path d="M4 18l4 3M44 18l-4 3M24 8v5" />
      </svg>
    );
  if (kind === "lens")
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="24" cy="24" r="14" />
        <path d="M18 18c-2 2-3 4-3 7" />
      </svg>
    );
  return (
    <svg {...common} aria-hidden="true">
      <rect x="8" y="16" width="32" height="18" rx="6" />
      <path d="M8 25h32" />
    </svg>
  );
}

const TILE_KINDS: ("frame" | "sun" | "lens" | "acc")[] = ["frame", "sun", "lens", "acc"];

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

      {/* bento: หมวดหมู่สี่ช่อง กับสินค้ามาใหม่ในเซลล์ไม่เท่ากัน */}
      <section className="container section" aria-labelledby="home-new">
        <div className="shop-store-head">
          <h2 id="home-new">สินค้ามาใหม่ในร้าน</h2>
          <Link href="/products" className="btn btn--sm btn--secondary">ดูสินค้าทั้งหมดของร้าน</Link>
        </div>
        <h2 id="home-categories" className="visually-hidden">เลือกตามหมวดหมู่</h2>
        <div className="shop-bento">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.value}
              href={`/products?category=${c.value}`}
              className={`shop-cell ${i < 2 ? "shop-cell--wide" : "shop-cell--narrow"}`}
            >
              <span className="shop-cell-mark">
                <FrameMark kind={TILE_KINDS[i]} />
              </span>
              <span className="shop-cell-label">{c.label}</span>
            </Link>
          ))}
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
