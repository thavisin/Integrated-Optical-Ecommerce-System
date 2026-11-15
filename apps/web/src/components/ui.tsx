"use client";

import { CircleNotch, Warning, Package } from "@phosphor-icons/react";

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 py-16 text-ink">
      <CircleNotch size={28} weight="bold" aria-hidden="true" className="keep-motion animate-spin" />
      {label && <span className="small">{label}</span>}
      <span className="visually-hidden" role="status">{label || "กำลังโหลด"}</span>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="noty noty--err flex items-start gap-2" role="alert">
      <Warning size={16} weight="bold" aria-hidden="true" className="mt-[0.2em] shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      <span aria-hidden="true"><Package size={40} weight="light" /></span>
      <p className="font-medium text-ink">{title}</p>
      {children}
      <span className="visually-hidden">{icon}</span>
    </div>
  );
}
