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
  const [rejectTarget, setRejectTarget] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api("/api/orders?all=true");
      setOrders(d.orders);
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

  // Escape closes whichever dialog is open
  useEffect(() => {
    if (!slipOrder && !rejectTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSlipOrder(null);
      setRejectTarget(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slipOrder, rejectTarget]);

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
      setRejectTarget(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  const askReject = (order: Order) => {
    setRejectReason("");
    setSlipOrder(null);
    setRejectTarget(order);
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    await updateStatus(rejectTarget, "REJECTED", rejectReason.trim());
  };

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;
  const countByStatus = (s: string) => (s ? orders.filter((o) => o.status === s).length : orders.length);

  return (
    <div className="stack-lg">
      <div>
        <h1>คำสั่งซื้อและการตรวจสลิป</h1>
        <p className="mt-2 text-sm text-muted">
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
        <div className="empty">
          <p className="text-sm text-muted">ไม่มีคำสั่งซื้อในสถานะนี้</p>
        </div>
      ) : (
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">คำสั่งซื้อ</th>
                <th scope="col">ลูกค้า</th>
                <th scope="col">รายการ</th>
                <th scope="col">ยอดรวม</th>
                <th scope="col" className="text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className="num font-medium text-ink whitespace-nowrap">{orderNo(order.id)}</span>
                    <span className="adm-cell-note num whitespace-nowrap">{formatDateTime(order.createdAt)} น.</span>
                    <span className="mt-1 block"><StatusBadge status={order.status} /></span>
                  </td>
                  <td>
                    <span className="font-medium">{order.user?.name}</span>
                    <span className="adm-cell-note">({order.user?.email})</span>
                    <span className="adm-cell-note">ส่งถึง {order.shippingName} เบอร์ {order.phone}</span>
                    <span className="adm-cell-note">{order.address}</span>
                    {order.note && <span className="adm-cell-note">หมายเหตุ {order.note}</span>}
                  </td>
                  <td>
                    <ul className="adm-items">
                      {order.items.map((it) => (
                        <li key={it.id}>
                          <span className="line-clamp-1">
                            {it.product?.name ?? `สินค้าหมายเลข ${it.productId}`} <span className="num">x{it.quantity}</span>
                          </span>
                          <span className="num shrink-0">{THB(it.price * it.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <span className="num font-medium text-ink">{THB(order.total)}</span>
                    <span className="adm-cell-note num">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} ชิ้น
                    </span>
                  </td>
                  <td>
                    <div className="adm-acts justify-end">
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
                            อนุมัติสลิป
                          </button>
                          <button
                            type="button"
                            disabled={busyId === order.id}
                            onClick={() => askReject(order)}
                            className="btn btn--sm btn--quiet"
                          >
                            ปฏิเสธสลิป
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
                          ทำเครื่องหมายจัดส่งแล้ว
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
                          ทำเครื่องหมายสำเร็จ
                        </button>
                      )}
                      {["AWAITING_PAYMENT", "PENDING_VERIFY", "REJECTED"].includes(order.status) && (
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => {
                            if (confirm(`ยกเลิกคำสั่งซื้อ ${orderNo(order.id)}?`)) updateStatus(order, "CANCELLED", "แอดมินยกเลิกคำสั่งซื้อ");
                          }}
                          className="btn btn--sm btn--quiet text-muted"
                        >
                          ยกเลิกคำสั่งซื้อ
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* slip modal */}
      {slipOrder && (
        <div className="modal-scrim" onClick={() => setSlipOrder(null)}>
          <div className="modal adm-slip-modal" role="dialog" aria-modal="true" aria-labelledby="slip-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="slip-modal-title">
                  สลิปของ {orderNo(slipOrder.id)}
                </h2>
                <p className="num mt-2 text-sm text-muted">
                  ยอดคำสั่งซื้อ {THB(slipOrder.total)} เทียบกับยอดในสลิปก่อนอนุมัติ
                </p>
              </div>
              <button type="button" onClick={() => setSlipOrder(null)} className="icon-btn" aria-label="ปิดหน้าต่าง" autoFocus>
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <div className="adm-slip mt-4">
              {slipOrder.slipUrl?.toLowerCase().endsWith(".pdf") ? (
                <a
                  href={media(slipOrder.slipUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn--sm btn--quiet"
                  style={{ margin: "var(--space-md) auto" }}
                >
                  เปิดสลิปเป็น PDF
                </a>
              ) : (
                slipOrder.slipUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={media(slipOrder.slipUrl)} alt={`สลิปโอนเงินของคำสั่งซื้อ ${orderNo(slipOrder.id)}`} loading="lazy" />
                )
              )}
            </div>
            {slipOrder.status === "PENDING_VERIFY" && (
              <div className="adm-acts mt-4">
                <button
                  type="button"
                  onClick={() => updateStatus(slipOrder, "PAID")}
                  className="btn btn--primary flex-1"
                >
                  อนุมัติสลิป
                </button>
                <button
                  type="button"
                  onClick={() => askReject(slipOrder)}
                  className="btn btn--quiet flex-1"
                >
                  ปฏิเสธสลิป
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* reject dialog: the reason is a square textarea, shown to the customer */}
      {rejectTarget && (
        <div className="modal-scrim" onClick={() => setRejectTarget(null)}>
          <div className="modal adm-slip-modal" role="dialog" aria-modal="true" aria-labelledby="reject-title" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h2 id="reject-title">ปฏิเสธสลิปของ {orderNo(rejectTarget.id)}</h2>
              <button type="button" onClick={() => setRejectTarget(null)} className="icon-btn" aria-label="ปิดหน้าต่าง">
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <div className="adm-reject mt-4">
              <div>
                <label className="label" htmlFor="reject-reason">เหตุผลที่สลิปไม่ผ่าน ลูกค้าจะเห็นข้อความนี้</label>
                <textarea
                  id="reject-reason"
                  rows={3}
                  autoFocus
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="field"
                  placeholder="เช่น ยอดเงินในสลิปไม่ตรงกับยอดคำสั่งซื้อ"
                />
              </div>
              <div className="adm-acts justify-end">
                <button type="button" onClick={() => setRejectTarget(null)} className="btn btn--sm btn--quiet">
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmReject}
                  disabled={!rejectReason.trim() || busyId === rejectTarget.id}
                  className="btn btn--sm"
                  aria-busy={busyId === rejectTarget.id}
                >
                  ยืนยันการปฏิเสธ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
