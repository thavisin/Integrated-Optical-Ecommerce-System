"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { X } from "@phosphor-icons/react";
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
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  // Escape closes the add/edit dialog
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

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
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`ยืนยันการลบสินค้า "${p.name}"`)) return;
    try {
      await api(`/api/products/${p.id}`, { method: "DELETE" });
      setNotice(`ลบสินค้า "${p.name}" เรียบร้อยแล้ว`);
      await load();
      setTimeout(() => setNotice(""), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setTimeout(() => setError(""), 3500);
    }
  };

  return (
    <div className="stack-lg">
      <div className="adm-acts flex-wrap items-center justify-between gap-4">
        <div>
          <h1>จัดการสินค้าในสต็อก</h1>
          <p className="mt-2 text-sm text-muted">
            เพิ่ม แก้ไข และลบสินค้าของร้าน
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn btn--primary">
          เพิ่มสินค้าใหม่
        </button>
      </div>

      {notice && <div className="noty" role="status">{notice}</div>}
      {error && <ErrorBanner message={error} />}

      {loading ? (
        <Spinner label="กำลังโหลดสินค้า" />
      ) : (
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">สินค้า</th>
                <th scope="col">หมวดหมู่</th>
                <th scope="col">ราคา</th>
                <th scope="col">สต็อก</th>
                <th scope="col" className="text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="frame" style={{ width: "3.5rem", height: "2.5rem", flexShrink: 0 }}>
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={media(p.imageUrl)} alt="" loading="lazy" width={56} height={40} />
                        ) : (
                          <span aria-hidden="true" className="h-full w-full" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-1 block font-medium text-ink">{p.name}</span>
                        <span className="block text-xs text-muted">{p.brand}</span>
                      </span>
                    </div>
                  </td>
                  <td>{categoryLabel(p.category)}</td>
                  <td className="num font-medium">{THB(p.price)}</td>
                  <td>
                    <span className={`chip ${p.stock <= 3 ? "chip--signal" : p.stock <= 10 ? "chip--gold" : "chip--muted"}`}>
                      <span className="num">{p.stock} ชิ้น</span>
                    </span>
                  </td>
                  <td>
                    <div className="adm-acts justify-end">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="btn btn--sm btn--quiet"
                        aria-label={`แก้ไขสินค้า ${p.name}`}
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(p)}
                        className="btn btn--sm btn--quiet text-muted"
                        aria-label={`ลบสินค้า ${p.name}`}
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* modal */}
      {modalOpen && (
        <div className="modal-scrim" onClick={() => setModalOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h2 id="product-modal-title">
                {editing ? `แก้ไข ${editing.name}` : "เพิ่มสินค้าใหม่ในสต็อก"}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="icon-btn" aria-label="ปิดหน้าต่าง" autoFocus>
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={save} className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="pf-name">ชื่อสินค้า</label>
                <input
                  id="pf-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="field"
                />
              </div>
              <div>
                <label className="label" htmlFor="pf-brand">แบรนด์</label>
                <input
                  id="pf-brand"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="field"
                />
              </div>
              <div>
                <label className="label" htmlFor="pf-category">หมวดหมู่</label>
                <select
                  id="pf-category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="field"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="pf-price">ราคาต่อชิ้น บาท</label>
                <input
                  id="pf-price"
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="field"
                />
              </div>
              <div>
                <label className="label" htmlFor="pf-stock">จำนวนในสต็อก ชิ้น</label>
                <input
                  id="pf-stock"
                  required
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="field"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="pf-desc">รายละเอียดสินค้า</label>
                <textarea
                  id="pf-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="field"
                />
              </div>

              <div className="sm:col-span-2">
                <p className="label">รูปสินค้า</p>
                <div className="flex flex-wrap items-start gap-4">
                  <label htmlFor="pf-image" className="adm-upload">
                    <input
                      id="pf-image"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={onPickFile}
                    />
                    {filePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={filePreview} alt="ตัวอย่างรูปที่เลือก" />
                    ) : (
                      <span className="text-xs text-muted">อัปโหลดรูปสินค้า</span>
                    )}
                  </label>
                  <div className="min-w-0 flex-1">
                    <label className="label" htmlFor="pf-url">หรือวางที่อยู่รูปภาพ ถ้าไม่อัปโหลดไฟล์</label>
                    <input
                      id="pf-url"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="https:// หรือ /uploads/products/"
                      className="field"
                    />
                  </div>
                </div>
              </div>

              {formError && <div className="sm:col-span-2"><ErrorBanner message={formError} /></div>}

              <div className="adm-acts justify-end sm:col-span-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn--quiet">ยกเลิก</button>
                <button type="submit" disabled={saving} className="btn btn--primary" aria-busy={saving}>
                  {saving ? "กำลังบันทึก" : editing ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
