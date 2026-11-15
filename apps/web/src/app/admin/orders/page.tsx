"use client";

import { useCallback, useEffect, useState } from "react";
import { api, media } from "@/lib/api";
import type { Order } from "@/lib/types";
import { THB, formatDateTime, orderNo, ORDER_STATUS } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import { Spinner, ErrorBanner } from "@/components/ui";

const FILTER_TABS = [
  { value: "", label: "ทั้งหมด" },
  { value: "AWAITING_PAYMENT", label: "รอโอนเงิน" },
  { value: "PENDING_VERIFY", label: "รอตรวจสลิป" },
  { value: "PAID", label: "ชำระเงินแล้ว" },
  { value: "SHIPPED", label: "จัดส่งแล้ว" },
  { value: "COMPLETED", label: "สำเร็จ" },
  { value: "REJECTED", label: "ปฏิเสธ" },
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
      showNotice(`อัปเดตคำสั่งซื้อ ${orderNo(order.id)} → ${ORDER_STATUS[status]?.label ?? status} เรียบร้อย`);
      setSlipOrder(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (order: Order) => {
    const reason = window.prompt(`เหตุผลที่ปฏิเสธสลิปคำสั่งซื้อ ${orderNo(order.id)} (จะแสดงให้ลูกค้าเห็น):`);
    if (!reason?.trim()) return;
    await updateStatus(order, "REJECTED", reason);
  };

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;
  const countByStatus = (s: string) => (s ? orders.filter((o) => o.status === s).length : orders.length);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900">🛒 คำสั่งซื้อ / ตรวจสอบสลิป</h1>
      <p className="mt-1 text-sm text-slate-500">
        ดูสลิปโอนเงิน เทียบยอดเงิน แล้วอนุมัติ / ปฏิเสธ / จัดส่งได้จากที่นี่
      </p>

      {notice && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">✓ {notice}</div>
      )}
      {error && <div className="mt-4"><ErrorBanner message={error} /></div>}

      {/* status tabs */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
              filter === t.value
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label} ({countByStatus(t.value)})
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="กำลังโหลดคำสั่งซื้อ…" />
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
          ไม่มีคำสั่งซื้อในสถานะนี้
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">{orderNo(order.id)}</span>
                    <StatusBadge status={order.status} />
                    {order.status === "PENDING_VERIFY" && (
                      <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                        ⏳ ต้องตรวจสอบ
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDateTime(order.createdAt)} น. · ลูกค้า: {order.user?.name} ({order.user?.email})
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-indigo-600">{THB(order.total)}</div>
                  <div className="text-xs text-slate-400">{order.items.reduce((s, i) => s + i.quantity, 0)} ชิ้น</div>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                🚚 จัดส่งถึง: <b>{order.shippingName}</b> · {order.phone}
                <br />
                📮 {order.address}
                {order.note && <><br />📝 หมายเหตุ: {order.note}</>}
              </div>

              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {order.items.map((it) => (
                  <li key={it.id} className="flex justify-between">
                    <span className="line-clamp-1">
                      {it.product?.name ?? `#${it.productId}`} × {it.quantity}
                    </span>
                    <span className="ml-3 shrink-0">{THB(it.price * it.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                {order.slipUrl && (
                  <button
                    onClick={() => setSlipOrder(order)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium hover:bg-slate-50"
                  >
                    🧾 ดูสลิป
                  </button>
                )}
                {order.status === "PENDING_VERIFY" && (
                  <>
                    <button
                      disabled={busyId === order.id}
                      onClick={() => updateStatus(order, "PAID")}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      ✅ อนุมัติสลิป (ชำระเงินแล้ว)
                    </button>
                    <button
                      disabled={busyId === order.id}
                      onClick={() => reject(order)}
                      className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                    >
                      ❌ ปฏิเสธสลิป
                    </button>
                  </>
                )}
                {order.status === "PAID" && (
                  <button
                    disabled={busyId === order.id}
                    onClick={() => updateStatus(order, "SHIPPED")}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    🚚 ทำเครื่องหมายจัดส่งแล้ว
                  </button>
                )}
                {order.status === "SHIPPED" && (
                  <button
                    disabled={busyId === order.id}
                    onClick={() => updateStatus(order, "COMPLETED")}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    ✅ ยืนยันรับสินค้าแล้ว (เสร็จสิ้น)
                  </button>
                )}
                {["AWAITING_PAYMENT", "PENDING_VERIFY", "REJECTED"].includes(order.status) && (
                  <button
                    disabled={busyId === order.id}
                    onClick={() => {
                      if (confirm(`ยกเลิกคำสั่งซื้อ ${orderNo(order.id)}?`)) updateStatus(order, "CANCELLED", "แอดมินยกเลิกคำสั่งซื้อ");
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  >
                    ยกเลิกคำสั่งซื้อ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* slip modal */}
      {slipOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={() => setSlipOrder(null)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">สลิปคำสั่งซื้อ {orderNo(slipOrder.id)}</h3>
              <button onClick={() => setSlipOrder(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">✕</button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              ยอดคำสั่งซื้อ: <b className="text-indigo-600">{THB(slipOrder.total)}</b> — เทียบกับยอดในสลิปก่อนอนุมัติ
            </p>
            <div className="mt-4 rounded-xl bg-slate-100 p-3">
              {slipOrder.slipUrl?.toLowerCase().endsWith(".pdf") ? (
                <a
                  href={media(slipOrder.slipUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl bg-white px-4 py-6 text-center text-sm font-medium text-indigo-600"
                >
                  📄 เปิดไฟล์สลิป (PDF)
                </a>
              ) : (
                slipOrder.slipUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={media(slipOrder.slipUrl)} alt="สลิปโอนเงิน" className="mx-auto max-h-[55vh] rounded-lg object-contain" />
                )
              )}
            </div>
            {slipOrder.status === "PENDING_VERIFY" && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => updateStatus(slipOrder, "PAID")}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  ✅ อนุมัติ
                </button>
                <button
                  onClick={() => reject(slipOrder)}
                  className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-500"
                >
                  ❌ ปฏิเสธ
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
