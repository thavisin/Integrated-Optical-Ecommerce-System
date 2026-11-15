"use client";

import { Suspense, useCallback, useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, media } from "@/lib/api";
import type { Order } from "@/lib/types";
import { THB, formatDateTime, orderNo, ORDER_STATUS, ORDER_TIMELINE_STEPS } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import { Spinner, EmptyState, ErrorBanner } from "@/components/ui";

function OrderDetailContent() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newSlip, setNewSlip] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await api(`/api/orders/${id}`);
      setOrder(d.order);
      setError("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onPickSlip = (e: ChangeEvent<HTMLInputElement>) => setNewSlip(e.target.files?.[0] || null);

  const uploadSlip = async () => {
    if (!newSlip) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("slip", newSlip);
      await api(`/api/orders/${id}/slip`, { method: "POST", body: fd });
      setNewSlip(null);
      setNotice("ส่งสลิปเรียบร้อยแล้ว รอแอดมินตรวจสอบ 🔍");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const cancelOrder = async () => {
    if (!confirm("ยืนยันการยกเลิกคำสั่งซื้อนี้?")) return;
    setBusy(true);
    try {
      await api(`/api/orders/${id}/cancel`, { method: "POST" });
      setNotice("ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner label="กำลังโหลดคำสั่งซื้อ…" />;
  if (error && !order)
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState icon="😕" title={error}>
          <Link href="/orders" className="mt-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            กลับไปหน้าคำสั่งซื้อ
          </Link>
        </EmptyState>
      </div>
    );
  if (!order) return null;

  const step = ORDER_STATUS[order.status]?.step ?? -1;
  const canUpload = ["AWAITING_PAYMENT", "REJECTED"].includes(order.status) || (order.status === "PENDING_VERIFY");
  const canCancel = ["AWAITING_PAYMENT", "PENDING_VERIFY", "REJECTED"].includes(order.status);
  const isSlipPdf = order.slipUrl?.toLowerCase().endsWith(".pdf");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/orders" className="text-sm text-slate-500 hover:text-indigo-600">← กลับไปหน้าคำสั่งซื้อ</Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-slate-900">คำสั่งซื้อ {orderNo(order.id)}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-slate-500">สั่งเมื่อ {formatDateTime(order.createdAt)} น.</p>

      {notice && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✓ {notice}
        </div>
      )}
      {error && <div className="mt-4"><ErrorBanner message={error} /></div>}
      {order.status === "REJECTED" && order.note && (
        <div className="mt-4"><ErrorBanner message={`สลิปถูกปฏิเสธ: ${order.note} — กรุณาอัปโหลดสลิปใหม่ด้านล่าง`} /></div>
      )}
      {order.status === "CANCELLED" && order.note && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600">
          ยกเลิกแล้ว: {order.note}
        </div>
      )}

      {/* Timeline */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        {step >= 0 ? (
          <ol className="grid grid-cols-5 gap-1">
            {ORDER_TIMELINE_STEPS.map((s, i) => {
              const done = i <= step;
              const current = i === step;
              return (
                <li key={s.key} className="flex flex-col items-center gap-2 text-center">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm transition ${
                      done ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-300"
                    } ${current ? "ring-4 ring-indigo-100" : ""}`}
                  >
                    {done ? s.icon : "○"}
                  </span>
                  <span className={`text-[11px] leading-tight sm:text-xs ${done ? "font-semibold text-slate-700" : "text-slate-400"}`}>
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-center text-sm text-slate-500">
            คำสั่งซื้อนี้{ORDER_STATUS[order.status]?.label} — ไม่แสดง timeline
          </p>
        )}
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* items */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-800">รายการสินค้า</h2>
            <div className="mt-4 space-y-4">
              {order.items.map((it) => (
                <div key={it.id} className="flex items-center gap-4">
                  <Link href={`/products/${it.productId}`} className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {it.product?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={media(it.product.imageUrl)} alt={it.product.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-2xl">🕶️</span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${it.productId}`} className="line-clamp-1 font-medium hover:text-indigo-600">
                      {it.product?.name ?? `สินค้า #${it.productId}`}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {it.quantity} × {THB(it.price)}
                    </p>
                  </div>
                  <span className="font-bold">{THB(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-lg font-extrabold">
              <span>ยอดรวม</span>
              <span className="text-indigo-600">{THB(order.total)}</span>
            </div>
          </section>

          {/* slip */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-800">สลิปการโอนเงิน</h2>
            {order.slipUrl ? (
              isSlipPdf ? (
                <a
                  href={media(order.slipUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  📄 เปิดไฟล์สลิป (PDF)
                </a>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media(order.slipUrl)}
                  alt="สลิปโอนเงิน"
                  className="mt-3 max-h-96 rounded-xl border border-slate-100 object-contain"
                />
              )
            ) : (
              <p className="mt-3 text-sm text-slate-500">ยังไม่ได้แนบสลิป</p>
            )}

            {canUpload && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-600">
                  {order.slipUrl ? "ส่งสลิปใหม่ (กรณีสลิปเดิมไม่ผ่านการตรวจสอบ)" : "แนบสลิปการโอนเงิน"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50">
                    เลือกไฟล์…
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onPickSlip} />
                  </label>
                  <button
                    onClick={uploadSlip}
                    disabled={!newSlip || busy}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40"
                  >
                    {busy ? "กำลังส่ง…" : "ส่งสลิปให้แอดมิน 📤"}
                  </button>
                  {newSlip && <span className="text-xs text-emerald-600">✓ {newSlip.name}</span>}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* side info */}
        <div className="h-fit space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
            <h2 className="font-bold text-slate-800">ที่อยู่จัดส่ง</h2>
            <p className="mt-3 font-medium text-slate-700">{order.shippingName}</p>
            <p className="text-slate-500">{order.phone}</p>
            <p className="mt-1 leading-relaxed text-slate-500">{order.address}</p>
            {order.note && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-500">หมายเหตุ: {order.note}</p>}
          </section>

          {canCancel && (
            <button
              onClick={cancelOrder}
              disabled={busy}
              className="w-full rounded-2xl border border-rose-200 bg-white py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            >
              ยกเลิกคำสั่งซื้อ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <OrderDetailContent />
    </Suspense>
  );
}
