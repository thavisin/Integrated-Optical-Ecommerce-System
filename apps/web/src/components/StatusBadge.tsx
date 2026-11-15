import { ORDER_STATUS } from "@/lib/format";

export default function StatusBadge({ status }: { status: string }) {
  const s = ORDER_STATUS[status] || { label: status, badge: "bg-slate-100 text-slate-600" };
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${s.badge}`}>
      {s.label}
    </span>
  );
}
