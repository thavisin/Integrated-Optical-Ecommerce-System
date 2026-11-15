"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, media } from "@/lib/api";
import { THB } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Spinner, EmptyState, ErrorBanner } from "@/components/ui";

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, total, clear } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({ shippingName: "", phone: "", address: "", note: "" });
  const [slip, setSlip] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, shippingName: f.shippingName || user.name }));
  }, [user]);

  // ต้อง login ก่อน checkout
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const onPickSlip = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSlip(file);
    setSlipPreview(file ? URL.createObjectURL(file) : "");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!slip) {
      setError("กรุณาแนบสลิปการโอนเงิน (จะอัปโหลดทีหลังในหน้าคำสั่งซื้อก็ได้)");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("items", JSON.stringify(items.map((i) => ({ productId: i.productId, quantity: i.quantity }))));
      fd.append("shippingName", form.shippingName);
      fd.append("phone", form.phone);
      fd.append("address", form.address);
      if (form.note) fd.append("note", form.note);
      fd.append("slip", slip);

      const d = await api("/api/orders", { method: "POST", body: fd });
      clear();
      router.push(`/orders/${d.order.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitWithoutSlip = async () => {
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("items", JSON.stringify(items.map((i) => ({ productId: i.productId, quantity: i.quantity }))));
      fd.append("shippingName", form.shippingName);
      fd.append("phone", form.phone);
      fd.append("address", form.address);
      if (form.note) fd.append("note", form.note);
      const d = await api("/api/orders", { method: "POST", body: fd });
      clear();
      router.push(`/orders/${d.order.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <Spinner label="กำลังตรวจสอบสิทธิ์…" />;
  if (!user) return <Spinner label="กำลังพาไปหน้าเข้าสู่ระบบ…" />;
  if (items.length === 0)
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState icon="🛒" title="ไม่มีสินค้าในตะกร้า ไม่สามารถสั่งซื้อได้">
          <Link href="/products" className="mt-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white">
            เลือกซื้อสินค้า
          </Link>
        </EmptyState>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-slate-900">สั่งซื้อสินค้า 🧾</h1>
      <p className="mt-1 text-sm text-slate-500">ตรวจสอบสินค้า กรอกที่อยู่จัดส่ง และแนบสลิปโอนเงิน</p>

      <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* shipping */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-800">1. ข้อมูลการจัดส่ง</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-600">ชื่อผู้รับ *</span>
                <input
                  required
                  value={form.shippingName}
                  onChange={(e) => setForm({ ...form, shippingName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-600">เบอร์โทรศัพท์ *</span>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="08x-xxx-xxxx"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-slate-600">ที่อยู่จัดส่ง *</span>
                <textarea
                  required
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-slate-600">หมายเหตุถึงร้าน (ถ้ามี)</span>
                <input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
                />
              </label>
            </div>
          </section>

          {/* payment */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-800">2. ชำระเงินด้วยการโอน + แนบสลิป</h2>
            <div className="mt-4 rounded-2xl bg-teal-50 p-4 text-sm text-teal-900">
              <p className="font-bold">บัญชีร้าน OptiMart</p>
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                <p>🏦 ธนาคารกสิกรไทย (KBANK)</p>
                <p>เลขที่บัญชี: <b>123-4-56789</b></p>
                <p>ชื่อบัญชี: บริษัท ออปติมาร์ท จำกัด</p>
                <p>📱 PromptPay: <b>08-1234-5678</b></p>
              </div>
              <p className="mt-2 text-xs text-teal-700">
                * โอนเงินด้วยยอด {THB(total)} แล้วอัปโหลดรูปสลิปด้านล่าง — แอดมินจะตรวจสอบและจัดส่งให้ภายใน 1-2 วันทำการ
              </p>
            </div>

            <label className="mt-4 block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 p-5 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40">
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onPickSlip} />
              {slipPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slipPreview} alt="สลิปที่แนบ" className="mx-auto max-h-64 rounded-xl object-contain" />
              ) : (
                <span className="text-sm text-slate-500">
                  📎 คลิกเพื่อแนบสลิปการโอนเงิน (JPG / PNG / PDF ไม่เกิน 5MB)
                </span>
              )}
            </label>
            {slip && <p className="mt-2 text-center text-xs text-emerald-600">✓ แนบไฟล์แล้ว: {slip.name}</p>}
          </section>

          {error && <ErrorBanner message={error} />}
        </div>

        {/* summary */}
        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-800">สรุปคำสั่งซื้อ</h2>
          <div className="mt-4 max-h-64 space-y-3 overflow-auto pr-1">
            {items.map((i) => (
              <div key={i.productId} className="flex items-center gap-3 text-sm">
                <div className="h-12 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {i.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={media(i.imageUrl)} alt={i.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-medium">{i.name}</p>
                  <p className="text-xs text-slate-400">
                    {i.quantity} × {THB(i.price)}
                  </p>
                </div>
                <span className="font-semibold">{THB(i.price * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-lg font-extrabold">
            <span>ยอดรวม</span>
            <span className="text-indigo-600">{THB(total)}</span>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {submitting ? "กำลังส่งคำสั่งซื้อ…" : "ยืนยันสั่งซื้อ + ส่งสลิปให้แอดมิน ✅"}
          </button>
          <button
            type="button"
            onClick={submitWithoutSlip}
            disabled={submitting}
            className="mt-2 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            ยืนยันก่อน จะโอนเงิน/ส่งสลิปทีหลัง
          </button>
          <p className="mt-3 text-center text-xs text-slate-400">
            เมื่อกดยืนยันถือว่าคุณตกลงเงื่อนไขการสั่งซื้อของร้าน
          </p>
        </div>
      </form>
    </div>
  );
}
