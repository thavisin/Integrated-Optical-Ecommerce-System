export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/** fetch wrapper — แนบ JWT อัตโนมัติ + แปลง error message จาก API */
// the default generic keeps every existing call site untyped on purpose; each caller narrows its own payload
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    const message = data && typeof data === "object" && "message" in data ? String(data.message) : "";
    throw new Error(message || `เกิดข้อผิดพลาด (${res.status})`);
  }
  return data as T;
}

/** แปลง path รูปภาพจาก backend (/uploads/...) ให้เป็น URL เต็ม */
export function media(src?: string | null): string {
  if (!src) return "";
  return /^https?:\/\//.test(src) ? src : `${API_URL}${src}`;
}
