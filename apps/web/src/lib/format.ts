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
  chip: string;
  step: number; // -1 = ไม่อยู่ใน timeline ปกติ
}

/* Solstice: vermilion only where the owner must act (PENDING_VERIFY) and REJECTED as outline; paid/shipped in ink, completed in gold hairline, owed/cancelled muted */
export const ORDER_STATUS: Record<string, StatusMeta> = {
  AWAITING_PAYMENT: { label: "รอโอนเงินและสลิป", chip: "chip--muted", step: 0 },
  PENDING_VERIFY: { label: "รอตรวจสอบสลิป", chip: "chip--signal", step: 1 },
  PAID: { label: "ชำระเงินแล้ว", chip: "chip--outline", step: 2 },
  SHIPPED: { label: "จัดส่งแล้ว", chip: "chip--ink", step: 3 },
  COMPLETED: { label: "สำเร็จ", chip: "chip--gold", step: 4 },
  REJECTED: { label: "สลิปไม่ถูกต้อง", chip: "chip--outline chip--signal-line", step: -1 },
  CANCELLED: { label: "ยกเลิกแล้ว", chip: "chip--muted", step: -1 },
};

export const ORDER_TIMELINE_STEPS = [
  { key: "AWAITING_PAYMENT", label: "รอโอนเงิน" },
  { key: "PENDING_VERIFY", label: "รอตรวจสลิป" },
  { key: "PAID", label: "ชำระแล้ว" },
  { key: "SHIPPED", label: "จัดส่งแล้ว" },
  { key: "COMPLETED", label: "สำเร็จ" },
];
