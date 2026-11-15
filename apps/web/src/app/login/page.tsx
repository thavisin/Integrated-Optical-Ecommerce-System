"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ErrorBanner } from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(email, password);
      router.push(user.role === "ADMIN" ? "/admin" : "/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md" style={{ paddingBlock: "var(--section-gap-s)" }}>
      <div className="card p-[var(--space-xl)]">
        <h1 style={{ fontSize: "var(--text-2xl)" }}>เข้าสู่ระบบ</h1>
        <p className="text-sm" style={{ marginTop: "var(--space-2xs)", color: "var(--color-muted)" }}>
          เข้าสู่ระบบเพื่อสั่งซื้อและติดตามคำสั่งซื้อ
        </p>

        <form onSubmit={submit} className="mt-[var(--space-lg)] stack">
          <div>
            <label className="label" htmlFor="login-email">อีเมล</label>
            <input
              id="login-email"
              type="email"
              required
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="login-password">รหัสผ่าน</label>
            <input
              id="login-password"
              type="password"
              required
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
            />
          </div>

          {error && <ErrorBanner message={error} />}

          <button disabled={loading} className="btn btn--primary w-full" aria-busy={loading}>
            {loading ? "กำลังตรวจสอบ" : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="mt-[var(--space-md)] text-center text-sm" style={{ color: "var(--color-muted)" }}>
          ยังไม่มีบัญชี <Link href="/register" className="font-medium no-underline hover:underline" style={{ color: "var(--color-accent-deep)" }}>สมัครสมาชิกฟรี</Link>
        </p>
      </div>

      <div className="pharm-label mt-[var(--space-md)]">
        <p className="pharm-head">
          <span>บัญชีทดลองของระบบ</span>
          <span>demo</span>
        </p>
        <p className="mt-[var(--space-xs)]" style={{ display: "grid", gap: "var(--space-2xs)" }}>
          <span>ลูกค้า customer@example.com / customer123</span>
          <span>แอดมิน admin@optimart.com / admin123</span>
        </p>
      </div>
    </div>
  );
}
