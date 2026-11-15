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
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md py-16">
      <div className="well">
        <h1 className="text-2xl">เข้าสู่ระบบ</h1>
        <p className="mt-2 text-sm text-muted">
          เข้าสู่ระบบเพื่อสั่งซื้อและติดตามคำสั่งซื้อ
        </p>

        <form onSubmit={submit} className="stack mt-6">
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

        <p className="mt-4 text-center text-sm text-muted">
          ยังไม่มีบัญชี <Link href="/register" className="font-medium text-ink no-underline hover:underline">สมัครสมาชิกฟรี</Link>
        </p>

        <div className="acct-auth-demo">
          <p className="small flex justify-between gap-4">
            <span>บัญชีทดลองของระบบ</span>
            <span>demo</span>
          </p>
          <p className="small">ลูกค้า customer@example.com / customer123</p>
          <p className="small">แอดมิน admin@optimart.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
