"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "@phosphor-icons/react";
import { api, media } from "@/lib/api";
import type { Order } from "@/lib/types";
import { THB, formatDateTime, orderNo, ORDER_STATUS } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import { Spinner, ErrorBanner } from "@/components/ui";

const FILTER_TABS = [
  { value: "", label: "ทั้งหมด" },
  { value: "AWAITING_PAYMENT", label: "รอโอนเงิน" },
  { value: "PENDING_VERIFY", label: "รอตรวจสลิป" },
  { value: "PAID", label: "ชำระแล้ว" },
  { value: "SHIPPED", label: "จัดส่งแล้ว" },
  { value: "COMPLETED", label: "สำเร็จ" },
  { value: "REJECTED", label: "ไม่ผ่าน" },
  { value: "CANCELLED", label: "ยกเลิก" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("");
  const [slipOrder, setSlipOrder] = useState<Order | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api("/api/orders?all=true");
      setOrders(d.orders);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3500);
  };

  const updateStatus = async (order: Order, status: string, note?: string) => {
    setBusyId(order.id);
    setError("");
    try {
      await api(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, note }),
      });
      showNotice(`อัปเดต ${orderNo(order.id)} เป็น ${ORDER_STATUS[status]?.label ?? status} แล้ว`);
      setSlipOrder(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (order: Order) => {
    const reason = window.prompt(`เหตุผลที่สลิปของ ${orderNo(order.id)} ไม่ผ่าน จะแสดงให้ลูกค้าเห็น`);
    if (!reason?.trim()) return;
    await updateStatus(order, "REJECTED", reason);
  };

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;
  const countByStatus = (s: string) => (s ? orders.filter((o) => o.status === s).length : orders.length);

  return (
    <div className="stack-lg">
      <div>
        <h1>คำสั่งซื้อและการตรวจสลิป</h1>
        <p className="text-sm" style={{ marginTop: "var(--space-2xs)", color: "var(--color-muted)" }}>
          เปิดสลิป เทียบยอดกับคำสั่งซื้อ แล้วอนุมัติหรือแจ้งเหตุผลกลับลูกค้า
        </p>
      </div>

      {notice && <div className="noty" role="status">{notice}</div>}
      {error && <ErrorBanner message={error} />}

      <div className="seg seg--tabs" role="group" aria-label="กรองคำสั่งซื้อตามสถานะ">
        {FILTER_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setFilter(t.value)}
            aria-pressed={filter === t.value}
          >
            {t.label} <span className="num">{countByStatus(t.value)}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="กำลังโหลดคำสั่งซื้อ" />
      ) : filtered.length === 0 ? (
        <div className="card p-[var(--space-2xl)] text-center text-sm" style={{ color: "var(--color-muted)" }}>
          ไม่มีคำสั่งซื้อในสถานะนี้
        </div>
      ) : (
        <div className="stack-lg">
          {filtered.map((order) => (
            <article key={order.id} className="card p-[var(--space-lg)]">
              <div className="flex flex-wrap items-start justify-between gap-[var(--space-sm)]">
                <div>
                  <div className="flex flex-wrap items-center gap-[var(--space-xs)]">
                    <h2 className="num" style={{ fontSize: "var(--text-md)", letterSpacing: 0 }}>{orderNo(order.id)}</h2>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="num text-xs" style={{ marginTop: "var(--space-2xs)", color: "var(--color-muted)" }}>
                    {formatDateTime(order.createdAt)} น. ลูกค้า {order.user?.name} ({order.user?.email})
                  </p>
                </div>
                <div className="text-right">
                  <p className="num text-lg font-bold" style={{ color: "var(--color-accent-deep)" }}>{THB(order.total)}</p>
                  <p className="num text-xs" style={{ color: "var(--color-muted)" }}>
                    {order.items.reduce((s, i) => s + i.quantity, 0)} ชิ้น
                  </p>
                </div>
              </div>

              <div className="well mt-[var(--space-md)] p-[var(--space-md)] text-xs" style={{ color: "var(--color-ink-2)" }}>
                <p>ส่งถึง {order.shippingName} เบอร์ {order.phone}</p>
                <p style={{ marginTop: "var(--space-2xs)" }}>{order.address}</p>
                {order.note && <p style={{ marginTop: "var(--space-2xs)", color: "var(--color-muted)" }}>หมายเหตุ {order.note}</p>}
              </div>

              <ul className="mt-[var(--space-md)] space-y-[var(--space-2xs)] text-sm" style={{ color: "var(--color-ink-2)" }}>
                {order.items.map((it) => (
                  <li key={it.id} className="flex justify-between gap-[var(--space-sm)]">
                    <span className="line-clamp-1">
                      {it.product?.name ?? `สินค้าหมายเลข ${it.productId}`} <span className="num">x{it.quantity}</span>
                    </span>
                    <span className="num ml-[var(--space-sm)] shrink-0">{THB(it.price * it.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-[var(--space-md)] flex flex-wrap gap-[var(--space-xs)]">
                {order.slipUrl && (
                  <button
                    type="button"
                    onClick={() => setSlipOrder(order)}
                    className="btn btn--sm btn--quiet"
                  >
                    ดูสลิปโอนเงิน
                  </button>
                )}
                {order.status === "PENDING_VERIFY" && (
                  <>
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => updateStatus(order, "PAID")}
                      className="btn btn--sm btn--primary"
                      aria-busy={busyId === order.id}
                    >
                    </button>
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => reject(order)}
                      className="btn btn--sm btn--quiet"
                    >
                    </button>
                  </>
                )}
                {order.status === "PAID" && (
                  <button
                    type="button"
                    disabled={busyId === order.id}
                    onClick={() => updateStatus(order, "SHIPPED")}
                    className="btn btn--sm btn--primary"
                    aria-busy={busyId === order.id}
                  >
                  </button>
                )}
                {order.status === "SHIPPED" && (
                  <button
                    type="button"
                    disabled={busyId === order.id}
                    onClick={() => updateStatus(order, "COMPLETED")}
                    className="btn btn--sm btn--primary"
                    aria-busy={busyId === order.id}
                  >
                  </button>
                )}
                {["AWAITING_PAYMENT", "PENDING_VERIFY", "REJECTED"].includes(order.status) && (
                  <button
                    type="button"
                    disabled={busyId === order.id}
                    onClick={() => {
                      if (confirm(`ยกเลิกคำสั่งซื้อ ${orderNo(order.id)}?`)) updateStatus(order, "CANCELLED", "แอดมินยกเลิกคำสั่งซื้อ");
                    }}
                    className="btn btn--sm btn--quiet"
                    style={{ color: "var(--color-muted)" }}
                  >
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* slip modal */}
      {slipOrder && (
        <div className="modal-scrim" onClick={() => setSlipOrder(null)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="slip-modal-title" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "28rem" }}>
            <div className="flex items-start justify-between gap-[var(--space-md)]">
              <div>
                <h2 id="slip-modal-title" className="num" style={{ fontSize: "var(--text-md)", letterSpacing: 0 }}>
                  สลิปของ {orderNo(slipOrder.id)}
                </h2>
                <p className="num text-sm" style={{ color: "var(--color-muted)", marginTop: "var(--space-2xs)" }}>
                  ยอดคำสั่งซื้อ {THB(slipOrder.total)} เทียบกับยอดในสลิปก่อนอนุมัติ
                </p>
              </div>
              <button type="button" onClick={() => setSlipOrder(null)} className="icon-btn" aria-label="ปิดหน้าต่าง">
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <div className="slip-frame mt-[var(--space-md)]">
              {slipOrder.slipUrl?.toLowerCase().endsWith(".pdf") ? (
                <a
                  href={media(slipOrder.slipUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn--sm btn--quiet"
                  style={{ margin: "var(--space-md) auto" }}
                >
                </a>
              ) : (
                slipOrder.slipUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={media(slipOrder.slipUrl)} alt={`สลิปโอนเงินของคำสั่งซื้อ ${orderNo(slipOrder.id)}`} loading="lazy" />
                )
              )}
            </div>
            {slipOrder.status === "PENDING_VERIFY" && (
              <div className="mt-[var(--space-md)] flex gap-[var(--space-xs)]">
                <button
                  type="button"
                  onClick={() => updateStatus(slipOrder, "PAID")}
                  className="btn btn--primary flex-1"
                >
                </button>
                <button
                  type="button"
                  onClick={() => reject(slipOrder)}
                  className="btn btn--quiet flex-1"
                >
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
