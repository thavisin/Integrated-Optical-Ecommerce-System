"use client";

import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";
import { CATEGORIES } from "@/lib/format";
import ProductCard from "@/components/ProductCard";
import { Spinner, EmptyState } from "@/components/ui";

function ProductsContent() {
  const params = useSearchParams();
  const router = useRouter();

  const search = params.get("search") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "newest";
  const page = Number(params.get("page") || 1);

  const [input, setInput] = useState(search);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => setInput(search), [search]);

  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (category) qs.set("category", category);
  if (sort) qs.set("sort", sort);
  qs.set("page", String(page));
  qs.set("limit", "12");

  useEffect(() => {
    setLoading(true);
    setError("");
    api(`/api/products?${qs.toString()}`)
      .then((d) => {
        setProducts(d.products);
        setTotal(d.total);
        setPages(d.pages);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, sort, page]);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const p = new URLSearchParams(params.toString());
      if (value) p.set(key, value);
      else p.delete(key);
      if (key !== "page") p.delete("page");
      router.push(`/products${p.toString() ? `?${p.toString()}` : ""}`);
    },
    [params, router]
  );

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    updateParam("search", input.trim());
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">สินค้าทั้งหมด 👓</h1>
          <p className="mt-1 text-sm text-slate-500">
            {search ? `ผลการค้นหา "${search}" — ` : ""}
            พบ {total} รายการ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={onSearch} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ค้นหาชื่อ/แบรนด์สินค้า…"
              className="w-56 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
            <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-600">
              ค้นหา
            </button>
          </form>
          <select
            value={category}
            onChange={(e) => updateParam("category", e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
          >
            <option value="">ทุกหมวดหมู่</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
          >
            <option value="newest">มาใหม่ก่อน</option>
            <option value="price_asc">ราคา: ต่ำ → สูง</option>
            <option value="price_desc">ราคา: สูง → ต่ำ</option>
            <option value="name">ชื่อ A → Z</option>
          </select>
        </div>
      </div>

      {error ? (
        <EmptyState icon="⚠️" title={error} />
      ) : loading ? (
        <Spinner label="กำลังโหลดสินค้า…" />
      ) : products.length === 0 ? (
        <EmptyState icon="🔍" title={`ไม่พบสินค้า${search ? ` สำหรับ "${search}"` : ""}`}>
          <button
            onClick={() => router.push("/products")}
            className="mt-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </EmptyState>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => updateParam("page", String(page - 1))}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm disabled:opacity-40"
              >
                ← ก่อนหน้า
              </button>
              <span className="px-3 text-sm text-slate-600">
                หน้า {page} / {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => updateParam("page", String(page + 1))}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm disabled:opacity-40"
              >
                ถัดไป →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ProductsContent />
    </Suspense>
  );
}
