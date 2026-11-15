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
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    api(`/api/orders/${id}`)
      .then((d) => {
        setOrder(d.order);
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [id]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner label="กำลังโหลดคำสั่งซื้อ" />;
  if (error && !order)
    return (
      <div className="container max-w-3xl py-16">
        <EmptyState icon="warn" title={error}>
          <Link href="/orders" className="btn btn--sm mt-2">กลับไปหน้าคำสั่งซื้อ</Link>
        </EmptyState>
      </div>
    );
  if (!order) return null;

  const step = ORDER_STATUS[order.status]?.step ?? -1;
  const canUpload = ["AWAITING_PAYMENT", "PENDING_VERIFY", "REJECTED"].includes(order.status);
  const canCancel = ["AWAITING_PAYMENT", "PENDING_VERIFY", "REJECTED"].includes(order.status);
  const isSlipPdf = order.slipUrl?.toLowerCase().endsWith(".pdf");
  const statusLabel = ORDER_STATUS[order.status]?.label ?? order.status;
  const timelineNote =
    order.status === "REJECTED"
      ? order.note
        ? `สลิปไม่ผ่านการตรวจ: ${order.note} กรุณาโอนเงินใหม่แล้วส่งสลิปด้านล่าง`
        : "สลิปไม่ผ่านการตรวจ กรุณาโอนเงินใหม่แล้วส่งสลิปด้านล่าง"
      : order.status === "CANCELLED"
        ? order.note
          ? `ยกเลิกแล้วเนื่องจาก ${order.note}`
          : "ยกเลิกแล้ว"
        : `คำสั่งซื้อนี้${statusLabel} จึงไม่แสดงลำดับสถานะ`;

  return (
    <div className="container max-w-4xl py-10">
      <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-muted no-underline hover:underline">
        <ArrowLeft size={14} weight="bold" aria-hidden="true" /> กลับไปหน้าคำสั่งซื้อ
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1>
          คำสั่งซื้อ <span className="num">{orderNo(order.id)}</span>
        </h1>
        <div className="flex items-center gap-3">
          {order.status === "COMPLETED" && <span className="small">ตรวจรับแล้ว</span>}
          <StatusBadge status={order.status} />
        </div>
      </div>
      <p className="num mt-2 text-sm text-muted">
        สั่งเมื่อ {formatDateTime(order.createdAt)} น.
      </p>

      {notice && <div className="noty mt-4" role="status">{notice}</div>}
      {error && <div className="mt-4"><ErrorBanner message={error} /></div>}

      {/* สถานะ: ปีบนเส้นเดียว */}
      <section className="well mt-6" aria-labelledby="od-status">
        <h2 id="od-status" className="visually-hidden m-0 border-0 p-0">สถานะคำสั่งซื้อ</h2>
        {step >= 0 ? (
          <ol className="acct-timeline">
            {ORDER_TIMELINE_STEPS.map((s, i) => (
              <li
                key={s.key}
                data-state={i < step ? "done" : i === step ? "now" : "todo"}
                aria-current={i === step ? "step" : undefined}
              >
                <span className="acct-timeline-label small">{s.label}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="acct-reason small">{timelineNote}</p>
        )}
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="stack-lg">
          {/* รายการสินค้า */}
          <section className="card p-6" aria-labelledby="od-items">
            <h2 id="od-items" className="text-title">รายการสินค้า</h2>
            <ul className="acct-rows mt-4">
              {order.items.map((it) => (
                <li key={it.id}>
                  <Link
                    href={`/products/${it.productId}`}
                    className="frame acct-thumb"
                    aria-label={`ดูสินค้า ${it.product?.name ?? it.productId}`}
                  >
                    {it.product?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={media(it.product.imageUrl)} alt={it.product.name} loading="lazy" width={80} height={60} />
                    ) : (
                      <span aria-hidden="true" className="h-full w-full" />
                    )}
                  </Link>
                  <div className="acct-body">
                    <Link href={`/products/${it.productId}`} className="line-clamp-1 font-medium no-underline hover:underline">
                      {it.product?.name ?? `สินค้าหมายเลข ${it.productId}`}
                    </Link>
                    <p className="num text-xs text-muted">
                      {it.quantity} ชิ้น ชิ้นละ {THB(it.price)}
                    </p>
                  </div>
                  <span className="acct-line-total">{THB(it.price * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="rule-list mt-4">
              <div>
                <dt>ยอดรวม</dt>
                <dd className="num">{THB(order.total)}</dd>
              </div>
            </dl>
          </section>

          {/* สลิป */}
          <section aria-labelledby="od-slip">
            <h2 id="od-slip" className="text-title">สลิปการโอนเงิน</h2>
            {order.slipUrl ? (
              isSlipPdf ? (
                <a
                  href={media(order.slipUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn--sm btn--quiet mt-4"
                >
                  เปิดไฟล์สลิป PDF
                </a>
              ) : (
                <div className="acct-slip mt-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media(order.slipUrl)} alt="สลิปโอนเงินของคำสั่งซื้อนี้" loading="lazy" />
                </div>
              )
            ) : (
              <p className="small mt-2">
                ยังไม่ได้แนบสลิป โอนเงินตามยอดด้านบนแล้วเลือกไฟล์ด้านล่างได้เลย
              </p>
            )}

            {canUpload && (
              <div className="well mt-4">
                <p className="text-sm font-medium text-ink-2">
                  {order.slipUrl ? "ส่งสลิปใหม่กรณีไฟล์เดิมไม่ตรงยอด" : "แนบสลิปการโอนเงิน"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div>
                    <label htmlFor="od-newslip" className="btn btn--sm btn--quiet cursor-pointer acct-file-btn">
                      เลือกไฟล์สลิป
                      <input
                        id="od-newslip"
                        type="file"
                        accept="image/*,application/pdf"
                        className="visually-hidden"
                        onChange={onPickSlip}
                      />
                    </label>
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
                  {newSlip && <span className="small">เลือกแล้ว: {newSlip.name}</span>}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ข้อมูลจัดส่ง */}
        <aside className="stack-lg">
          <section className="well acct-address" aria-labelledby="od-ship">
            <h2 id="od-ship" className="text-title">ที่อยู่จัดส่ง</h2>
            <dl className="rule-list">
              <div>
                <dt>ผู้รับ</dt>
                <dd>{order.shippingName}</dd>
              </div>
              <div>
                <dt>โทรศัพท์</dt>
                <dd className="num">{order.phone}</dd>
              </div>
              <div>
                <dt>ที่อยู่</dt>
                <dd>{order.address}</dd>
              </div>
              {order.note && !["REJECTED", "CANCELLED"].includes(order.status) && (
                <div>
                  <dt>หมายเหตุ</dt>
                  <dd>{order.note}</dd>
                </div>
              )}
            </dl>
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
