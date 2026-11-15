"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { AdminStats } from "@/lib/types";
import { THB, formatDateTime, orderNo, ORDER_STATUS } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import { Spinner, ErrorBanner } from "@/components/ui";

const STATUS_SWATCH: Record<string, string> = {
  AWAITING_PAYMENT: "var(--color-rule)",
  PENDING_VERIFY: "var(--color-muted)",
  PAID: "var(--color-accent)",
  SHIPPED: "var(--color-ink-2)",
  COMPLETED: "var(--color-accent-soft)",
  REJECTED: "var(--color-paper-3)",
  CANCELLED: "var(--color-paper-2)",
};

const monthLabel = (m: string) => {
  const [, mm] = m.split("-");
  const names = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return names[Number(mm) - 1];
};

/** เส้นรายได้รายวัน: inline SVG, เส้น 2px เดียวสี accent, เส้นกริด hairline */
function RevenueLine({ data }: { data: { date: string; amount: number }[] }) {
  const W = 720;
  const H = 220;
  const PAD = { top: 12, right: 8, bottom: 26, left: 52 };
  const max = Math.max(...data.map((d) => d.amount), 1);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (innerW * i) / Math.max(data.length - 1, 1);
  const y = (v: number) => PAD.top + innerH - (innerH * v) / max;
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.amount).toFixed(1)}`).join(" ");
  const ticks = [0, 0.5, 1].map((t) => t * max);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img" aria-label={`กราฟรายได้ย้อนหลัง 14 วัน สูงสุดวันละ ${THB(max)}`}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--color-rule)" strokeWidth="1" />
          <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="10">
            {t >= 1000 ? `${Math.round(t / 1000)}k` : Math.round(t)}
          </text>
        </g>
      ))}
      {data.map((d, i) =>
        i % 2 === 0 ? (
          <text key={d.date} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10">
            {d.date.slice(5)}
          </text>
        ) : null
      )}
      <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** แท่งรายเดือน: แท่ง 20px ปลายมนด้านข้อมูลเท่านั้น */
function MonthlyBars({ data }: { data: { month: string; amount: number }[] }) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <ul className="mt-[var(--space-md)] space-y-[var(--space-sm)]" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {data.map((d) => (
        <li key={d.month} className="grid items-center gap-[var(--space-sm)]" style={{ gridTemplateColumns: "3.5rem minmax(0,1fr) 5.5rem" }}>
          <span className="text-sm" style={{ color: "var(--color-ink-2)" }}>{monthLabel(d.month)}</span>
          <span
            role="img"
            aria-label={`${monthLabel(d.month)} รายได้ ${THB(d.amount)}`}
            style={{
              display: "block",
              height: "12px",
              borderRadius: "0 2px 2px 0",
              background: "var(--color-accent)",
              width: `${Math.max((d.amount / max) * 100, d.amount > 0 ? 2 : 0)}%`,
            }}
          />
          <span className="num text-right text-sm" style={{ color: "var(--color-muted)" }}>{THB(d.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/admin/stats")
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="กำลังโหลดข้อมูลสรุป" />;
  if (error || !stats)
    return (
      <div className="stack">
        <h1>สรุปยอดขายของร้าน</h1>
        {error && <ErrorBanner message={error} />}
      </div>
    );

  const cards = [
    { label: "รายได้รวม เฉพาะคำสั่งซื้อที่ชำระแล้ว", value: THB(stats.cards.revenue) },
    { label: `คำสั่งซื้อทั้งหมด มี ${stats.cards.pendingVerify} รายการที่รอตรวจสลิป`, value: String(stats.cards.totalOrders) },
    { label: `ลูกค้าที่สมัครแล้ว ร้านมีสินค้า ${stats.cards.products} รายการ`, value: String(stats.cards.customers) },
    { label: "สินค้าที่สต็อกเหลือไม่เกิน 3 ชิ้น", value: String(stats.cards.lowStock) },
  ];

  const totalOrders = stats.ordersByStatus.reduce((s, o) => s + o.count, 0) || 1;

  return (
    <div className="stack-lg">
      <div>
        <h1>สรุปยอดขายของร้าน</h1>
        <p className="text-sm" style={{ marginTop: "var(--space-2xs)", color: "var(--color-muted)" }}>
          ตัวเลขนับเฉพาะคำสั่งซื้อที่ชำระเงินแล้ว
        </p>
      </div>

      {/* ตัวเลขหลัก */}
      <div className="stat-row card p-[var(--space-lg)]">
        {cards.map((c) => (
          <div className="stat" key={c.label}>
            <b>{c.value}</b>
            <span>{c.label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-[var(--space-lg)] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {/* รายได้ 14 วัน */}
        <section className="card p-[var(--space-lg)]" aria-labelledby="dash-day">
          <h2 id="dash-day" style={{ fontSize: "var(--text-title)" }}>รายได้รายวัน ย้อนหลัง 14 วัน</h2>
          <div className="mt-[var(--space-md)]">
            <RevenueLine data={stats.revenueByDay} />
          </div>
        </section>

        {/* แนวโน้มรายเดือน */}
        <section className="card p-[var(--space-lg)]" aria-labelledby="dash-month">
          <h2 id="dash-month" style={{ fontSize: "var(--text-title)" }}>แนวโน้มรายเดือน 6 เดือน</h2>
          <MonthlyBars data={stats.revenueByMonth} />
        </section>
      </div>

      <div className="grid gap-[var(--space-lg)] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {/* คำสั่งซื้อล่าสุด */}
        <section className="card p-[var(--space-lg)]" aria-labelledby="dash-recent">
          <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-sm)]">
            <h2 id="dash-recent" style={{ fontSize: "var(--text-title)" }}>คำสั่งซื้อล่าสุด</h2>
            <Link href="/admin/orders" className="text-sm no-underline hover:underline" style={{ color: "var(--color-accent-deep)" }}>
              จัดการคำสั่งซื้อทั้งหมด
            </Link>
          </div>
          <div className="tbl-scroll mt-[var(--space-md)]">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">คำสั่งซื้อ</th>
                  <th scope="col">ลูกค้า</th>
                  <th scope="col">วันที่</th>
                  <th scope="col">ยอดรวม</th>
                  <th scope="col">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="num font-medium">{orderNo(o.id)}</td>
                    <td>{o.customer}</td>
                    <td className="num">{formatDateTime(o.createdAt)} น.</td>
                    <td className="num font-medium">{THB(o.total)}</td>
                    <td><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* สัดส่วนสถานะ + สินค้าขายดี */}
        <div className="stack-lg">
          <section className="card p-[var(--space-lg)]" aria-labelledby="dash-status">
            <h2 id="dash-status" style={{ fontSize: "var(--text-title)" }}>สถานะคำสั่งซื้อทั้งหมด</h2>
            <div
              className="mt-[var(--space-md)]"
              role="img"
              aria-label={stats.ordersByStatus.map((s) => `${ORDER_STATUS[s.status]?.label ?? s.status} ${s.count} รายการ`).join(", ")}
              style={{ display: "flex", height: "14px", borderRadius: "var(--radius-pill)", overflow: "hidden", background: "var(--color-paper-2)" }}
            >
              {stats.ordersByStatus.map((s) => (
                <span
                  key={s.status}
                  style={{ width: `${(s.count / totalOrders) * 100}%`, background: STATUS_SWATCH[s.status], flexShrink: 0 }}
                />
              ))}
            </div>
            <ul className="mt-[var(--space-md)] grid grid-cols-2 gap-[var(--space-2xs)]" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {stats.ordersByStatus.map((s) => (
                <li key={s.status} className="chart-legend" style={{ display: "flex", alignItems: "center", gap: "var(--space-2xs)", fontSize: "var(--text-sm)", color: "var(--color-ink-2)" }}>
                  <span className="swatch" style={{ background: STATUS_SWATCH[s.status] }} aria-hidden="true" />
                  {ORDER_STATUS[s.status]?.label ?? s.status}
                  <span className="num" style={{ color: "var(--color-muted)" }}>{s.count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-[var(--space-lg)]" aria-labelledby="dash-top">
            <h2 id="dash-top" style={{ fontSize: "var(--text-title)" }}>สินค้าขายดีที่สุด 5 อันดับ</h2>
            {stats.topProducts.length === 0 ? (
              <p className="mt-[var(--space-sm)] text-sm" style={{ color: "var(--color-muted)" }}>ยังไม่มีข้อมูลการขาย</p>
            ) : (
              <ol className="mt-[var(--space-md)] space-y-[var(--space-xs)]" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {stats.topProducts.map((p, i) => (
                  <li key={p.name} className="flex items-baseline gap-[var(--space-sm)]">
                    <span className="num" style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 block text-sm font-medium">{p.name}</span>
                      <span className="num text-xs" style={{ color: "var(--color-muted)" }}>ขายได้ {p.quantity} ชิ้น {THB(p.revenue)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
