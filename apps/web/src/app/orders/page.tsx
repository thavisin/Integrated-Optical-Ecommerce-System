"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";
import { THB, formatDateTime, orderNo } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import { Spinner, EmptyState } from "@/components/ui";

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    api("/api/orders")
      .then((d) => setOrders(d.orders))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || (loading && user)) return <Spinner label="กำลังโหลดประวัติการสั่งซื้อ…" />;

  if (!user)
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState icon="🔐" title="กรุณาเข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อ">
          <Link href="/login" className="mt-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white">
            เข้าสู่ระบบ
          </Link>
        </EmptyState>
      </div>
    );

  if (error) return <div className="mx-auto max-w-3xl px-4 py-12"><EmptyState icon="⚠️" title={error} /></div>;

  if (orders.length === 0)
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState icon="🧾" title="ยังไม่มีประวัติการสั่งซื้อ">
          <Link href="/products" className="mt-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white">
            เริ่มช้อปปิ้งกันเลย →
          </Link>
        </EmptyState>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-slate-900">คำสั่งซื้อของฉัน 🧾</h1>
      <p className="mt-1 text-sm text-slate-500">ติดตามสถานะและดูรายละเอียดคำสั่งซื้อทั้งหมด</p>

      <div className="mt-6 space-y-4">
        {orders.map((order) => {
          const firstItem = order.items[0];
          const extraCount = order.items.length - 1;
          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900">{orderNo(order.id)}</div>
                  <div className="text-xs text-slate-400">{formatDateTime(order.createdAt)} น.</div>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-slate-600">
                  {firstItem?.product?.name ?? firstItem?.productId}
                  {extraCount > 0 && <span className="text-slate-400"> และอีก {extraCount} รายการ</span>}
                </span>
                <span className="text-lg font-extrabold text-indigo-600">{THB(order.total)}</span>
              </div>
              {order.status === "REJECTED" && order.note && (
                <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  ❌ สลิปถูกปฏิเสธ: {order.note}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
