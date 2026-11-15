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
    if (authLoading || !user) return;
    api("/api/orders")
      .then((d) => setOrders(d.orders))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || (loading && user)) return <Spinner label="กำลังโหลดประวัติการสั่งซื้อ" />;

  if (!user)
    return (
      <div className="container max-w-3xl py-16">
        <EmptyState icon="auth" title="เข้าสู่ระบบก่อนจึงจะเห็นประวัติการสั่งซื้อของคุณ">
          <Link href="/login" className="btn btn--sm btn--primary mt-2">เข้าสู่ระบบ</Link>
        </EmptyState>
      </div>
    );

  if (error)
    return (
      <div className="container max-w-3xl py-16">
        <EmptyState icon="warn" title={error} />
      </div>
    );

  if (orders.length === 0)
    return (
      <div className="container max-w-3xl py-16">
        <EmptyState icon="orders" title="ยังไม่มีประวัติการสั่งซื้อ">
          <Link href="/products" className="btn btn--sm btn--primary mt-2">เริ่มเลือกแว่นตา</Link>
        </EmptyState>
      </div>
    );

  return (
    <div className="container max-w-4xl py-10">
      <h1>คำสั่งซื้อของฉัน</h1>
      <p className="lead mt-2 text-muted">
        ทุกคำสั่งซื้อพร้อมสถานะการตรวจสลิปและการจัดส่ง
      </p>

      <div className="tbl-scroll mt-10" tabIndex={0} role="region" aria-label="ตารางคำสั่งซื้อ">
        <table className="tbl acct-orders">
          <thead>
            <tr>
              <th scope="col">คำสั่งซื้อ</th>
              <th scope="col">วันที่</th>
              <th scope="col">รายการ</th>
              <th scope="col" className="text-right">ยอดรวม</th>
              <th scope="col">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const firstItem = order.items[0];
              const extraCount = order.items.length - 1;
              return (
                <tr key={order.id}>
                  <td>
                    <Link
                      href={`/orders/${order.id}`}
                      className="num font-medium text-ink no-underline hover:underline"
                    >
                      {orderNo(order.id)}
                    </Link>
                  </td>
                  <td className="num whitespace-nowrap text-muted">{formatDateTime(order.createdAt)} น.</td>
                  <td>
                    {firstItem?.product?.name ?? `สินค้าหมายเลข ${firstItem?.productId}`}
                    {extraCount > 0 && <span className="text-muted"> และอีก {extraCount} รายการ</span>}
                    {order.status === "REJECTED" && order.note && (
                      <span className="small mt-1 block">
                        สลิปไม่ผ่านการตรวจ: {order.note} ส่งสลิปใหม่ได้ในหน้ารายละเอียด
                      </span>
                    )}
                  </td>
                  <td className="num text-right font-medium text-ink">{THB(order.total)}</td>
                  <td><StatusBadge status={order.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
