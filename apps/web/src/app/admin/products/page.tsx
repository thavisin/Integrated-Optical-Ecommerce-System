"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { api, media } from "@/lib/api";
import type { Product } from "@/lib/types";
import { THB, CATEGORIES, categoryLabel } from "@/lib/format";
import { Spinner, ErrorBanner } from "@/components/ui";

interface ProductForm {
  name: string;
  brand: string;
  category: string;
  price: string;
  stock: string;
  description: string;
  imageUrl: string;
}

const EMPTY_FORM: ProductForm = {
  name: "",
  brand: "",
  category: "FRAME",
  price: "",
  stock: "",
  description: "",
  imageUrl: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await api("/api/products?limit=100");
      setProducts(d.products);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setFilePreview("");
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: String(p.price),
      stock: String(p.stock),
      description: p.description,
      imageUrl: p.imageUrl || "",
    });
    setFile(null);
    setFilePreview("");
    setFormError("");
    setModalOpen(true);
  };

  const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setFilePreview(f ? URL.createObjectURL(f) : "");
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("brand", form.brand);
      fd.append("category", form.category);
      fd.append("price", form.price);
      fd.append("stock", form.stock);
      fd.append("description", form.description);
      fd.append("imageUrl", form.imageUrl);
      if (file) fd.append("image", file);

      if (editing) {
        await api(`/api/products/${editing.id}`, { method: "PUT", body: fd });
        setNotice(`แก้ไขสินค้า "${form.name}" เรียบร้อยแล้ว`);
      } else {
        await api("/api/products", { method: "POST", body: fd });
        setNotice(`เพิ่มสินค้า "${form.name}" เรียบร้อยแล้ว`);
      }
      setModalOpen(false);
      await load();
      setTimeout(() => setNotice(""), 3500);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`ยืนยันการลบสินค้า "${p.name}"?`)) return;
    try {
      await api(`/api/products/${p.id}`, { method: "DELETE" });
      setNotice(`ลบสินค้า "${p.name}" เรียบร้อยแล้ว`);
      await load();
      setTimeout(() => setNotice(""), 3500);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 3500);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">📦 จัดการสินค้า (Inventory)</h1>
          <p className="mt-1 text-sm text-slate-500">เพิ่ม แก้ไข ลบสินค้าแว่นตาในระบบ</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          + เพิ่มสินค้าใหม่
        </button>
      </div>

      {notice && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">✓ {notice}</div>
      )}
      {error && <div className="mt-4"><ErrorBanner message={error} /></div>}

      {loading ? (
        <Spinner label="กำลังโหลดสินค้า…" />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">สินค้า</th>
                <th className="px-4 py-3 font-medium">หมวดหมู่</th>
                <th className="px-4 py-3 font-medium">ราคา</th>
                <th className="px-4 py-3 font-medium">สต็อก</th>
                <th className="px-4 py-3 text-right font-medium">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={media(p.imageUrl)} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-xl">🕶️</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-semibold">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{categoryLabel(p.category)}</td>
                  <td className="px-4 py-3 font-bold text-indigo-600">{THB(p.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        p.stock <= 3 ? "bg-rose-100 text-rose-700" : p.stock <= 10 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {p.stock} ชิ้น
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(p)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-100"
                    >
                      ✏️ แก้ไข
                    </button>
                    <button
                      onClick={() => remove(p)}
                      className="ml-2 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      🗑️ ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setModalOpen(false)}>
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-extrabold text-slate-900">
              {editing ? `แก้ไขสินค้า: ${editing.name}` : "เพิ่มสินค้าใหม่"}
            </h2>

            <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-slate-600">ชื่อสินค้า *</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-600">แบรนด์</span>
                <input
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-600">หมวดหมู่</span>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-600">ราคา (บาท) *</span>
                <input
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-600">สต็อก (ชิ้น) *</span>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-slate-600">รายละเอียดสินค้า</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
                />
              </label>

              <div className="sm:col-span-2">
                <span className="text-sm font-medium text-slate-600">รูปสินค้า</span>
                <div className="mt-1 flex flex-wrap items-start gap-4">
                  <label className="flex h-28 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 text-xs text-slate-500 hover:border-indigo-400">
                    <input type="file" accept="image/*" className="hidden" onChange={onPickFile} />
                    {filePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={filePreview} alt="ตัวอย่าง" className="h-full w-full object-cover" />
                    ) : (
                      <span>📷 อัปโหลดรูป</span>
                    )}
                  </label>
                  <label className="block flex-1 min-w-[200px]">
                    <span className="text-xs text-slate-400">หรือวาง URL รูปภาพ (ถ้าไม่อัปโหลดไฟล์)</span>
                    <input
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="https://… หรือ /uploads/products/…"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
                    />
                  </label>
                </div>
              </div>

              {formError && <div className="sm:col-span-2"><ErrorBanner message={formError} /></div>}

              <div className="flex justify-end gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {saving ? "กำลังบันทึก…" : editing ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
