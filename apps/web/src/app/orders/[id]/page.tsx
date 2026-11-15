"use client";

import { Suspense, useCallback, useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
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
      setNotice("ส่งสลิปเรียบร้อย ร้านจะตรวจสอบและอัปเดตสถานะให้");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const cancelOrder = async () => {
    if (!confirm("ยืนยันการยกเลิกคำสั่งซื้อนี้")) return;
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

  if (loading) return <Spinner label="กำลังโหลดคำสั่งซื้อ" />;
  if (error && !order)
    return (
      <div className="container max-w-3xl" style={{ paddingBlock: "var(--space-2xl)" }}>
        <EmptyState icon="warn" title={error}>
          <Link href="/orders" className="btn btn--sm mt-[var(--space-2xs)]">กลับไปหน้าคำสั่งซื้อ</Link>
        </EmptyState>
      </div>
    );
  if (!order) return null;

  const step = ORDER_STATUS[order.status]?.step ?? -1;
  const canUpload = ["AWAITING_PAYMENT", "PENDING_VERIFY", "REJECTED"].includes(order.status);
  const canCancel = ["AWAITING_PAYMENT", "PENDING_VERIFY", "REJECTED"].includes(order.status);
  const isSlipPdf = order.slipUrl?.toLowerCase().endsWith(".pdf");

  return (
    <div className="container max-w-4xl" style={{ paddingBlock: "var(--space-lg) var(--section-gap-s)" }}>
      <Link href="/orders" className="inline-flex items-center gap-[var(--space-2xs)] text-sm no-underline hover:underline" style={{ color: "var(--color-muted)" }}>
        <ArrowLeft size={14} weight="bold" aria-hidden="true" /> กลับไปหน้าคำสั่งซื้อ
      </Link>

      <div className="mt-[var(--space-sm)] flex flex-wrap items-center justify-between gap-[var(--space-sm)]">
        <h1>
          คำสั่งซื้อ <span className="num">{orderNo(order.id)}</span>
        </h1>
        {order.status === "COMPLETED" && <span className="stamp">ตรวจรับแล้ว</span>}
        <StatusBadge status={order.status} />
      </div>
      <p className="num text-sm" style={{ marginTop: "var(--space-2xs)", color: "var(--color-muted)" }}>
        สั่งเมื่อ {formatDateTime(order.createdAt)} น.
      </p>

      {notice && <div className="noty mt-[var(--space-md)]" role="status">{notice}</div>}
      {error && <div className="mt-[var(--space-md)]"><ErrorBanner message={error} /></div>}
      {order.status === "REJECTED" && order.note && (
        <div className="mt-[var(--space-md)]"><ErrorBanner message={`สลิปไม่ผ่านการตรวจ: ${order.note} กรุณาโอนเงินใหม่แล้วส่งสลิปด้านล่าง`} /></div>
      )}
      {order.status === "CANCELLED" && order.note && (
        <div className="noty mt-[var(--space-md)]" style={{ background: "var(--color-paper-2)", color: "var(--color-ink-2)", borderColor: "var(--color-rule)" }}>
          ยกเลิกแล้วเนื่องจาก {order.note}
        </div>
      )}

      {/* สถานะเป็นแถบฉลาก */}
      <section className="card mt-[var(--space-lg)] p-[var(--space-lg)]" aria-labelledby="od-status">
        <h2 id="od-status" className="visually-hidden">สถานะคำสั่งซื้อ</h2>
        {step >= 0 ? (
          <ol className="steps">
            {ORDER_TIMELINE_STEPS.map((s, i) => (
              <li
                key={s.key}
                className={i < step ? "is-done" : i === step ? "is-now" : ""}
                aria-current={i === step ? "step" : undefined}
              >
                {s.label}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            คำสั่งซื้อนี้{ORDER_STATUS[order.status]?.label} จึงไม่แสดงลำดับสถานะ
          </p>
        )}
      </section>

      <div className="mt-[var(--space-lg)] grid gap-[var(--space-lg)] md:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="stack-lg">
          {/* รายการสินค้า */}
          <section className="card p-[var(--space-lg)]" aria-labelledby="od-items">
            <h2 id="od-items" style={{ fontSize: "var(--text-title)" }}>รายการสินค้า</h2>
            <ul className="mt-[var(--space-md)] space-y-[var(--space-md)]">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center gap-[var(--space-md)]">
                  <Link
                    href={`/products/${it.productId}`}
                    className="frame"
                    style={{ width: "4rem", height: "3rem", borderRadius: "var(--radius-input)", flexShrink: 0 }}
                    aria-label={`ดูสินค้า ${it.product?.name ?? it.productId}`}
                  >
                    {it.product?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={media(it.product.imageUrl)} alt={it.product.name} loading="lazy" width={64} height={48} />
                    ) : (
                      <span aria-hidden="true" className="h-full w-full" />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${it.productId}`} className="line-clamp-1 font-medium no-underline hover:underline">
                      {it.product?.name ?? `สินค้าหมายเลข ${it.productId}`}
                    </Link>
                    <p className="num text-xs" style={{ color: "var(--color-muted)" }}>
                      {it.quantity} ชิ้น ชิ้นละ {THB(it.price)}
                    </p>
                  </div>
                  <span className="num font-bold">{THB(it.price * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-[var(--space-md)] flex justify-between border-t pt-[var(--space-md)] text-lg font-extrabold" style={{ borderColor: "var(--color-rule)" }}>
              <span>ยอดรวม</span>
              <span className="num" style={{ color: "var(--color-accent-deep)" }}>{THB(order.total)}</span>
            </p>
          </section>

          {/* สลิป */}
          <section aria-labelledby="od-slip">
            <h2 id="od-slip" style={{ fontSize: "var(--text-title)" }}>สลิปการโอนเงิน</h2>
            {order.slipUrl ? (
              isSlipPdf ? (
                <a
                  href={media(order.slipUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn--sm btn--quiet mt-[var(--space-md)]"
                >
เปิดไฟล์สลิป PDF
                </a>
              ) : (
                <div className="slip-frame mt-[var(--space-md)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media(order.slipUrl)} alt="สลิปโอนเงินของคำสั่งซื้อนี้" loading="lazy" />
                </div>
              )
            ) : (
              <p className="mt-[var(--space-sm)] text-sm" style={{ color: "var(--color-muted)" }}>
                ยังไม่ได้แนบสลิป โอนเงินตามยอดด้านบนแล้วเลือกไฟล์ด้านล่างได้เลย
              </p>
            )}

            {canUpload && (
              <div className="well mt-[var(--space-md)] p-[var(--space-md)]">
                <p className="text-sm font-medium" style={{ color: "var(--color-ink-2)" }}>
                  {order.slipUrl ? "ส่งสลิปใหม่กรณีไฟล์เดิมไม่ตรงยอด" : "แนบสลิปการโอนเงิน"}
                </p>
                <div className="mt-[var(--space-xs)] flex flex-wrap items-center gap-[var(--space-xs)]">
                  <div>
                    <label htmlFor="od-newslip" className="btn btn--sm btn--quiet cursor-pointer">
                      เลือกไฟล์สลิป
                    </label>
                    <input
                      id="od-newslip"
                      type="file"
                      accept="image/*,application/pdf"
                      className="sr-only"
                      style={{ position: "absolute", width: "1px", height: "1px", opacity: 0 }}
                      onChange={onPickSlip}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={uploadSlip}
                    disabled={!newSlip || busy}
                    className="btn btn--sm btn--primary"
                    aria-busy={busy}
                  >
ส่งสลิปให้ร้าน
                  </button>
                  {newSlip && <span className="text-xs" style={{ color: "var(--color-accent-deep)" }}>เลือกแล้ว: {newSlip.name}</span>}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ข้อมูลจัดส่ง */}
        <aside className="stack-lg">
          <section className="pharm-label" aria-labelledby="od-ship">
            <h2 id="od-ship" style={{ fontSize: "var(--text-xs)", fontWeight: 500, letterSpacing: 0, color: "var(--color-muted)" }}>ที่อยู่จัดส่ง</h2>
            <p className="mt-[var(--space-xs)]" style={{ display: "grid", gap: "var(--space-2xs)" }}>
              <span>{order.shippingName}</span>
              <span>{order.phone}</span>
              <span>{order.address}</span>
              {order.note && <span style={{ color: "var(--color-muted)" }}>หมายเหตุ {order.note}</span>}
            </p>
          </section>

          {canCancel && (
            <button
              type="button"
              onClick={cancelOrder}
              disabled={busy}
              className="btn btn--sm btn--quiet w-full"
            >
              ยกเลิกคำสั่งซื้อนี้
            </button>
          )}
        </aside>
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
