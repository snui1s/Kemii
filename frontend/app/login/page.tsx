"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { Mail, Lock, LogIn, Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
      const res = await axios.post(`${API_URL}/login`, {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-8 text-center bg-indigo-600 text-white">
          <h1 className="text-3xl font-bold mb-2">เข้าสู่ระบบ</h1>
          <p className="text-indigo-200">ยินดีต้อนรับกลับสู่ Kemii Guild</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                อีเมล (Email)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-700 dark:text-slate-300">
                  <Mail size={20} />
                </span>
                <input
                  required
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-slate-700 dark:text-slate-300 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-700 dark:text-slate-300">
                  <Lock size={20} />
                </span>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-50 text-slate-700 dark:text-slate-300 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors bg-transparent border-none p-0.5"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                จดจำฉันไว้
              </label>
              <a href="#" className="text-indigo-600 font-bold hover:underline">
                ลืมรหัสผ่าน?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
            <p className="text-slate-500 mb-4">ยังไม่มีบัญชีใช่ไหม?</p>
            <Link
              href="/register"
              className="block w-full border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 font-bold py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
            >
              สมัครสมาชิกใหม่
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
