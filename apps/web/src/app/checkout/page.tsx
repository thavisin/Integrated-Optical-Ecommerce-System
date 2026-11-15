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
  const [nameTouched, setNameTouched] = useState(false);
  const [slip, setSlip] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // the account name fills the field until the customer types their own
  const shippingName = nameTouched ? form.shippingName : (user?.name ?? "");

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
    fd.append("shippingName", shippingName);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <Spinner label="กำลังตรวจสอบสิทธิ์" />;
  if (!user) return <Spinner label="กำลังพาไปหน้าเข้าสู่ระบบ" />;
  if (items.length === 0)
    return (
      <div className="container max-w-3xl py-16">
        <EmptyState icon="cart" title="ไม่มีสินค้าในตะกร้า ยังสั่งซื้อไม่ได้">
          <Link href="/products" className="btn btn--sm btn--primary mt-2">กลับไปเลือกสินค้า</Link>
        </EmptyState>
      </div>
    );

  return (
    <div className="container py-10">
      <h1>สั่งซื้อสินค้า</h1>
      <p className="lead mt-2 text-muted">
        กรอกที่อยู่จัดส่ง โอนเงินตามบัญชีร้าน แล้วแนบสลิปให้ร้านตรวจสอบ
      </p>

      <form onSubmit={submit} className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="stack-lg">
          {/* ที่อยู่จัดส่ง */}
          <section className="card p-6" aria-labelledby="co-shipping">
            <h2 id="co-shipping" className="text-title">ที่อยู่จัดส่ง</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="co-name">ชื่อผู้รับ</label>
                <input
                  id="co-name"
                  required
                  name="shippingName"
                  autoComplete="name"
                  value={shippingName}
                  onChange={(e) => {
                    setNameTouched(true);
                    setForm({ ...form, shippingName: e.target.value });
                  }}
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

          {/* ชำระเงิน: บัญชีร้านเป็นฉลากแบบมีเส้น */}
          <section className="card p-6" aria-labelledby="co-pay">
            <h2 id="co-pay" className="text-title">โอนเงินแล้วแนบสลิป</h2>
            <dl className="rule-list mt-4">
              <div>
                <dt>บัญชีร้าน OptiMart</dt>
                <dd>KBank</dd>
              </div>
              <div>
                <dt>เลขที่บัญชี</dt>
                <dd className="num">123-4-56789 บริษัท ออปติมาร์ท จำกัด</dd>
              </div>
              <div>
                <dt>พร้อมเพย์</dt>
                <dd className="num">08-1234-5678</dd>
              </div>
              <div>
                <dt>ยอดที่ต้องโอน</dt>
                <dd className="num">{THB(total)}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <label className="label" htmlFor="co-slip">สลิปโอนเงิน</label>
              <input
                id="co-slip"
                type="file"
                accept="image/*,application/pdf"
                className="field acct-file"
                onChange={onPickSlip}
              />
              <p className="help">เลือกไฟล์สลิปโอนเงิน รูปภาพหรือ PDF ขนาดไม่เกิน 5MB</p>
              {slipPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slipPreview} alt="สลิปที่เลือกไว้" className="acct-slip-preview" />
              )}
              {slip && <p className="help" role="status">แนบไฟล์แล้ว: {slip.name}</p>}
            </div>
          </section>

          {error && <ErrorBanner message={error} />}
        </div>

        {/* สรุป */}
        <aside className="well h-fit">
          <h2 className="text-title">สรุปคำสั่งซื้อ</h2>
          <ul className="acct-rows acct-rows--tight mt-4 max-h-64 overflow-auto">
            {items.map((i) => (
              <li key={i.productId}>
                <span className="frame acct-thumb acct-thumb--sm">
                  {i.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={media(i.imageUrl)} alt="" loading="lazy" width={48} height={36} />
                  )}
                </span>
                <span className="acct-body">
                  <span className="line-clamp-1 block font-medium">{i.name}</span>
                  <span className="num text-xs text-muted">
                    สั่ง {i.quantity} ชิ้น ชิ้นละ {THB(i.price)}
                  </span>
                </span>
                <span className="acct-line-total">{THB(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="rule-list mt-4">
            <div>
              <dt>ยอดรวม</dt>
              <dd className="num">{THB(total)}</dd>
            </div>
          </dl>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn--primary mt-6 w-full"
            aria-busy={submitting}
          >
            {submitting ? "กำลังส่งคำสั่งซื้อ" : "ยืนยันสั่งซื้อพร้อมสลิป"}
          </button>
          <button
            type="button"
            onClick={submitWithoutSlip}
            disabled={submitting}
            className="btn btn--sm btn--quiet mt-2 w-full"
          >
            ยืนยันก่อน ส่งสลิปทีหลัง
          </button>
          <p className="help text-center">กดยืนยันแล้วระบบสร้างคำสั่งซื้อและส่งสลิปถึงแอดมินทันที</p>
        </aside>
      </form>
    </div>
  );
}
