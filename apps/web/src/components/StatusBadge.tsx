import { ORDER_STATUS } from "@/lib/format";

export default function StatusBadge({ status }: { status: string }) {
  const s = ORDER_STATUS[status] || { label: status, chip: "" };
  return <span className={`chip ${s.chip}`}>{s.label}</span>;
}
