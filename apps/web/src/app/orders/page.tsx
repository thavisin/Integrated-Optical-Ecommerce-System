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

  if (authLoading || (loading && user)) return <Spinner label="กำลังโหลดประวัติการสั่งซื้อ" />;

  if (!user)
    return (
      <div className="container max-w-3xl" style={{ paddingBlock: "var(--space-2xl)" }}>
        <EmptyState icon="auth" title="เข้าสู่ระบบก่อนจึงจะเห็นประวัติการสั่งซื้อของคุณ">
          <Link href="/login" className="btn btn--sm mt-[var(--space-2xs)] btn--primary">เข้าสู่ระบบ</Link>
        </EmptyState>
      </div>
    );

  if (error)
    return (
      <div className="container max-w-3xl" style={{ paddingBlock: "var(--space-2xl)" }}>
        <EmptyState icon="warn" title={error} />
      </div>
    );

  if (orders.length === 0)
    return (
      <div className="container max-w-3xl" style={{ paddingBlock: "var(--space-2xl)" }}>
        <EmptyState icon="orders" title="ยังไม่มีประวัติการสั่งซื้อ">
          <Link href="/products" className="btn btn--sm mt-[var(--space-2xs)] btn--primary">เริ่มเลือกแว่นตา</Link>
        </EmptyState>
      </div>
    );

  return (
    <div className="container max-w-4xl" style={{ paddingBlock: "var(--space-lg) var(--section-gap-s)" }}>
      <h1>คำสั่งซื้อของฉัน</h1>
      <p className="text-sm" style={{ marginTop: "var(--space-2xs)", color: "var(--color-muted)" }}>
        ทุกคำสั่งซื้อพร้อมสถานะการตรวจสลิปและการจัดส่ง
      </p>

      <ul className="card mt-[var(--space-xl)] divide-y" style={{ borderColor: "var(--color-rule)", listStyle: "none", margin: 0, padding: 0 }}>
        {orders.map((order) => {
          const firstItem = order.items[0];
          const extraCount = order.items.length - 1;
          return (
            <li key={order.id} className="border-b last:border-b-0" style={{ borderColor: "var(--color-rule)" }}>
              <Link
                href={`/orders/${order.id}`}
                className="block p-[var(--space-lg)] no-underline transition-colors duration-[var(--dur-short)] hover:bg-[var(--color-paper-2)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-[var(--space-sm)]">
                  <div>
                    <p className="num font-medium" style={{ color: "var(--color-ink)" }}>{orderNo(order.id)}</p>
                    <p className="num text-xs" style={{ color: "var(--color-muted)" }}>{formatDateTime(order.createdAt)} น.</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="mt-[var(--space-sm)] flex flex-wrap items-center justify-between gap-[var(--space-sm)] text-sm">
                  <span style={{ color: "var(--color-ink-2)" }}>
                    {firstItem?.product?.name ?? `สินค้าหมายเลข ${firstItem?.productId}`}
                    {extraCount > 0 && <span style={{ color: "var(--color-muted)" }}> และอีก {extraCount} รายการ</span>}
                  </span>
                  <span className="num font-bold" style={{ color: "var(--color-accent-deep)" }}>{THB(order.total)}</span>
                </div>
                {order.status === "REJECTED" && order.note && (
                  <p className="mt-[var(--space-xs)] text-xs" style={{ color: "var(--color-muted)" }}>
                    สลิปไม่ผ่านการตรวจ: {order.note} ส่งสลิปใหม่ได้ในหน้ารายละเอียด
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
