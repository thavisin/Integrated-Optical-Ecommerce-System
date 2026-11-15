"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ErrorBanner } from "@/components/ui";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register(form.name, form.email, form.password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md py-16">
      <div className="well">
        <h1 className="text-2xl">สมัครสมาชิก</h1>
        <p className="mt-2 text-sm text-muted">
          สมัครฟรี ใช้เวลาไม่ถึงหนึ่งนาที
        </p>

        <form onSubmit={submit} className="stack mt-6">
          <div>
            <label className="label" htmlFor="reg-name">ชื่อนามสกุล</label>
            <input
              id="reg-name"
              required
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="reg-email">อีเมล</label>
            <input
              id="reg-email"
              type="email"
              required
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="reg-password">รหัสผ่าน อย่างน้อย 6 ตัวอักษร</label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={6}
              name="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="reg-confirm">ยืนยันรหัสผ่าน</label>
            <input
              id="reg-confirm"
              type="password"
              required
              name="confirm"
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className="field"
            />
            <p className="help" id="reg-help">{error ? "" : "ใช้อักขระอะไรก็ได้ตั้งแต่ 6 ตัวขึ้นไป"}</p>
          </div>

          {error && <ErrorBanner message={error} />}

          <button type="submit" disabled={loading} className="btn btn--primary w-full" aria-busy={loading}>
            {loading ? "กำลังสมัครสมาชิก" : "สมัครสมาชิก"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          มีบัญชีแล้ว <Link href="/login" className="font-medium text-ink no-underline hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}
