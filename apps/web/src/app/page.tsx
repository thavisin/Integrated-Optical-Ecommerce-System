"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";
import { CATEGORIES } from "@/lib/format";
import ProductCard from "@/components/ProductCard";
import { Spinner } from "@/components/ui";

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

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-sky-500 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 md:py-24">
          <span className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium">
            🚚 ส่งฟรีทั่วไทย เมื่อสั่งซื้อครบ 1,500 บาท
          </span>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            แว่นตาสวยชัด ราคาถูก
            <br />
            สั่งง่ายในไม่กี่คลิก
          </h1>
          <p className="max-w-xl text-indigo-100">
            เลือกกรอบแว่น แว่นกันแดด เลนส์กรองแสงน้ำเงิน และอุปกรณ์เสริม — โอนเงินแนบสลิปได้ทันที
            ติดตามสถานะคำสั่งซื้อได้ตลอด 24 ชม.
          </p>
          <form onSubmit={onSearch} className="flex w-full max-w-xl gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาแว่นตา เช่น Ray-Ban, กรอบไททาเนียม…"
              className="w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-slate-800 shadow-lg outline-none placeholder:text-slate-400"
            />
            <button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold shadow-lg transition hover:bg-slate-700">
              ค้นหา
            </button>
          </form>
          <div className="flex gap-3 text-sm">
            <Link href="/products" className="rounded-xl bg-white px-5 py-2.5 font-semibold text-indigo-700 hover:bg-indigo-50">
              ช้อปสินค้าทั้งหมด →
            </Link>
            <Link href="/orders" className="rounded-xl border border-white/40 px-5 py-2.5 font-semibold hover:bg-white/10">
              ตรวจสอบคำสั่งซื้อ
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="text-lg font-bold text-slate-900">เลือกตามหมวดหมู่</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.value}
              href={`/products?category=${c.value}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-3xl">{["🤓", "😎", "🔮", "🧰"][i]}</span>
              <div className="mt-2 font-semibold text-slate-700">{c.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">สินค้ามาใหม่ 🆕</h2>
          <Link href="/products" className="text-sm font-medium text-indigo-600 hover:underline">
            ดูทั้งหมด →
          </Link>
        </div>
        {loading ? (
          <Spinner label="กำลังโหลดสินค้า…" />
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
