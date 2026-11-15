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

  /* the field follows the URL: a draft only lives while it belongs to the current search */
  const [draft, setDraft] = useState<{ of: string; value: string } | null>(null);
  const input = draft?.of === search ? draft.value : search;

  const [results, setResults] = useState<{
    key: string;
    products: Product[];
    total: number;
    pages: number;
  } | null>(null);
  const [failed, setFailed] = useState<{ key: string; message: string } | null>(null);

  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (category) qs.set("category", category);
  if (sort) qs.set("sort", sort);
  qs.set("page", String(page));
  qs.set("limit", "12");

  const requestKey = qs.toString();

  useEffect(() => {
    let alive = true;
    api(`/api/products?${requestKey}`)
      .then((d) => {
        if (alive) {
          setResults({ key: requestKey, products: d.products, total: d.total, pages: d.pages });
        }
      })
      .catch((e) => {
        if (alive) setFailed({ key: requestKey, message: e.message });
      });
    return () => {
      alive = false;
    };
  }, [requestKey]);

  const error = failed?.key === requestKey ? failed.message : "";
  const loaded = results?.key === requestKey ? results : null;
  const loading = !error && !loaded;
  const products = loaded ? loaded.products : [];
  const total = loaded ? loaded.total : 0;
  const pages = loaded ? loaded.pages : 1;

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
    <div className="container section">
      <h1>สินค้าทั้งหมดของร้าน</h1>

      <div className="toolbar mt-[var(--space-md)]">
        <form onSubmit={onSearch} role="search" className="search-group">
          <label htmlFor="products-search" className="visually-hidden">ค้นหาสินค้า</label>
          <input
            id="products-search"
            value={input}
            onChange={(e) => setDraft({ of: search, value: e.target.value })}
            placeholder="ค้นหาชื่อหรือแบรนด์"
            className="field field-sm"
          />
          <button className="btn btn--sm btn--quiet">ค้นหา</button>
        </form>

        <span className="divider-v" aria-hidden="true" />

        <div>
          <label htmlFor="products-category" className="visually-hidden">กรองตามหมวดหมู่</label>
          <select
            id="products-category"
            value={category}
            onChange={(e) => updateParam("category", e.target.value)}
            className="field field-sm"
          >
            <option value="">ทุกหมวดหมู่</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="products-sort" className="visually-hidden">เรียงลำดับ</label>
          <select
            id="products-sort"
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="field field-sm"
          >
            <option value="newest">มาใหม่ก่อน</option>
            <option value="price_asc">ราคาน้อยไปมาก</option>
            <option value="price_desc">ราคามากไปน้อย</option>
            <option value="name">ชื่อก่อนหน้าหลัง</option>
          </select>
        </div>

        <span className="divider-v" aria-hidden="true" />

        <p className="num whitespace-nowrap text-sm text-muted">
          {search ? `ผลการค้นหา "${search}" พบ ${total} รายการ` : `พบ ${total} รายการ`}
        </p>
      </div>

      {error ? (
        <EmptyState icon="warn" title={error} />
      ) : loading ? (
        <Spinner label="กำลังโหลดสินค้า" />
      ) : products.length === 0 ? (
        <EmptyState icon="search" title={`ไม่พบสินค้า${search ? ` สำหรับ "${search}"` : ""}`}>
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="btn btn--sm mt-[var(--space-2xs)]"
          >
            ล้างการค้นหาและตัวกรอง
          </button>
        </EmptyState>
      ) : (
        <>
          <div className="grid-products mt-[var(--space-xl)]">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {pages > 1 && (
            <nav className="mt-[var(--space-xl)] flex items-center justify-center gap-[var(--space-xs)]" aria-label="แบ่งหน้าสินค้า">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => updateParam("page", String(page - 1))}
                className="btn btn--sm btn--quiet"
              >
                ก่อนหน้า
              </button>
              <span className="num text-sm" style={{ padding: "0 var(--space-sm)", color: "var(--color-muted)" }}>
                {page} / {pages}
              </span>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => updateParam("page", String(page + 1))}
                className="btn btn--sm btn--quiet"
              >
                ถัดไป
              </button>
            </nav>
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
