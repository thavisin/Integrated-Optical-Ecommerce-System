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

  const buildForm = () => {
    const fd = new FormData();
    fd.append("items", JSON.stringify(items.map((i) => ({ productId: i.productId, quantity: i.quantity }))));
    fd.append("shippingName", form.shippingName);
    fd.append("phone", form.phone);
    fd.append("address", form.address);
    if (form.note) fd.append("note", form.note);
    return fd;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!slip) {
      setError("กรุณาแนบสลิปโอนเงิน หรือกดยืนยันก่อนแล้วค่อยส่งสลิปทีหลังในหน้าคำสั่งซื้อ");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const fd = buildForm();
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
      const d = await api("/api/orders", { method: "POST", body: buildForm() });
      clear();
      router.push(`/orders/${d.order.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <Spinner label="กำลังตรวจสอบสิทธิ์" />;
  if (!user) return <Spinner label="กำลังพาไปหน้าเข้าสู่ระบบ" />;
  if (items.length === 0)
    return (
      <div className="container max-w-3xl" style={{ paddingBlock: "var(--space-2xl)" }}>
        <EmptyState icon="cart" title="ไม่มีสินค้าในตะกร้า ยังสั่งซื้อไม่ได้">
          <Link href="/products" className="btn btn--sm mt-[var(--space-2xs)] btn--primary">กลับไปเลือกสินค้า</Link>
        </EmptyState>
      </div>
    );

  return (
    <div className="container" style={{ paddingBlock: "var(--space-lg) var(--section-gap-s)" }}>
      <h1>สั่งซื้อสินค้า</h1>
      <p className="text-sm" style={{ marginTop: "var(--space-2xs)", color: "var(--color-muted)" }}>
        กรอกที่อยู่จัดส่ง โอนเงินตามบัญชีร้าน แล้วแนบสลิปให้ร้านตรวจสอบ
      </p>

      <form onSubmit={submit} className="mt-[var(--space-xl)] grid gap-[var(--space-lg)] lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="stack-lg">
          {/* ที่อยู่จัดส่ง */}
          <section className="card p-[var(--space-lg)]" aria-labelledby="co-shipping">
            <h2 id="co-shipping" style={{ fontSize: "var(--text-title)" }}>ที่อยู่จัดส่ง</h2>
            <div className="mt-[var(--space-md)] grid gap-[var(--space-md)] sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="co-name">ชื่อผู้รับ</label>
                <input
                  id="co-name"
                  required
                  name="shippingName"
                  autoComplete="name"
                  value={form.shippingName}
                  onChange={(e) => setForm({ ...form, shippingName: e.target.value })}
                  className="field"
                />
              </div>
              <div>
                <label className="label" htmlFor="co-phone">เบอร์โทรศัพท์</label>
                <input
                  id="co-phone"
                  required
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="08x-xxx-xxxx"
                  className="field"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="co-address">ที่อยู่จัดส่ง</label>
                <textarea
                  id="co-address"
                  required
                  name="address"
                  autoComplete="street-address"
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="บ้านเลขที่ ถนน แขวงหรือตำบล เขตหรืออำเภอ จังหวัด รหัสไปรษณีย์"
                  className="field"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="co-note">หมายเหตุถึงร้าน (ถ้ามี)</label>
                <input
                  id="co-note"
                  name="note"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="field"
                />
                <p className="help" id="co-note-help">เช่น เวลาที่สะดวกรับโทร หรือเบอร์แว่นเดิม</p>
              </div>
            </div>
          </section>

          {/* ชำระเงิน: บัญชีร้านเป็นฉลากยา */}
          <section aria-labelledby="co-pay">
            <h2 id="co-pay" style={{ fontSize: "var(--text-title)" }}>โอนเงินแล้วแนบสลิป</h2>
            <div className="pharm-label mt-[var(--space-md)]">
              <p className="pharm-head">
                <span>บัญชีร้าน OptiMart</span>
                <span>KBank</span>
              </p>
              <p className="mt-[var(--space-xs)]" style={{ display: "grid", gap: "var(--space-2xs)" }}>
                <span>123-4-56789 บริษัท ออปติมาร์ท จำกัด</span>
                <span>พร้อมเพย์ 08-1234-5678</span>
                <span style={{ color: "var(--color-accent-deep)" }}>ยอดที่ต้องโอน {THB(total)}</span>
              </p>
            </div>

            <div className="mt-[var(--space-md)]">
              <label
                htmlFor="co-slip"
                className="flex cursor-pointer flex-col items-center justify-center gap-[var(--space-2xs)] rounded-[var(--radius-input)] p-[var(--space-lg)] text-center transition-colors duration-[var(--dur-short)]"
                style={{ border: "2px dashed var(--color-rule)", background: "var(--color-paper)" }}
              >
                <input
                  id="co-slip"
                  type="file"
                  accept="image/*,application/pdf"
                  className="sr-only"
                  style={{ position: "absolute", width: "1px", height: "1px", opacity: 0 }}
                  onChange={onPickSlip}
                />
                {slipPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={slipPreview} alt="สลิปที่เลือกไว้" className="max-h-64 rounded-[var(--radius-input)] object-contain" />
                ) : (
                  <>
                    <span className="text-sm" style={{ color: "var(--color-muted)" }}>
                      เลือกไฟล์สลิปโอนเงิน รูปภาพหรือ PDF ขนาดไม่เกิน 5MB
                    </span>
                  </>
                )}
              </label>
              {slip && (
                <p className="help" role="status">แนบไฟล์แล้ว: {slip.name}</p>
              )}
            </div>
          </section>

          {error && <ErrorBanner message={error} />}
        </div>

        {/* สรุป */}
        <aside className="card h-fit p-[var(--space-lg)]">
          <h2 style={{ fontSize: "var(--text-title)" }}>สรุปคำสั่งซื้อ</h2>
          <ul className="mt-[var(--space-md)] max-h-64 space-y-[var(--space-sm)] overflow-auto pr-[var(--space-2xs)]">
            {items.map((i) => (
              <li key={i.productId} className="flex items-center gap-[var(--space-sm)] text-sm">
                <span className="frame" style={{ width: "3rem", height: "2.25rem", borderRadius: "var(--radius-input)", flexShrink: 0 }}>
                  {i.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={media(i.imageUrl)} alt="" loading="lazy" width={48} height={36} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 block font-medium">{i.name}</span>
                  <span className="num text-xs" style={{ color: "var(--color-muted)" }}>
                    สั่ง {i.quantity} ชิ้น ชิ้นละ {THB(i.price)}
                  </span>
                </span>
                <span className="num font-medium">{THB(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-[var(--space-md)] flex justify-between border-t pt-[var(--space-md)] text-lg font-bold" style={{ borderColor: "var(--color-rule)" }}>
            <span>ยอดรวม</span>
            <span className="num" style={{ color: "var(--color-accent-deep)" }}>{THB(total)}</span>
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn--primary mt-[var(--space-md)] w-full"
            aria-busy={submitting}
          >
            {submitting ? "กำลังส่งคำสั่งซื้อ" : "ยืนยันสั่งซื้อพร้อมสลิป"}
          </button>
          <button
            type="button"
            onClick={submitWithoutSlip}
            disabled={submitting}
            className="btn btn--sm btn--quiet mt-[var(--space-xs)] w-full"
          >
            ยืนยันก่อน ส่งสลิปทีหลัง
          </button>
          <p className="help text-center">กดยืนยันแล้วระบบสร้างคำสั่งซื้อและส่งสลิปถึงแอดมินทันที</p>
        </aside>
      </form>
    </div>
  );
}
