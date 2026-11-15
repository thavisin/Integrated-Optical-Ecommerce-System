"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { api } from "@/lib/api";
import type { AdminStats } from "@/lib/types";
import { THB, formatDateTime, orderNo, ORDER_STATUS } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import { Spinner, ErrorBanner } from "@/components/ui";

const STATUS_COLORS: Record<string, string> = {
  AWAITING_PAYMENT: "#94a3b8",
  PENDING_VERIFY: "#f59e0b",
  PAID: "#0ea5e9",
  SHIPPED: "#6366f1",
  COMPLETED: "#10b981",
  REJECTED: "#f43f5e",
  CANCELLED: "#cbd5e1",
};

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

  if (loading) return <Spinner label="กำลังโหลดข้อมูลสรุป…" />;
  if (error || !stats)
    return (
      <div>
        <h1 className="text-2xl font-extrabold">📊 Sales Analytics</h1>
        <div className="mt-4">{error && <ErrorBanner message={error} />}</div>
      </div>
    );

  const cards = [
    { label: "รายได้รวม", value: THB(stats.cards.revenue), sub: "นับเฉพาะที่ชำระแล้ว", icon: "💰", color: "text-emerald-600" },
    { label: "คำสั่งซื้อทั้งหมด", value: String(stats.cards.totalOrders), sub: `รอตรวจสลิป ${stats.cards.pendingVerify} รายการ`, icon: "🧾", color: "text-sky-600" },
    { label: "ลูกค้า", value: String(stats.cards.customers), sub: "ผู้ใช้ที่สมัครแล้ว", icon: "👥", color: "text-indigo-600" },
    { label: "สินค้าในระบบ", value: String(stats.cards.products), sub: `สต็อกต่ำ ${stats.cards.lowStock} รายการ`, icon: "📦", color: "text-amber-600" },
  ];

  const pieData = stats.ordersByStatus.map((s) => ({
    ...s,
    label: ORDER_STATUS[s.status]?.label ?? s.status,
  }));

  const monthLabel = (m: string) => {
    const [y, mm] = m.split("-");
    const names = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${names[Number(mm) - 1]} ${Number(y) + 543}`;
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900">📊 Sales Analytics Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">สรุปข้อมูลการสั่งซื้อและยอดขายของร้าน</p>

      {/* stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{c.label}</span>
              <span className="text-2xl">{c.icon}</span>
            </div>
            <div className={`mt-2 text-2xl font-extrabold ${c.color}`}>{c.value}</div>
            <div className="mt-1 text-xs text-slate-400">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* revenue charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="font-bold text-slate-800">รายได้ย้อนหลัง 14 วัน</h2>
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.revenueByDay}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} width={70} tickFormatter={(v: number) => `${v / 1000}k`} />
                <Tooltip
                  formatter={(v: any) => THB(Number(v))}
                  labelFormatter={(l: any) => `วันที่ ${String(l).slice(5)}`}
                />
                <Area type="monotone" dataKey="amount" name="รายได้" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-800">สัดส่วนสถานะคำสั่งซื้อ</h2>
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="count" nameKey="label" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {pieData.map((d) => (
                    <Cell key={d.status} fill={STATUS_COLORS[d.status] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* monthly trend */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="font-bold text-slate-800">แนวโน้มรายได้รายเดือน (6 เดือน)</h2>
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v: string) => monthLabel(v)} />
                <YAxis tick={{ fontSize: 11 }} width={70} tickFormatter={(v: number) => `${v / 1000}k`} />
                <Tooltip formatter={(v: any) => THB(Number(v))} labelFormatter={(l: any) => monthLabel(String(l))} />
                <Bar dataKey="amount" name="รายได้" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* top products */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-800">สินค้าขายดี Top 5 🏆</h2>
          {stats.topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">ยังไม่มีข้อมูลการขาย</p>
          ) : (
            <ol className="mt-3 space-y-3">
              {stats.topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-slate-400">ขายได้ {p.quantity} ชิ้น · {THB(p.revenue)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* recent orders */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800">คำสั่งซื้อล่าสุด</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-indigo-600 hover:underline">
            จัดการคำสั่งซื้อทั้งหมด →
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                <th className="pb-2 font-medium">คำสั่งซื้อ</th>
                <th className="pb-2 font-medium">ลูกค้า</th>
                <th className="pb-2 font-medium">วันที่</th>
                <th className="pb-2 font-medium">ยอดรวม</th>
                <th className="pb-2 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 font-semibold">{orderNo(o.id)}</td>
                  <td className="py-3 text-slate-600">{o.customer}</td>
                  <td className="py-3 text-slate-500">{formatDateTime(o.createdAt)} น.</td>
                  <td className="py-3 font-bold text-indigo-600">{THB(o.total)}</td>
                  <td className="py-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
