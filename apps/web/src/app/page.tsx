"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";
import { CATEGORIES, THB } from "@/lib/format";
import { media } from "@/lib/api";
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
    strokeWidth: 2.5,
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
      {/* hero · Banner: ข้อความซ้าย + การ์ดสินค้ามาใหม่ตัวจริงขวา */}
      <section
        className="container grid items-center gap-[var(--space-xl)] md:grid-cols-[minmax(0,1fr)_19rem]"
        style={{ paddingTop: "var(--space-2xl)", paddingBottom: "var(--space-lg)" }}
      >
        <div style={{ maxWidth: "40rem" }}>
          <h1>แว่นตาที่ชัด ราคาที่จริง</h1>
          <p className="lead" style={{ marginTop: "var(--space-md)" }}>
            เลือกกรอบ เลือกเลนส์ โอนเงินแนบสลิป แล้วติดตามคำสั่งซื้อได้ทุกขั้นตอน
          </p>
          <form onSubmit={onSearch} role="search" className="mt-[var(--space-lg)] flex max-w-[32rem] items-center gap-[var(--space-xs)]">
            <label htmlFor="home-search" className="visually-hidden">ค้นหาสินค้า</label>
            <input
              id="home-search"
              
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ลองพิมพ์ Ray-Ban หรือ ไททาเนียม"
              className="field"
              style={{ flex: 1, minWidth: 0 }}
            />
            <button className="btn btn--primary">ค้นหาสินค้า</button>
          </form>
          <div className="mt-[var(--space-md)] flex flex-wrap gap-[var(--space-xs)]">
            <Link href="/products" className="btn btn--sm btn--quiet">ดูสินค้าทั้งหมด</Link>
            <Link href="/orders" className="btn btn--sm btn--quiet">ตรวจสอบคำสั่งซื้อ</Link>
          </div>
        </div>

        {featured && (
          <Link
            href={`/products/${featured.id}`}
            className="card card--lift hidden overflow-hidden no-underline md:flex md:flex-col"
            aria-label={`ดูสินค้ามาใหม่ ${featured.name}`}
          >
            <div className="frame frame--card">
              {featured.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media(featured.imageUrl)} alt={featured.name} width={800} height={600} />
              )}
            </div>
            <div className="pharm-label pharm-label--stub flex flex-1 flex-col" style={{ borderRadius: "0 0 var(--radius-card) var(--radius-card)", borderTop: 0, borderWidth: "0 1px 1px 1px" }}>
              <p className="pharm-head">
                <span>มาใหม่ในร้าน</span>
                <span className="num">{featured.brand || "OptiMart"}</span>
              </p>
              <p className="line-clamp-2 font-medium" style={{ marginTop: "var(--space-2xs)", fontSize: "var(--text-md)", color: "var(--color-ink)" }}>
                {featured.name}
              </p>
              <p className="num mt-[var(--space-2xs)]" style={{ fontSize: "var(--text-lg)", fontWeight: 500, color: "var(--color-ink)" }}>
                {THB(featured.price)}
              </p>
              <span className="btn btn--sm btn--primary mt-[var(--space-sm)] w-full">ดูรายละเอียดสินค้า</span>
            </div>
          </Link>
        )}
      </section>

      {/* หมวดหมู่เป็นถาดพลาสติก */}
      <section className="container" style={{ paddingBlock: "var(--space-xl)" }} aria-labelledby="home-categories">
        <h2 id="home-categories" className="visually-hidden">เลือกตามหมวดหมู่</h2>
        <div className="grid grid-cols-2 gap-[var(--gap-columns)] md:grid-cols-4">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.value}
              href={`/products?category=${c.value}`}
              className={`plastic plastic--${["mon", "tue", "", "fri"][i]} flex flex-col items-start gap-[var(--space-xs)] p-[var(--space-lg)] no-underline transition-[transform] duration-[var(--dur-micro)] motion-safe:hover:-translate-y-[2px]`}
            >
              <span style={{ color: "var(--color-ink)" }}>
                <FrameMark kind={TILE_KINDS[i]} />
              </span>
              <span style={{ fontWeight: 500, color: "var(--color-ink)" }}>{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* สินค้ามาใหม่ */}
      <section className="container" style={{ paddingTop: "var(--space-lg)", paddingBottom: "var(--space-2xl)" }} aria-labelledby="home-new">
        <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-sm)]">
          <h2 id="home-new">สินค้ามาใหม่ในร้าน</h2>
          <Link href="/products" className="text-sm no-underline hover:underline" style={{ color: "var(--color-accent-deep)" }}>
            ดูสินค้าทั้งหมดของร้าน
          </Link>
        </div>
        {loading ? (
          <Spinner label="กำลังโหลดสินค้า" />
        ) : (
          <div className="grid-products mt-[var(--space-xl)]">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ปิดท้ายด้วยข้อเท็จจริงของการซื้อ: โอนเงิน ตรวจสลิป จัดส่ง */}
      <section className="band" aria-labelledby="home-terms">
        <div className="container" style={{ paddingBlock: "var(--space-2xl)" }}>
          <h2 id="home-terms">ซื้อง่ายด้วยสามขั้นตอนจริงของร้าน</h2>
          <div className="stat-row mt-[var(--space-lg)]" style={{ gap: "var(--space-lg)" }}>
            <div className="stack" style={{ gap: "var(--space-2xs)" }}>
              <p className="font-medium">โอนเงินแนบสลิป</p>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                ชำระผ่านบัญชีธนาคารหรือพร้อมเพย์ แล้วอัปโหลดสลิปในหน้าคำสั่งซื้อ
              </p>
            </div>
            <div className="stack" style={{ gap: "var(--space-2xs)" }}>
              <p className="font-medium">ร้านตรวจสอบทุกสลิป</p>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                แอดมินเทียบยอดกับคำสั่งซื้อก่อนหักสต็อก สลิปไม่ตรงส่งใหม่ได้
              </p>
            </div>
            <div className="stack" style={{ gap: "var(--space-2xs)" }}>
              <p className="font-medium">จัดส่ง 1 ถึง 2 วันทำการ</p>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                ส่งฟรีเมื่อสั่งครบ 1,500 บาท ติดตามสถานะได้ตลอด 24 ชั่วโมง
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
