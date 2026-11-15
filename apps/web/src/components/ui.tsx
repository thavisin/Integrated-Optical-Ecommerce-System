"use client";

import { CircleNotch, Warning, Package } from "@phosphor-icons/react";

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-[var(--space-sm)] py-16" style={{ color: "var(--color-muted)" }}>
      <CircleNotch size={28} weight="bold" aria-hidden="true" className="keep-motion animate-spin" />
      {label && <span className="text-sm">{label}</span>}
      <span className="visually-hidden" role="status">{label || "กำลังโหลด"}</span>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="noty noty--err" role="alert" style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2xs)" }}>
      <Warning size={16} weight="bold" aria-hidden="true" style={{ flexShrink: 0, marginTop: "0.2em" }} />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: React.ReactNode }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-[var(--space-sm)] rounded-[var(--radius-card)] py-20 text-center"
      style={{ border: "1px dashed var(--color-rule)", background: "var(--color-paper)" }}
    >
      <span aria-hidden="true"><Package size={40} weight="light" style={{ color: "var(--color-muted)" }} /></span>
      <p className="font-medium" style={{ color: "var(--color-ink-2)" }}>{title}</p>
      {children}
      <span className="visually-hidden">{icon}</span>
    </div>
  );
}
