export const THB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const orderNo = (id: number) => `GM-${String(id).padStart(5, "0")}`;

export const CATEGORIES = [
  { value: "FRAME", label: "กรอบแว่น" },
  { value: "SUNGLASS", label: "แว่นกันแดด" },
  { value: "LENS", label: "เลนส์" },
  { value: "ACCESSORY", label: "อุปกรณ์เสริม" },
];

export const categoryLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label ?? v;

interface StatusMeta {
  label: string;
  badge: string;
  step: number; // -1 = ไม่อยู่ใน timeline ปกติ
}

export const ORDER_STATUS: Record<string, StatusMeta> = {
  AWAITING_PAYMENT: { label: "รอโอนเงิน/ส่งสลิป", badge: "bg-slate-200 text-slate-700", step: 0 },
  PENDING_VERIFY: { label: "รอตรวจสอบสลิป", badge: "bg-amber-100 text-amber-800", step: 1 },
  PAID: { label: "ชำระเงินแล้ว", badge: "bg-sky-100 text-sky-800", step: 2 },
  SHIPPED: { label: "จัดส่งแล้ว", badge: "bg-indigo-100 text-indigo-800", step: 3 },
  COMPLETED: { label: "สำเร็จ", badge: "bg-emerald-100 text-emerald-800", step: 4 },
  REJECTED: { label: "สลิปไม่ถูกต้อง", badge: "bg-rose-100 text-rose-700", step: -1 },
  CANCELLED: { label: "ยกเลิกแล้ว", badge: "bg-slate-200 text-slate-500", step: -1 },
};

export const ORDER_TIMELINE_STEPS = [
  { key: "AWAITING_PAYMENT", label: "รอโอนเงิน", icon: "🧾" },
  { key: "PENDING_VERIFY", label: "รอตรวจสอบสลิป", icon: "🔍" },
  { key: "PAID", label: "ชำระเงินแล้ว", icon: "💳" },
  { key: "SHIPPED", label: "จัดส่งแล้ว", icon: "🚚" },
  { key: "COMPLETED", label: "สำเร็จ", icon: "✅" },
];
