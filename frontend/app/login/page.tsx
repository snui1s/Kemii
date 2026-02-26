"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { Mail, Lock, LogIn, Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/login", {
        email,
        password,
      });

      const { access_token, user } = res.data;
      if (access_token && user) {
        toast.success("ยินดีต้อนรับกลับมา! 👋");
        login(access_token, user, rememberMe);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || "เข้าสู่ระบบไม่สำเร็จ";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="bg-[var(--background)]/50 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 sm:p-8 text-center border-b border-black/5 dark:border-white/5">
          <h1 className="text-2xl sm:text-3xl font-medium opacity-80 mb-2 text-[var(--foreground)]">เข้าสู่ระบบ</h1>
          <p className="text-sm sm:text-base text-[var(--muted)] opacity-80">ยินดีต้อนรับกลับสู่ Kemii Guild</p>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                อีเมล (Email)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-[var(--muted)]">
                  <Mail size={20} />
                </span>
                <input
                  required
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-black/5 dark:bg-white/5 text-[var(--foreground)] border border-transparent focus:border-[var(--highlight)] rounded-xl outline-none transition placeholder:text-[var(--muted)]/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-[var(--muted)]">
                  <Lock size={20} />
                </span>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 bg-black/5 dark:bg-white/5 text-[var(--foreground)] border border-transparent focus:border-[var(--highlight)] rounded-xl outline-none transition placeholder:text-[var(--muted)]/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors bg-transparent border-none p-0.5"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-[var(--muted)] cursor-pointer hover:text-[var(--foreground)] transition-colors">
                <input
                  type="checkbox"
                  className="rounded border-black/10 dark:border-white/10 text-[var(--highlight)] focus:ring-[var(--highlight)]"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                จดจำฉันไว้
              </label>
              <a href="#" className="text-[var(--highlight)] font-bold hover:underline opacity-80 hover:opacity-100 transition-opacity">
                ลืมรหัสผ่าน?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--highlight)] hover:opacity-90 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl hover:shadow-[var(--highlight)]/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  เข้าสู่ระบบ <LogIn size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 pt-6 border-t border-black/5 dark:border-white/5 text-center">
            <p className="text-sm text-[var(--muted)] mb-4">ยังไม่มีบัญชีใช่ไหม?</p>
            <Link
              href="/register"
              className="block w-full border border-[var(--highlight)] text-[var(--highlight)] font-bold py-2.5 rounded-xl hover:bg-[var(--highlight)] hover:text-white transition text-sm sm:text-base"
            >
              สมัครสมาชิกใหม่
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
