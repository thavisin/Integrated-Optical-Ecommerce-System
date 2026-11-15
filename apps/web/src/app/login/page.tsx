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
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-extrabold text-slate-900">เข้าสู่ระบบ 👋</h1>
        <p className="mt-1 text-center text-sm text-slate-500">เข้าสู่ระบบเพื่อสั่งซื้อและติดตามคำสั่งซื้อ</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-600">อีเมล</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-600">รหัสผ่าน</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
          </label>

          {error && <ErrorBanner message={error} />}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="font-semibold text-indigo-600 hover:underline">
            สมัครสมาชิกฟรี
          </Link>
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-xs text-slate-500">
        <p className="font-semibold text-slate-600">บัญชีทดสอบระบบ (seed)</p>
        <p className="mt-1">👤 ลูกค้า: customer@example.com / customer123</p>
        <p>🛡️ แอดมิน: admin@optimart.com / admin123</p>
      </div>
    </div>
  );
}
